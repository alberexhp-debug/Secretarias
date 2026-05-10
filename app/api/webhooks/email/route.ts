import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chatWithSecretary, buildSystemPrompt } from "@/lib/ai";

// Resend inbound webhook payload (simplified)
interface ResendInboundPayload {
  from: string;
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
}

const EMAIL_CATEGORIES = [
  "consulta_general",
  "solicitud_cita",
  "presupuesto",
  "queja_reclamacion",
  "cancelacion",
  "seguimiento",
  "otro",
] as const;

type EmailCategory = typeof EMAIL_CATEGORIES[number];

const CATEGORY_LABELS: Record<EmailCategory, string> = {
  consulta_general: "Consulta general",
  solicitud_cita: "Solicitud de cita",
  presupuesto: "Solicitud de presupuesto",
  queja_reclamacion: "Queja o reclamación",
  cancelacion: "Cancelación",
  seguimiento: "Seguimiento",
  otro: "Otro",
};

async function classifyEmail(subject: string, body: string, systemPrompt: string): Promise<EmailCategory> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 20,
    system: `Clasifica el email en UNA de estas categorías: ${EMAIL_CATEGORIES.join(", ")}. Responde SOLO con la clave exacta, sin explicación.`,
    messages: [{ role: "user", content: `Asunto: ${subject}\n\n${body.slice(0, 500)}` }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "otro";
  return EMAIL_CATEGORIES.includes(raw as EmailCategory) ? (raw as EmailCategory) : "otro";
}

export async function POST(req: NextRequest) {
  // Verify the webhook is from Resend (optional secret check)
  const secret = req.headers.get("x-resend-signature");
  if (process.env.EMAIL_WEBHOOK_SECRET && secret !== process.env.EMAIL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: ResendInboundPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { from, subject, text, html } = payload;
  const body = text || html?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";

  // Extract sender email
  const fromEmail = from.match(/<(.+)>/)?.[1] || from;
  const fromName = from.match(/^(.+)\s*</)?.[1]?.trim() || fromEmail;

  // Find which user's secretary this email was sent to
  // The "to" field contains the secretary's inbound address (e.g. secretaria-USER_ID@inbound.secretarios-ia.com)
  const toAddress = payload.to?.[0] || "";
  const userIdMatch = toAddress.match(/secretaria-([a-z0-9]+)@/);

  let userId: string | null = null;
  if (userIdMatch) {
    userId = userIdMatch[1];
  } else {
    // Fallback: find user by their configured emailAddress
    const secretary = await prisma.secretary.findFirst({
      where: { emailConnected: true, emailAddress: { not: null } },
      select: { userId: true },
    });
    userId = secretary?.userId || null;
  }

  if (!userId) {
    return NextResponse.json({ ok: true, skipped: "no_user" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { secretary: true },
  });

  if (!user?.secretary) {
    return NextResponse.json({ ok: true, skipped: "no_secretary" });
  }

  const secretary = user.secretary;

  // Parse secretary config
  let faqs: Array<{ q: string; a: string }> = [];
  let rules: string[] = [];
  try { faqs = secretary.faqs ? JSON.parse(secretary.faqs) : []; } catch { faqs = []; }
  try { rules = secretary.rules ? JSON.parse(secretary.rules) : []; } catch { rules = []; }

  const systemPrompt = secretary.systemPrompt || buildSystemPrompt({
    name: secretary.name || "Ana",
    tone: secretary.tone || "profesional",
    businessName: secretary.businessName || "el negocio",
    businessDesc: secretary.businessDesc || "",
    city: secretary.city || "",
    schedule: {},
    faqs,
    rules,
  });

  // Fetch up to 8 most recent style examples for this user
  const styleExamples = await prisma.emailStyleExample.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { originalDraft: true, editedVersion: true, wasEdited: true, category: true },
  });

  // Build style learning context
  let styleContext = "";
  if (styleExamples.length > 0) {
    const corrections = styleExamples.filter((e) => e.wasEdited);
    const approvals = styleExamples.filter((e) => !e.wasEdited);

    styleContext += "\n\n--- APRENDE DEL ESTILO DE ESCRITURA DEL DUEÑO ---";

    if (corrections.length > 0) {
      styleContext += "\n\nCORRECCIONES QUE HA HECHO (lo que escribiste vs. lo que prefirió):\n";
      corrections.slice(0, 4).forEach((ex, i) => {
        styleContext += `\nEjemplo ${i + 1}:\n  MI BORRADOR: ${ex.originalDraft.slice(0, 300)}\n  SU VERSIÓN: ${ex.editedVersion.slice(0, 300)}\n`;
      });
      styleContext += "\nAdapta tu estilo para parecerte más a su versión, no al borrador.";
    }

    if (approvals.length > 0) {
      styleContext += "\n\nEJEMPLOS QUE APROBÓ SIN CAMBIOS (imita este tono y estructura):\n";
      approvals.slice(0, 3).forEach((ex, i) => {
        styleContext += `\nAprobado ${i + 1}: ${ex.editedVersion.slice(0, 300)}\n`;
      });
    }

    styleContext += "\n--- FIN DE EJEMPLOS ---";
  }

  const emailSystemPrompt =
    systemPrompt +
    "\n\nESTÁS RESPONDIENDO UN EMAIL. Sé formal y profesional. Incluye saludo y despedida. Máximo 5 oraciones." +
    styleContext;

  // Classify the email and generate reply suggestion in parallel
  const [category, suggestedReply] = await Promise.all([
    process.env.ANTHROPIC_API_KEY
      ? classifyEmail(subject, body, systemPrompt)
      : Promise.resolve<EmailCategory>("otro"),
    chatWithSecretary(
      [{ role: "user", content: `Email recibido de ${fromName}:\nAsunto: ${subject}\n\n${body}` }],
      emailSystemPrompt
    ),
  ]);

  // Find or create contact
  let contact = await prisma.contact.findFirst({
    where: { userId, email: fromEmail },
  });
  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        userId,
        name: fromName,
        email: fromEmail,
        channel: "email",
        firstContactAt: new Date(),
        lastInteraction: new Date(),
      },
    });
  } else {
    await prisma.contact.update({ where: { id: contact.id }, data: { lastInteraction: new Date() } });
  }

  // Create conversation
  const conversation = await prisma.conversation.create({
    data: {
      userId,
      contactId: contact.id,
      channel: "email",
      status: "active",
      subject,
      lastMessage: body.slice(0, 200),
      lastMessageAt: new Date(),
    },
  });

  // Save inbound message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: "client",
      content: body,
      channel: "email",
      status: "read",
      metadata: JSON.stringify({ subject, fromEmail, fromName }),
    },
  });

  // Save pending reply with classification and suggestion
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: "secretary",
      content: suggestedReply,
      channel: "email",
      status: "pending",
      metadata: JSON.stringify({
        category,
        categoryLabel: CATEGORY_LABELS[category],
        subject: `Re: ${subject}`,
        toEmail: fromEmail,
        toName: fromName,
        isSuggestion: true,
      }),
    },
  });

  // Notify the user
  await prisma.notification.create({
    data: {
      userId,
      title: `📧 Nuevo email: ${CATEGORY_LABELS[category]}`,
      body: `${fromName} (${fromEmail}) — ${subject}`,
      type: "info",
    },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      action: "email_received",
      description: `Email de ${fromName}: ${subject}`,
      contactName: fromName,
      channel: "email",
      entityType: "conversation",
      entityId: conversation.id,
    },
  });

  return NextResponse.json({ ok: true, conversationId: conversation.id });
}
