import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const account = await prisma.connectedEmailAccount.findFirst({ where: { id, userId: user.id } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.connectedEmailAccount.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const account = await prisma.connectedEmailAccount.findFirst({ where: { id, userId: user.id } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.connectedEmailAccount.update({ where: { id }, data: { connected: body.connected } });
  return NextResponse.json({ ok: true });
}
