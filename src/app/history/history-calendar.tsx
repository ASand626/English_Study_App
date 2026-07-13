"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORY_META, type LessonCategoryKey } from "@/lib/category-meta";
import styles from "./history.module.css";

export interface DayEntry {
  day: number;
  type: "speaking" | "writing";
  lessonId: string;
  lessonTitle: string;
  category: LessonCategoryKey;
  cefrEstimate: string;
  nextFocusPointJa: string;
  time: string;
}

interface HistoryCalendarProps {
  entries: DayEntry[];
  daysInMonth: number;
  firstWeekday: number;
  today: { year: number; month: number; day: number };
  calendarYear: number;
  calendarMonth: number;
}

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export default function HistoryCalendar({
  entries,
  daysInMonth,
  firstWeekday,
  today,
  calendarYear,
  calendarMonth,
}: HistoryCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const entriesByDay = new Map<number, DayEntry[]>();
  for (const entry of entries) {
    const list = entriesByDay.get(entry.day) ?? [];
    list.push(entry);
    entriesByDay.set(entry.day, list);
  }

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isToday = (day: number) =>
    today.year === calendarYear && today.month === calendarMonth && today.day === day;

  const selectedEntries = selectedDay ? (entriesByDay.get(selectedDay) ?? []) : [];

  return (
    <div>
      <div className={styles.legend}>
        {(Object.keys(CATEGORY_META) as LessonCategoryKey[]).map((key) => (
          <span key={key} className={styles.legendItem}>
            <span className={styles.dot} style={{ background: CATEGORY_META[key].color }} />
            {CATEGORY_META[key].label}
          </span>
        ))}
      </div>

      <div className={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className={styles.weekdayLabel}>
            {label}
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {cells.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} className={styles.emptyCell} />;
          const dayEntries = entriesByDay.get(day) ?? [];
          const categories = [...new Set(dayEntries.map((e) => e.category))];
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`${styles.dayCell} ${selectedDay === day ? styles.dayCellSelected : ""} ${isToday(day) ? styles.dayCellToday : ""}`}
            >
              <span className={styles.dayNumber}>{day}</span>
              <span className={styles.dots}>
                {categories.map((cat) => (
                  <span key={cat} className={styles.dot} style={{ background: CATEGORY_META[cat].color }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {selectedDay && (
        <div className={styles.detailPanel}>
          <h3>{selectedDay}日の学習</h3>
          {selectedEntries.length === 0 ? (
            <p>この日の記録はありません。</p>
          ) : (
            <ul className={styles.detailList}>
              {selectedEntries.map((entry, index) => (
                <li key={`${entry.type}-${entry.lessonId}-${index}`}>
                  <span className={styles.badge}>{entry.type === "speaking" ? "スピーキング" : "ライティング"}</span>{" "}
                  <span className={styles.time}>{entry.time}</span>
                  <br />
                  <Link href={`/lesson/${entry.lessonId}`} className={styles.sourceLink}>
                    {entry.lessonTitle}
                  </Link>
                  <p className={styles.cefr}>CEFR: {entry.cefrEstimate}</p>
                  <p className={styles.nextFocus}>{entry.nextFocusPointJa}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
