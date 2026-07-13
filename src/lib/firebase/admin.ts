import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

function getAdminApp() {
  return (
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Service account JSON escapes newlines as "\n" in the env var; Admin
        // SDK needs them unescaped.
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    })
  );
}

let cachedAuth: Auth | null = null;

// Lazy singleton: cert() throws immediately if the env vars are missing or
// placeholder values, so we only build the admin app the first time a caller
// actually needs it (e.g. a request that carries a session cookie) instead
// of at module-import time. That keeps pages/builds that never touch auth
// working even before real Firebase credentials are configured.
export function getAdminAuth(): Auth {
  if (!cachedAuth) cachedAuth = getAuth(getAdminApp());
  return cachedAuth;
}
