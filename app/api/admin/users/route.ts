import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const plan = searchParams.get("plan") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const perPage = 20;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { email: { contains: search } },
      { name: { contains: search } },
    ];
  }
  if (plan) where.planType = plan;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        secretary: { select: { name: true, businessName: true, whatsappConnected: true } },
        _count: { select: { conversations: true, tickets: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      planType: u.planType,
      trialEnd: u.trialEnd,
      planExpiry: u.planExpiry,
      onboardingDone: u.onboardingDone,
      createdAt: u.createdAt,
      secretary: u.secretary,
      conversations: u._count.conversations,
      tickets: u._count.tickets,
    })),
    total,
    page,
    pages: Math.ceil(total / perPage),
  });
}
