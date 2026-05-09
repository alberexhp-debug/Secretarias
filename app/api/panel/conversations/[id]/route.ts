import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: user.id },
    include: {
      contact: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
  return NextResponse.json({ conversation });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { content } = await req.json();

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      sender: "owner",
      content,
      status: "sent",
    },
  });

  await prisma.conversation.update({
    where: { id },
    data: { lastMessage: content, lastMessageAt: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "owner_replied",
      description: `Respondiste manualmente en una conversación`,
      channel: "whatsapp",
      entityType: "conversation",
      entityId: id,
    },
  });

  return NextResponse.json({ message });
}
