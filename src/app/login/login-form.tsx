"use client";

import { getRedirectResult, signInWithRedirect } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, googleProvider } from "@/lib/firebase/client";
import styles from "./login.module.css";

// signInWithPopup relies on window.opener/sessionStorage surviving a popup
// round-trip, which mobile browsers (especially in-app browsers like
// LINE/Instagram, or Safari's partitioned storage) frequently break —
// surfacing as Firebase's "missing initial state" error. signInWithRedirect
// avoids that by navigating the whole page instead of opening a popup.
export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function completeRedirectSignIn() {
      try {
        const credential = await getRedirectResult(auth);
        if (!credential) return;

        setLoading(true);
        const idToken = await credential.user.getIdToken();
        const response = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (!response.ok) throw new Error("Failed to establish session");

        const redirectTo = searchParams.get("redirect") ?? "/dashboard";
        router.push(redirectTo);
        router.refresh();
      } catch (err) {
        console.error(err);
        setError("ログインに失敗しました。もう一度お試しください。");
        setLoading(false);
      }
    }
    completeRedirectSignIn();
  }, [router, searchParams]);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      console.error(err);
      setError("ログインに失敗しました。もう一度お試しください。");
      setLoading(false);
    }
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>ログイン</h1>
      <p className={styles.subtitle}>1日15分、AIと一緒に英語を学ぼう</p>
      <button className={styles.googleButton} onClick={handleGoogleSignIn} disabled={loading}>
        {loading ? "ログイン中..." : "Googleでログイン"}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
