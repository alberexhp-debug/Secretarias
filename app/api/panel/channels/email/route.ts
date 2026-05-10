import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: current email channel config
export async function GET() {
  const user = await requireAuth().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secretary = await prisma.secretary.findUnique({
    where: { userId: user.id },
    select: { emailConnected: true, emailAddress: true },
  });

  return NextResponse.json({
    connected: secretary?.emailConnected ?? false,
    emailAddress: secretary?.emailAddress ?? null,
    inboundAddress: `secretaria-${user.id}@inbound.secretarios-ia.com`,
  });
}

// POST: connect email (save address + mark connected)
export async function POST(req: NextRequest) {
  const user = await requireAuth().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { emailAddress } = await req.json();

  if (!emailAddress || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
    return NextResponse.json({ error: "Dirección de email inválida" }, { status: 400 });
  }

  await prisma.secretary.update({
    where: { userId: user.id },
    data: { emailAddress, emailConnected: true },
  });

  return NextResponse.json({ ok: true });
}

// DELETE: disconnect email
export async function DELETE() {
  const user = await requireAuth().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.secretary.update({
    where: { userId: user.id },
    data: { emailConnected: false },
  });

  return NextResponse.json({ ok: true });
}
