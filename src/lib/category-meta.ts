export const CATEGORY_META = {
  daily_conversation: { label: "日常会話", emoji: "☕", color: "var(--cat-daily)" },
  business_english: { label: "ビジネス英会話", emoji: "💼", color: "var(--cat-business)" },
  news_discussion: { label: "ニュース", emoji: "📰", color: "var(--cat-news)" },
  review: { label: "復習", emoji: "🔁", color: "var(--cat-review)" },
} as const;

export type LessonCategoryKey = keyof typeof CATEGORY_META;
