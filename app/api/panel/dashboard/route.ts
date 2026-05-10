import { NextResponse } from "next/server";
import { getSession, isPlanActive } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    messagesToday,
    appointmentsThisWeek,
    pendingTickets,
    urgentTickets,
    recentActivity,
  ] = await Promise.all([
    prisma.message.count({
      where: { conversation: { userId: user.id }, createdAt: { gte: todayStart } },
    }),
    prisma.appointment.count({
      where: {
        secretary: { userId: user.id },
        startTime: { gte: weekStart },
        status: { not: "cancelled" },
      },
    }),
    prisma.ticket.count({
      where: { userId: user.id, status: { in: ["pending", "in_progress"] } },
    }),
    prisma.ticket.count({
      where: { userId: user.id, priority: "urgent", status: { in: ["pending", "in_progress"] } },
    }),
    prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const secretary = user.secretary;

  const planActive = isPlanActive(user);
  const trialDaysLeft = user.trialEnd
    ? Math.max(0, Math.ceil((new Date(user.trialEnd).getTime() - Date.now()) / 86400000))
    : null;

  return NextResponse.json({
    secretary: secretary ? { name: secretary.name, avatarId: secretary.avatarId } : null,
    stats: {
      messagesToday,
      appointmentsThisWeek,
      pendingTickets,
      urgentTickets,
    },
    recentActivity,
    plan: {
      type: user.planType,
      active: planActive,
      trialDaysLeft,
    },
  });
}
