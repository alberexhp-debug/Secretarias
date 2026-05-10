import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://secretarias-ia.vercel.app";
const REDIRECT_URI = `${APP_URL}/api/auth/outlook/callback`;

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Outlook OAuth no configurado aún" }, { status: 503 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read offline_access",
    state: user.id,
    response_mode: "query",
  });

  return NextResponse.redirect(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`);
}
