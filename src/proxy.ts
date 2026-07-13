import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookie } from "@/lib/auth/session";

// Next.js 16 renamed "middleware" to "proxy"; this always runs on Node.js,
// which is what lets it call firebase-admin directly for a real
// signature/revocation check instead of just checking cookie presence.
export default async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isAuthenticated = sessionCookie
    ? await verifySessionCookie(sessionCookie).then(() => true).catch(() => false)
    : false;

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/lesson/:path*"],
};
