import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { chatWithSecretary, buildSystemPrompt } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { messages, testMode } = await req.json();

  const secretary = user.secretary;
  let systemPrompt = secretary?.systemPrompt || "";

  if (!systemPrompt || testMode) {
    let faqs: Array<{ q: string; a: string }> = [];
    let rules: string[] = [];
    try {
      faqs = secretary?.faqs ? JSON.parse(secretary.faqs) : [];
      rules = secretary?.rules ? JSON.parse(secretary.rules) : [];
    } catch {
      faqs = [];
      rules = [];
    }

    systemPrompt = buildSystemPrompt({
      name: secretary?.name || "Ana",
      tone: secretary?.tone || "amigable",
      businessName: secretary?.businessName || "el negocio",
      businessDesc: secretary?.businessDesc || "",
      city: secretary?.city || "",
      schedule: {},
      faqs,
      rules,
    });
  }

  const reply = await chatWithSecretary(messages, systemPrompt);
  return NextResponse.json({ reply });
}
