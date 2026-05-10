import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const channel = searchParams.get("channel");

  const where: Record<string, unknown> = { userId: user.id };
  if (status && status !== "all") where.status = status;
  if (priority) where.priority = priority;
  if (channel) where.channel = channel;

  const tickets = await prisma.ticket.findMany({
    where,
    include: { contact: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const isUrgent = body.priority === "urgent";

  const ticket = await prisma.ticket.create({
    data: {
      userId: user.id,
      title: body.title,
      description: body.description || "",
      priority: body.priority || "normal",
      channel: body.channel || "whatsapp",
      reason: body.reason || "",
    },
  });

  await Promise.all([
    prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "ticket_created",
        description: `Creó ticket: ${body.title}`,
        channel: body.channel || "whatsapp",
        entityType: "ticket",
        entityId: ticket.id,
      },
    }),
    // Create notification for urgent tickets
    isUrgent
      ? prisma.notification.create({
          data: {
            userId: user.id,
            type: "urgent_ticket",
            title: "Ticket urgente creado",
            body: body.title,
            link: `/panel/tickets`,
            urgent: true,
          },
        })
      : Promise.resolve(null),
  ]);

  return NextResponse.json({ ticket });
}
