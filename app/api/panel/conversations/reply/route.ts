import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSecretaryEmailReply } from "@/lib/email";

export async function POST(req: NextRequest) {
  const user = await requireAuth().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId, action, editedContent } = await req.json();

  if (!messageId || !["confirm", "cancel"].includes(action)) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const message = await prisma.message.findFirst({
    where: { id: messageId, status: "pending", sender: "secretary" },
    select: {
      id: true,
      content: true,
      metadata: true,
      conversationId: true,
      conversation: { select: { userId: true, subject: true } },
    },
  });

  if (!message) return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 });
  if (message.conversation.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (action === "cancel") {
    await prisma.message.update({ where: { id: messageId }, data: { status: "cancelled" } });
    return NextResponse.json({ ok: true });
  }

  const finalContent = editedContent?.trim() || message.content;
  let meta: Record<string, unknown> = {};
  try { meta = JSON.parse(message.metadata || "{}"); } catch { meta = {}; }

  const toEmail = meta.toEmail as string;
  const toName = (meta.toName as string) || toEmail;
  const subject = (meta.subject as string) || message.conversation.subject || "Re: tu consulta";

  if (!toEmail) return NextResponse.json({ error: "No hay destinatario configurado" }, { status: 400 });

  const secretary = await prisma.secretary.findUnique({
    where: { userId: user.id },
    select: { name: true, businessName: true },
  });

  await sendSecretaryEmailReply({
    to: toEmail,
    toName,
    fromName: secretary?.name || "Tu secretario",
    businessName: secretary?.businessName || "",
    replyText: finalContent,
    originalSubject: subject,
  });

  // Always save confirmed emails as style learning examples
  const wasEdited = !!(editedContent?.trim() && editedContent.trim() !== message.content.trim());
  await prisma.emailStyleExample.create({
    data: {
      userId: user.id,
      category: (meta.category as string) || "",
      originalDraft: message.content,
      editedVersion: finalContent,
      wasEdited,
    },
  });

  await prisma.message.update({
    where: { id: messageId },
    data: {
      content: finalContent,
      status: "sent",
      metadata: JSON.stringify({ ...meta, sentAt: new Date().toISOString(), edited: !!editedContent }),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "email_sent",
      description: `Respondió email a ${toName}`,
      channel: "email",
      entityType: "conversation",
      entityId: message.conversationId,
    },
  });

  return NextResponse.json({ ok: true });
}
