import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 86400000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

  const [
    totalUsers,
    trialUsers,
    proUsers,
    businessUsers,
    trialsExpiringSoon,
    newUsersThisMonth,
    totalMessages,
    totalTickets,
    totalAppointments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { planType: "trial" } }),
    prisma.user.count({ where: { planType: "pro" } }),
    prisma.user.count({ where: { planType: "business" } }),
    prisma.user.count({
      where: { planType: "trial", trialEnd: { gte: now, lte: in7Days } },
    }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.message.count(),
    prisma.ticket.count(),
    prisma.appointment.count(),
  ]);

  const expiredTrials = await prisma.user.count({
    where: { planType: "trial", trialEnd: { lt: now } },
  });

  // Estimated MRR (simplified): pro=499, business=999
  const mrr = proUsers * 499 + businessUsers * 999;

  return NextResponse.json({
    users: { total: totalUsers, trial: trialUsers, pro: proUsers, business: businessUsers, expiredTrials },
    activity: { trialsExpiringSoon, newUsersThisMonth, totalMessages, totalTickets, totalAppointments },
    mrr,
  });
}
