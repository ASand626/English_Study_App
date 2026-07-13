"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "@/lib/firebase/client";
import styles from "./dashboard.module.css";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      await signOut(auth);
      await fetch("/api/auth/session", { method: "DELETE" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button onClick={handleSignOut} disabled={loading} className={styles.signOutButton}>
      {loading ? "ログアウト中..." : "ログアウト"}
    </button>
  );
}
