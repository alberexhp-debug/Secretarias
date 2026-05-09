import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const ticket = await prisma.ticket.findFirst({
    where: { id, userId: user.id },
    include: { contact: true, messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!ticket) return NextResponse.json({ error: "Ticket no encontrado" }, { status: 404 });
  return NextResponse.json({ ticket });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.status) data.status = body.status;
  if (body.priority) data.priority = body.priority;
  if (body.internalNotes !== undefined) data.internalNotes = body.internalNotes;
  if (body.status === "resolved") data.resolvedAt = new Date();

  const ticket = await prisma.ticket.update({
    where: { id },
    data,
  });

  if (body.message) {
    await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        sender: "owner",
        content: body.message,
      },
    });
  }

  return NextResponse.json({ ticket });
}
