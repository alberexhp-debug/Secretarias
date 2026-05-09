import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = { userId: user.id };
  if (channel && channel !== "all") where.channel = channel;
  if (status && status !== "all") where.status = status;

  const conversations = await prisma.conversation.findMany({
    where,
    include: { contact: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ conversations });
}
