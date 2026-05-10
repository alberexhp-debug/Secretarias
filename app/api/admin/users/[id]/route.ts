import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      secretary: true,
      _count: { select: { conversations: true, tickets: true, contacts: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const recentActivity = await prisma.activityLog.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({ user, recentActivity });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.planType) data.planType = body.planType;
  if (body.planExpiry) data.planExpiry = new Date(body.planExpiry);

  // Extend trial by N days from today (or from current trialEnd if still active)
  if (body.extendTrialDays) {
    const current = await prisma.user.findUnique({ where: { id }, select: { trialEnd: true } });
    const base = current?.trialEnd && new Date(current.trialEnd) > new Date()
      ? new Date(current.trialEnd)
      : new Date();
    data.trialEnd = new Date(base.getTime() + body.extendTrialDays * 86400000);
    data.planType = "trial";
  }

  if (typeof body.onboardingDone === "boolean") data.onboardingDone = body.onboardingDone;

  const user = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ user });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
