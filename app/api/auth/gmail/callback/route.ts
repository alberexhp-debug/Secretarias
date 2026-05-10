import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://secretarias-ia.vercel.app";
const REDIRECT_URI = `${APP_URL}/api/auth/gmail/callback`;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !userId) {
    return NextResponse.redirect(`${APP_URL}/panel/configuracion?tab=channels&error=gmail_denied`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: REDIRECT_URI, grant_type: "authorization_code" }),
  });
  const tokens = await tokenRes.json();
  if (!tokens.access_token) {
    return NextResponse.redirect(`${APP_URL}/panel/configuracion?tab=channels&error=gmail_token`);
  }

  // Get user email
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = await profileRes.json();
  const email = profile.email as string;

  const expiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

  // Upsert account
  const existing = await prisma.connectedEmailAccount.findFirst({ where: { userId, email, provider: "gmail" } });
  if (existing) {
    await prisma.connectedEmailAccount.update({
      where: { id: existing.id },
      data: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token || existing.refreshToken, tokenExpiry: expiry, connected: true },
    });
  } else {
    await prisma.connectedEmailAccount.create({
      data: { userId, provider: "gmail", email, label: `Gmail — ${email}`, accessToken: tokens.access_token, refreshToken: tokens.refresh_token, tokenExpiry: expiry, connected: true },
    });
  }

  return NextResponse.redirect(`${APP_URL}/panel/configuracion?tab=channels&success=gmail`);
}
