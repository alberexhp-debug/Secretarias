import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendTrialExpiryWarningEmail, sendTrialExpiredEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 86400000);
  const in7Days = new Date(now.getTime() + 7 * 86400000);

  // Users with trial expiring in 3 or 7 days
  const expiringSoon = await prisma.user.findMany({
    where: {
      planType: "trial",
      trialEnd: { gte: now, lte: in7Days },
    },
    select: { email: true, name: true, trialEnd: true },
  });

  // Users whose trial expired in the last 24h (send "expired" email once)
  const recentlyExpired = await prisma.user.findMany({
    where: {
      planType: "trial",
      trialEnd: { gte: new Date(now.getTime() - 86400000), lt: now },
    },
    select: { email: true, name: true },
  });

  let warned = 0;
  let expired = 0;

  for (const u of expiringSoon) {
    const daysLeft = Math.ceil((new Date(u.trialEnd!).getTime() - now.getTime()) / 86400000);
    // Only send on day 7 and day 3 exactly (avoid spam)
    if (daysLeft === 7 || daysLeft === 3 || daysLeft === 1) {
      await sendTrialExpiryWarningEmail(u.email, u.name || "Hola", daysLeft);
      warned++;
    }
  }

  for (const u of recentlyExpired) {
    await sendTrialExpiredEmail(u.email, u.name || "Hola");
    expired++;
  }

  return NextResponse.json({ ok: true, warned, expired });
}
