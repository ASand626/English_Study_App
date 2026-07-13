import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import LoginForm from "./login-form";
import styles from "./login.module.css";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className={styles.page}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
