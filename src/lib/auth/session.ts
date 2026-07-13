import "server-only";
import { cookies } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth } from "@/lib/firebase/admin";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

export async function createSessionCookie(idToken: string): Promise<string> {
  return getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  });
}

export async function verifySessionCookie(sessionCookie: string): Promise<DecodedIdToken> {
  // `true` checks the session hasn't been revoked (e.g. password change,
  // account disabled) on every verification, not just at issuance.
  return getAdminAuth().verifySessionCookie(sessionCookie, true);
}

// Server Component / Route Handler helper — returns null instead of
// throwing so callers can just check truthiness.
export async function getCurrentUser(): Promise<DecodedIdToken | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    return await verifySessionCookie(sessionCookie);
  } catch {
    return null;
  }
}
