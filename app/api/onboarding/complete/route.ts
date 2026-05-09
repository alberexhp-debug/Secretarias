import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { secretaryData } = await req.json();

  const secretary = user.secretary;
  let faqs: Array<{ q: string; a: string }> = [];
  let rules: string[] = [];

  try {
    faqs = secretary ? JSON.parse(secretary.faqs) : [];
    rules = secretary ? JSON.parse(secretary.rules) : [];
  } catch {
    faqs = [];
    rules = [];
  }

  const config = {
    name: secretaryData.name || secretary?.name || "Ana",
    tone: secretaryData.tone || secretary?.tone || "profesional",
    businessName: secretaryData.businessName || secretary?.businessName || "",
    businessDesc: secretaryData.businessDesc || secretary?.businessDesc || "",
    city: secretaryData.city || secretary?.city || "",
    schedule: {},
    faqs,
    rules,
  };

  const systemPrompt = buildSystemPrompt(config);

  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingDone: true, onboardingStep: 6 },
  });

  if (secretary) {
    await prisma.secretary.update({
      where: { userId: user.id },
      data: { ...secretaryData, systemPrompt },
    });
  } else {
    await prisma.secretary.create({
      data: { userId: user.id, ...secretaryData, systemPrompt },
    });
  }

  // Create welcome activity
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "activated",
      description: `${secretaryData.name || "Tu secretario"} está listo para atender a tus clientes`,
      channel: "system",
    },
  });

  return NextResponse.json({ success: true });
}
