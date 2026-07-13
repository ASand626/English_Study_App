import Link from "next/link";
import { redirect } from "next/navigation";
import { getDbUser } from "@/lib/auth/db-user";
import { prisma } from "@/lib/prisma";
import type { LessonCategoryKey } from "@/lib/category-meta";
import HistoryCalendar, { type DayEntry } from "./history-calendar";
import styles from "./history.module.css";

function parseMonthParam(monthParam: string | undefined, now: Date) {
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [year, month] = monthParam.split("-").map(Number);
    return { year, month: month - 1 };
  }
  return { year: now.getFullYear(), month: now.getMonth() };
}

function monthParamOf(year: number, month: number) {
  const normalizedYear = year + Math.floor(month / 12);
  const normalizedMonth = ((month % 12) + 12) % 12;
  return `${normalizedYear}-${String(normalizedMonth + 1).padStart(2, "0")}`;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const dbUser = await getDbUser();
  if (!dbUser) redirect("/login");

  const now = new Date();
  const { month: monthParam } = await searchParams;
  const { year, month } = parseMonthParam(monthParam, now);

  const rangeStart = new Date(year, month, 1);
  const rangeEnd = new Date(year, month + 1, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = rangeStart.getDay();

  const [speakingFeedback, writingFeedback] = await Promise.all([
    prisma.speakingFeedback.findMany({
      where: { userId: dbUser.id, createdAt: { gte: rangeStart, lt: rangeEnd } },
      include: { lesson: { select: { id: true, title: true, category: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.writingFeedback.findMany({
      where: { userId: dbUser.id, createdAt: { gte: rangeStart, lt: rangeEnd } },
      include: { lesson: { select: { id: true, title: true, category: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const toEntry = (
    f: {
      createdAt: Date;
      lessonId: string;
      lesson: { id: string; title: string; category: string };
      cefrEstimate: string;
      nextFocusPointJa: string;
    },
    type: "speaking" | "writing",
  ): DayEntry => ({
    day: f.createdAt.getDate(),
    type,
    lessonId: f.lessonId,
    lessonTitle: f.lesson.title,
    category: f.lesson.category as LessonCategoryKey,
    cefrEstimate: f.cefrEstimate,
    nextFocusPointJa: f.nextFocusPointJa,
    time: f.createdAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
  });

  const entries: DayEntry[] = [
    ...speakingFeedback.map((f) => toEntry(f, "speaking")),
    ...writingFeedback.map((f) => toEntry(f, "writing")),
  ];

  return (
    <main className={styles.main}>
      <Link href="/dashboard" className={styles.backLink}>
        ← ダッシュボードに戻る
      </Link>
      <h1>学習履歴</h1>

      <div className={styles.monthNav}>
        <Link href={`/history?month=${monthParamOf(year, month - 1)}`} className={styles.monthNavLink}>
          ← 前の月
        </Link>
        <span className={styles.monthLabel}>
          {year}年{month + 1}月
        </span>
        <Link href={`/history?month=${monthParamOf(year, month + 1)}`} className={styles.monthNavLink}>
          次の月 →
        </Link>
      </div>

      <HistoryCalendar
        entries={entries}
        daysInMonth={daysInMonth}
        firstWeekday={firstWeekday}
        today={{ year: now.getFullYear(), month: now.getMonth(), day: now.getDate() }}
        calendarYear={year}
        calendarMonth={month}
      />
    </main>
  );
}
