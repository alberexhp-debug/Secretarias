import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt, fetchNewEmails } from "@/lib/imap";
import { chatWithSecretary, buildSystemPrompt } from "@/lib/ai";

// Vercel cron / manual trigger — protected by CRON_SECRET
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization");
  if (process.env.CRON_SECRET && secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only process IMAP accounts (Gmail/Outlook OAuth polling handled separately via Graph webhooks)
  const accounts = await prisma.connectedEmailAccount.findMany({
    where: { provider: "imap", connected: true },
    include: { user: { include: { secretary: true } } },
  });

  let processed = 0;
  let errors = 0;

  for (const account of accounts) {
    if (!account.imapPassword || !account.imapHost) continue;
    const user = account.user;
    if (!user?.secretary) continue;

    try {
      const password = decrypt(account.imapPassword);
      const { emails, newLastUid } = await fetchNewEmails(
        { email: account.email, imapHost: account.imapHost, imapPort: account.imapPort || 993, password, smtpHost: account.smtpHost || "", smtpPort: account.smtpPort || 587 },
        account.lastUid
      );

      for (const email of emails) {
        // Skip emails sent by the account itself
        if (email.from.toLowerCase() === account.email.toLowerCase()) continue;

        await processIncomingEmail({
          userId: user.id,
          accountId: account.id,
          secretary: user.secretary,
          fromEmail: email.from,
          fromName: email.fromName,
          subject: email.subject,
          body: email.body,
        });
        processed++;
      }

      // Update lastUid and lastChecked
      await prisma.connectedEmailAccount.update({
        where: { id: account.id },
        data: { lastUid: newLastUid || account.lastUid, lastChecked: new Date() },
      });
    } catch (err) {
      console.error(`[cron] Error processing account ${account.email}:`, err);
      errors++;
    }
  }

  return NextResponse.json({ ok: true, processed, errors, accounts: accounts.length });
}

async function processIncomingEmail(opts: {
  userId: string;
  accountId: string;
  secretary: { name: string; tone: string; businessName: string; businessDesc: string; city: string; faqs: string; rules: string; systemPrompt: string };
  fromEmail: string;
  fromName: string;
  subject: string;
  body: string;
}) {
  const { userId, secretary, fromEmail, fromName, subject, body } = opts;

  // Build system prompt
  let faqs: Array<{ q: string; a: string }> = [];
  let rules: string[] = [];
  try { faqs = JSON.parse(secretary.faqs); } catch { faqs = []; }
  try { rules = JSON.parse(secretary.rules); } catch { rules = []; }

  const basePrompt = secretary.systemPrompt || buildSystemPrompt({
    name: secretary.name, tone: secretary.tone, businessName: secretary.businessName,
    businessDesc: secretary.businessDesc, city: secretary.city, schedule: {}, faqs, rules,
  });

  // Fetch style examples
  const styleExamples = await prisma.emailStyleExample.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { originalDraft: true, editedVersion: true, wasEdited: true },
  });

  let styleContext = "";
  if (styleExamples.length > 0) {
    const corrections = styleExamples.filter((e) => e.wasEdited);
    const approvals = styleExamples.filter((e) => !e.wasEdited);
    if (corrections.length > 0) {
      styleContext += "\n\nCORRECCIONES DEL DUEÑO (aprende de estas diferencias):\n";
      corrections.slice(0, 4).forEach((ex, i) => {
        styleContext += `\nEj ${i + 1}:\n  BORRADOR: ${ex.originalDraft.slice(0, 200)}\n  VERSIÓN PREFERIDA: ${ex.editedVersion.slice(0, 200)}\n`;
      });
    }
    if (approvals.length > 0) {
      styleContext += "\n\nEJEMPLOS APROBADOS (imita este estilo):\n";
      approvals.slice(0, 3).forEach((ex) => styleContext += `\n${ex.editedVersion.slice(0, 200)}\n`);
    }
  }

  const emailPrompt = basePrompt + "\n\nESTÁS RESPONDIENDO UN EMAIL. Incluye saludo y despedida. Máximo 5 oraciones." + styleContext;

  // Classify
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const CATEGORIES = ["consulta_general", "solicitud_cita", "presupuesto", "queja_reclamacion", "cancelacion", "seguimiento", "otro"] as const;
  const CATEGORY_LABELS: Record<string, string> = {
    consulta_general: "Consulta general", solicitud_cita: "Solicitud de cita", presupuesto: "Solicitud de presupuesto",
    queja_reclamacion: "Queja o reclamación", cancelacion: "Cancelación", seguimiento: "Seguimiento", otro: "Otro",
  };

  let category = "otro";
  if (process.env.ANTHROPIC_API_KEY) {
    const catRes = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001", max_tokens: 20,
      system: `Clasifica el email en UNA de: ${CATEGORIES.join(", ")}. Responde SOLO la clave.`,
      messages: [{ role: "user", content: `Asunto: ${subject}\n\n${body.slice(0, 500)}` }],
    });
    const raw = catRes.content[0].type === "text" ? catRes.content[0].text.trim() : "otro";
    category = CATEGORIES.includes(raw as typeof CATEGORIES[number]) ? raw : "otro";
  }

  const suggestedReply = await chatWithSecretary(
    [{ role: "user", content: `Email de ${fromName}:\nAsunto: ${subject}\n\n${body}` }],
    emailPrompt
  );

  // Find/create contact
  let contact = await prisma.contact.findFirst({ where: { userId, email: fromEmail } });
  if (!contact) {
    contact = await prisma.contact.create({ data: { userId, name: fromName, email: fromEmail, channel: "email", firstContactAt: new Date(), lastInteraction: new Date() } });
  } else {
    await prisma.contact.update({ where: { id: contact.id }, data: { lastInteraction: new Date() } });
  }

  const conversation = await prisma.conversation.create({
    data: { userId, contactId: contact.id, channel: "email", status: "active", subject, lastMessage: body.slice(0, 200), lastMessageAt: new Date() },
  });

  await prisma.message.create({ data: { conversationId: conversation.id, sender: "client", content: body, channel: "email", status: "read", metadata: JSON.stringify({ subject, fromEmail, fromName }) } });
  await prisma.message.create({
    data: {
      conversationId: conversation.id, sender: "secretary", content: suggestedReply, channel: "email", status: "pending",
      metadata: JSON.stringify({ category, categoryLabel: CATEGORY_LABELS[category] || "Otro", subject: `Re: ${subject}`, toEmail: fromEmail, toName: fromName, isSuggestion: true }),
    },
  });

  await prisma.notification.create({ data: { userId, type: "info", title: `📧 ${CATEGORY_LABELS[category] || "Email"}: ${fromName}`, body: subject } });
  await prisma.activityLog.create({ data: { userId, action: "email_received", description: `Email de ${fromName}: ${subject}`, contactName: fromName, channel: "email", entityType: "conversation", entityId: conversation.id } });
}
