import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://secretarias-ia.vercel.app";
const REDIRECT_URI = `${APP_URL}/api/auth/gmail/callback`;

// GET /api/auth/gmail — start OAuth flow
export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Gmail OAuth no configurado aún" }, { status: 503 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state: user.id,
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
