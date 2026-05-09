import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    onboardingDone: user.onboardingDone,
    onboardingStep: user.onboardingStep,
    planType: user.planType,
    secretary: user.secretary,
  });
}
