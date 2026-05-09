import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  if (!user.secretary) return NextResponse.json({ appointments: [] });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const where: Record<string, unknown> = { secretaryId: user.secretary.id };

  if (month && year) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    where.startTime = { gte: start, lte: end };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { contact: true },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({ appointments });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user || !user.secretary) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const appointment = await prisma.appointment.create({
    data: {
      secretaryId: user.secretary.id,
      contactId: body.contactId,
      title: body.title,
      description: body.description || "",
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      channel: body.channel || "manual",
      status: body.status || "confirmed",
      notes: body.notes || "",
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "appointment_scheduled",
      description: `Cita agendada: ${body.title}`,
      channel: body.channel || "manual",
      entityType: "appointment",
      entityId: appointment.id,
    },
  });

  return NextResponse.json({ appointment });
}
