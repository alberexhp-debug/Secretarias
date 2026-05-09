import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt } from "@/lib/ai";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const secretary = user.secretary;
  if (!secretary) return NextResponse.json({ error: "Secretario no configurado" }, { status: 404 });

  let faqs = [];
  let rules = [];
  let schedule = {};
  let onboardingData = {};
  try { faqs = JSON.parse(secretary.faqs); } catch { faqs = []; }
  try { rules = JSON.parse(secretary.rules); } catch { rules = []; }
  try { schedule = JSON.parse(secretary.schedule); } catch { schedule = {}; }
  try { onboardingData = JSON.parse(secretary.onboardingData); } catch { onboardingData = {}; }

  return NextResponse.json({ secretary: { ...secretary, faqs, rules, schedule, onboardingData } });
}

export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const secretary = user.secretary;

  if (!secretary) return NextResponse.json({ error: "Secretario no configurado" }, { status: 404 });

  const updateData: Record<string, unknown> = {};

  if (body.name !== undefined) updateData.name = body.name;
  if (body.avatarId !== undefined) updateData.avatarId = body.avatarId;
  if (body.tone !== undefined) updateData.tone = body.tone;
  if (body.businessName !== undefined) updateData.businessName = body.businessName;
  if (body.businessDesc !== undefined) updateData.businessDesc = body.businessDesc;
  if (body.businessType !== undefined) updateData.businessType = body.businessType;
  if (body.city !== undefined) updateData.city = body.city;
  if (body.faqs !== undefined) updateData.faqs = JSON.stringify(body.faqs);
  if (body.rules !== undefined) updateData.rules = JSON.stringify(body.rules);
  if (body.schedule !== undefined) updateData.schedule = JSON.stringify(body.schedule);
  if (body.appointmentDuration !== undefined) updateData.appointmentDuration = body.appointmentDuration;
  if (body.appointmentBuffer !== undefined) updateData.appointmentBuffer = body.appointmentBuffer;
  if (body.appointmentMinAdvance !== undefined) updateData.appointmentMinAdvance = body.appointmentMinAdvance;
  if (body.whatsappNumber !== undefined) updateData.whatsappNumber = body.whatsappNumber;
  if (body.emailAddress !== undefined) updateData.emailAddress = body.emailAddress;

  // Rebuild system prompt if core info changed
  if (body.name || body.tone || body.businessName || body.businessDesc || body.city || body.faqs || body.rules) {
    let faqs: Array<{ q: string; a: string }> = [];
    let rules: string[] = [];
    try { faqs = body.faqs || JSON.parse(secretary.faqs); } catch { faqs = []; }
    try { rules = body.rules || JSON.parse(secretary.rules); } catch { rules = []; }

    updateData.systemPrompt = buildSystemPrompt({
      name: body.name || secretary.name,
      tone: body.tone || secretary.tone,
      businessName: body.businessName || secretary.businessName,
      businessDesc: body.businessDesc || secretary.businessDesc,
      city: body.city || secretary.city,
      schedule: {},
      faqs,
      rules,
    });
  }

  const updated = await prisma.secretary.update({
    where: { userId: user.id },
    data: updateData,
  });

  return NextResponse.json({ secretary: updated });
}
