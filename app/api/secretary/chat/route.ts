import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { chatWithSecretary, buildSystemPrompt } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Support two call shapes:
  //   testMode: { messages: [{role,content},...], testMode: true }  (onboarding step 5)
  //   normal:   { message: string, conversationId?: string }        (real chat)
  const body = await req.json();
  const { testMode, conversationId } = body;
  const message: string = body.message || (Array.isArray(body.messages) ? body.messages.at(-1)?.content : "") || "";

  if (!message.trim()) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });

  const secretary = user.secretary;
  let systemPrompt = secretary?.systemPrompt || "";

  if (!systemPrompt || testMode) {
    let faqs: Array<{ q: string; a: string }> = [];
    let rules: string[] = [];
    try {
      faqs = secretary?.faqs ? JSON.parse(secretary.faqs) : [];
      rules = secretary?.rules ? JSON.parse(secretary.rules) : [];
    } catch {
      faqs = [];
      rules = [];
    }
    systemPrompt = buildSystemPrompt({
      name: secretary?.name || "Ana",
      tone: secretary?.tone || "amigable",
      businessName: secretary?.businessName || "el negocio",
      businessDesc: secretary?.businessDesc || "",
      city: secretary?.city || "",
      schedule: {},
      faqs,
      rules,
    });
  }

  // Test mode (onboarding preview): use the supplied message array, no persistence
  if (testMode) {
    const msgs: Array<{ role: "user" | "assistant"; content: string }> = Array.isArray(body.messages)
      ? body.messages
      : [{ role: "user", content: message }];
    const reply = await chatWithSecretary(msgs, systemPrompt);
    return NextResponse.json({ reply });
  }

  // Resolve or create conversation
  let conv = conversationId
    ? await prisma.conversation.findFirst({ where: { id: conversationId, userId: user.id } })
    : null;

  if (!conv) {
    conv = await prisma.conversation.create({
      data: {
        userId: user.id,
        channel: "web",
        status: "active",
        lastMessage: message.slice(0, 200),
        lastMessageAt: new Date(),
      },
    });
  }

  // Build context from last 20 persisted messages
  const history = await prisma.message.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const contextMessages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...history.map((m) => ({
      role: (m.sender === "secretary" ? "assistant" : "user") as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  // Persist user message
  await prisma.message.create({
    data: { conversationId: conv.id, sender: "client", content: message, channel: "web", status: "read" },
  });

  const reply = await chatWithSecretary(contextMessages, systemPrompt);

  // Persist reply + update conversation
  await Promise.all([
    prisma.message.create({
      data: { conversationId: conv.id, sender: "secretary", content: reply, channel: "web", status: "sent" },
    }),
    prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMessage: reply.slice(0, 200), lastMessageAt: new Date() },
    }),
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "responded",
        description: "Respondió mensaje web",
        channel: "web",
        entityType: "conversation",
        entityId: conv.id,
      },
    }),
  ]);

  return NextResponse.json({ reply, conversationId: conv.id });
}
