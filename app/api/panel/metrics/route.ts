import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "week";

  const now = new Date();
  let start = new Date();

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    start.setDate(start.getDate() - 7);
  } else if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else if (period === "3months") {
    start.setMonth(start.getMonth() - 3);
  }

  const [
    totalMessages,
    totalAppointments,
    totalTickets,
    resolvedTickets,
    activityByDay,
    channelBreakdown,
  ] = await Promise.all([
    prisma.message.count({
      where: { conversation: { userId: user.id }, createdAt: { gte: start } },
    }),
    user.secretary
      ? prisma.appointment.count({
          where: { secretaryId: user.secretary.id, startTime: { gte: start } },
        })
      : Promise.resolve(0),
    prisma.ticket.count({
      where: { userId: user.id, createdAt: { gte: start } },
    }),
    prisma.ticket.count({
      where: { userId: user.id, status: "resolved", createdAt: { gte: start } },
    }),
    prisma.activityLog.groupBy({
      by: ["createdAt"],
      where: { userId: user.id, createdAt: { gte: start } },
      _count: true,
    }),
    prisma.message.groupBy({
      by: ["channel"],
      where: { conversation: { userId: user.id }, createdAt: { gte: start } },
      _count: true,
    }),
  ]);

  // Build daily activity chart
  const dayMap = new Map<string, number>();
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    dayMap.set(d.toISOString().slice(0, 10), 0);
  }
  activityByDay.forEach((a) => {
    const day = new Date(a.createdAt).toISOString().slice(0, 10);
    dayMap.set(day, (dayMap.get(day) || 0) + a._count);
  });

  const dailyActivity = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    summary: {
      totalMessages,
      totalAppointments,
      totalTickets,
      resolvedTickets,
      resolutionRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0,
    },
    dailyActivity,
    channelBreakdown: channelBreakdown.map((c) => ({ channel: c.channel, count: c._count })),
  });
}
