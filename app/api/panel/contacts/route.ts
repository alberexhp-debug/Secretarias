import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const channel = searchParams.get("channel");
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = 20;

  const where: Record<string, unknown> = { userId: user.id };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { phone: { contains: q } },
      { email: { contains: q } },
    ];
  }
  if (channel && channel !== "all") where.channel = channel;

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { lastInteraction: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        _count: { select: { conversations: true, tickets: true, appointments: true } },
      },
    }),
    prisma.contact.count({ where }),
  ]);

  return NextResponse.json({ contacts, total, page, pages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const contact = await prisma.contact.create({
    data: {
      userId: user.id,
      name: body.name,
      phone: body.phone,
      email: body.email,
      channel: body.channel || "whatsapp",
      notes: body.notes || "",
    },
  });

  return NextResponse.json({ contact });
}
