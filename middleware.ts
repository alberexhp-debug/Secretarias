import { NextRequest, NextResponse } from "next/server";

// Lightweight middleware: only checks cookie presence.
// Full JWT + DB verification happens inside each API route via getSession().
export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/onboarding/:path*"],
};
