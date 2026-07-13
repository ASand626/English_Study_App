import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";
import { createSessionCookie, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

// Exchanges a freshly-minted Firebase ID token (from client-side
// signInWithPopup) for an httpOnly session cookie, and upserts the matching
// User row so Prisma-backed data (LearningHistory, etc.) has somewhere to
// attach to from the very first login.
export async function POST(request: Request) {
  const { idToken } = (await request.json()) as { idToken?: string };
  if (!idToken) {
    return NextResponse.json({ error: "idToken is required" }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
  }

  await prisma.user.upsert({
    where: { firebaseUid: decoded.uid },
    update: {
      email: decoded.email ?? "",
      displayName: decoded.name ?? null,
    },
    create: {
      firebaseUid: decoded.uid,
      email: decoded.email ?? "",
      displayName: decoded.name ?? null,
    },
  });

  const sessionCookie = await createSessionCookie(idToken);

  const response = NextResponse.json({ status: "ok" });
  response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
    maxAge: SESSION_MAX_AGE_SECONDS,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ status: "ok" });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
