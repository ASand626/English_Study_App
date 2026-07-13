import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

// Server Actions and pages operate on our own User row (for FKs), not the
// Firebase token directly — this resolves one from the other and is shared
// across every action module and server component that needs it.
export async function getDbUser() {
  const firebaseUser = await getCurrentUser();
  if (!firebaseUser) return null;
  return prisma.user.findUnique({ where: { firebaseUid: firebaseUser.uid } });
}

export async function requireDbUser() {
  const user = await getDbUser();
  if (!user) throw new Error("Not authenticated, or user record not found — sign in again");
  return user;
}
