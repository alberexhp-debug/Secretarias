import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { runOnboardingChat } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { messages, step } = await req.json();
  const reply = await runOnboardingChat(messages, step);
  return NextResponse.json({ reply });
}
