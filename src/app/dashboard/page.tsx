import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { generateLessonAction } from "@/lib/lessons/actions";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/category-meta";
import SignOutButton from "./sign-out-button";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
  const firebaseUser = await getCurrentUser();
  if (!firebaseUser) redirect("/login");

  const lessons = await prisma.lesson.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, title: true, category: true, cefrLevel: true, theme: true, createdAt: true },
  });

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1>ダッシュボード</h1>
          <p>ようこそ、{firebaseUser.name ?? firebaseUser.email} さん</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/history">学習履歴</Link>
          <Link href="/favorites/words">お気に入り</Link>
          <SignOutButton />
        </div>
      </header>

      <section className={styles.section}>
        <h2>新しいレッスンを作成</h2>
        <form action={generateLessonAction} className={styles.generateForm}>
          <label>
            カテゴリ
            <select name="category" defaultValue="daily_conversation">
              <option value="daily_conversation">Daily Conversation（日常）</option>
              <option value="business_english">Business English（ビジネス）</option>
              <option value="news_business">News（経済・ビジネス）</option>
              <option value="news_crypto">News（暗号資産）</option>
              <option value="review">Review（復習）</option>
            </select>
          </label>
          <label>
            レベル
            <select name="targetCefr" defaultValue="A2">
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
          </label>
          <label>
            テーマ（任意）
            <input type="text" name="theme" placeholder="例: ordering coffee, a job interview" />
            <span className={styles.formHint}>※ ニュースカテゴリでは使用されません（実際の記事から自動生成されます）</span>
          </label>
          <button type="submit">レッスンを生成</button>
        </form>
      </section>

      <section className={styles.section}>
        <h2>レッスン一覧</h2>
        {lessons.length === 0 ? (
          <p>まだレッスンがありません。上のフォームから作成してください。</p>
        ) : (
          <ul className={styles.lessonList}>
            {lessons.map((lesson) => {
              const meta = CATEGORY_META[lesson.category as keyof typeof CATEGORY_META];
              return (
                <li key={lesson.id}>
                  <Link href={`/lesson/${lesson.id}`}>
                    <span className={styles.categoryBadge} style={{ background: meta.color }}>
                      {meta.emoji} {meta.label}
                    </span>
                    <span className={styles.lessonTitle}>{lesson.title}</span>
                    <span className={styles.lessonMeta}>
                      {lesson.cefrLevel} / {lesson.theme}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
