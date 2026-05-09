import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { step, data } = await req.json();

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingStep: step },
  });

  if (data && Object.keys(data).length > 0) {
    const existing = user.secretary;
    if (existing) {
      await prisma.secretary.update({
        where: { userId: user.id },
        data,
      });
    } else {
      await prisma.secretary.create({
        data: { userId: user.id, ...data },
      });
    }
  }

  return NextResponse.json({ success: true });
}
