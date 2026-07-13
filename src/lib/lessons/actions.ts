"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAIProvider } from "@/lib/ai";
import type {
  CefrLevel,
  LessonCategory,
  LessonContent,
  SpeakingFeedback,
  WritingFeedback,
} from "@/lib/ai";
import { requireDbUser } from "@/lib/auth/db-user";
import { getUserProfile } from "@/lib/personalization";
import { isB1OrAbove, pickBusinessTheme } from "@/lib/lessons/business-themes";
import { buildLessonContext } from "@/lib/lessons/context";
import { fetchBusinessNews, fetchCryptoNews } from "@/lib/news/newsdata";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

// Fields shared by every lesson category — dialogue/vocab/expressions/grammar
// are always generated and persisted the same way regardless of what
// triggered generation (manual form vs. the news pipeline).
function commonLessonCreateData(content: LessonContent) {
  return {
    title: content.title,
    comprehensionQuestions: content.comprehension_questions as unknown as Prisma.InputJsonValue,
    speakingTask: content.speaking_task as unknown as Prisma.InputJsonValue,
    writingTask: content.writing_task as unknown as Prisma.InputJsonValue,
    dialogueLines: {
      create: content.dialogue.map((line, index) => ({
        order: index,
        speaker: line.speaker,
        lineEn: line.line_en,
        lineJa: line.line_ja,
      })),
    },
    vocabulary: {
      create: content.vocabulary.map((item) => ({
        word: item.word,
        partOfSpeech: item.part_of_speech,
        meaningJa: item.meaning_ja,
        exampleSentence: item.example_sentence,
        cefrLevel: item.cefr_level,
      })),
    },
    expressions: {
      create: content.key_expressions.map((item) => ({
        phrase: item.phrase,
        meaningJa: item.meaning_ja,
        exampleSentence: item.example_sentence,
      })),
    },
    grammarPoints: {
      create: [
        {
          name: content.grammar_point.name,
          explanationJa: content.grammar_point.explanation_ja,
          pattern: content.grammar_point.pattern,
          exampleSentences: content.grammar_point.example_sentences as unknown as Prisma.InputJsonValue,
        },
      ],
    },
  };
}

// News Discussion lessons are sourced from a real article (newsdata.io)
// instead of a free-text theme — see docs/ai-prompt-design.md §2.
async function generateNewsLessonAndPersist(newsSource: "business" | "crypto", targetCefr: CefrLevel) {
  const recentNewsLessons = await prisma.newsLesson.findMany({
    orderBy: { id: "desc" },
    take: 20,
    select: { sourceUrl: true },
  });
  const usedUrls = new Set(recentNewsLessons.map((n) => n.sourceUrl));

  const articles = newsSource === "crypto" ? await fetchCryptoNews() : await fetchBusinessNews();
  const article = articles.find((a) => !usedUrls.has(a.link)) ?? articles[0];
  if (!article) throw new Error("No news articles available from newsdata.io right now");

  const content = await getAIProvider().generateNewsLesson({
    targetCefr,
    sourceArticleText: article.bodyText,
    sourceTitle: article.title,
    sourceUrl: article.link,
  });
  if (!content.news) throw new Error("AI provider did not return news metadata for a news_discussion lesson");

  return prisma.lesson.create({
    data: {
      category: "news_discussion",
      cefrLevel: targetCefr,
      theme: content.theme,
      ...commonLessonCreateData(content),
      newsLesson: {
        create: {
          sourceTitle: content.news.source_title,
          sourceUrl: content.news.source_url,
          adaptedPassageEn: content.news.adapted_passage_en,
          adaptedPassageJa: content.news.adapted_passage_ja,
          keywords: content.news.keywords as unknown as Prisma.InputJsonValue,
          discussionPrompts: content.news.discussion_prompts as unknown as Prisma.InputJsonValue,
          summaryTask: content.news.summary_task as unknown as Prisma.InputJsonValue,
        },
      },
    },
  });
}

// Generates one lesson via the configured AI provider and persists it,
// shared across all users (see docs/ai-prompt-design.md — lessons are
// common material, not per-user).
export async function generateLessonAction(formData: FormData): Promise<never> {
  const user = await requireDbUser();

  const categoryRaw = String(formData.get("category") ?? "");
  const targetCefr = formData.get("targetCefr") as CefrLevel;
  const theme = String(formData.get("theme") ?? "").trim();

  if (categoryRaw === "news_business" || categoryRaw === "news_crypto") {
    const lesson = await generateNewsLessonAndPersist(categoryRaw === "news_crypto" ? "crypto" : "business", targetCefr);
    revalidatePath("/dashboard");
    redirect(`/lesson/${lesson.id}`);
  }

  const category = categoryRaw as LessonCategory;

  const recentThemes = await prisma.lesson.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { theme: true },
  });
  const avoidThemes = recentThemes.map((lesson) => lesson.theme);

  let focusGrammar: string | undefined;
  let focusVocab: string[] | undefined;
  if (category === "review") {
    const profile = await getUserProfile(user.id);
    focusGrammar = profile.weakGrammar[0];
    focusVocab = profile.weakVocab;
  }

  const resolvedTheme =
    theme || (category === "business_english" && isB1OrAbove(targetCefr) ? pickBusinessTheme(avoidThemes) : "");

  const content = await getAIProvider().generateLesson({
    category,
    targetCefr,
    theme: resolvedTheme || "a natural everyday topic",
    avoidThemes,
    focusGrammar,
    focusVocab,
  });

  const lesson = await prisma.lesson.create({
    data: {
      category,
      cefrLevel: targetCefr,
      theme: content.theme,
      ...commonLessonCreateData(content),
    },
  });

  revalidatePath("/dashboard");
  redirect(`/lesson/${lesson.id}`);
}

// Weak-point tags fed back into LearningHistory for the next lesson's
// focusGrammar/focusVocab (docs/ai-prompt-design.md §5). Kept intentionally
// simple for MVP: the lesson's own grammar point if it tripped the learner
// up, and the AI's suggested vocab upgrades.
function deriveWeakTags(grammarPointName: string, feedback: { grammar_corrections: unknown[]; vocabulary_upgrades: { suggested_word: string }[] }) {
  return {
    weakGrammarTags: feedback.grammar_corrections.length > 0 ? [grammarPointName] : [],
    weakVocabTags: feedback.vocabulary_upgrades.map((u) => u.suggested_word),
  };
}

export async function submitSpeakingFeedbackAction(lessonId: string, transcript: string): Promise<SpeakingFeedback> {
  const user = await requireDbUser();
  const lesson = await prisma.lesson.findUniqueOrThrow({
    where: { id: lessonId },
    include: { dialogueLines: true, grammarPoints: true, expressions: true },
  });

  const [lessonContext, userProfile] = await Promise.all([
    Promise.resolve(buildLessonContext(lesson)),
    getUserProfile(user.id),
  ]);

  const feedback = await getAIProvider().correctSpeaking({
    lessonContext,
    userTranscript: transcript,
    userProfile,
  });

  const { weakGrammarTags, weakVocabTags } = deriveWeakTags(lessonContext.grammarPoint, feedback);

  await prisma.$transaction([
    prisma.speakingFeedback.create({
      data: {
        userId: user.id,
        lessonId,
        userTranscript: transcript,
        strengths: feedback.strengths as unknown as Prisma.InputJsonValue,
        grammarCorrections: feedback.grammar_corrections as unknown as Prisma.InputJsonValue,
        naturalExpressionSuggestions: feedback.natural_expression_suggestions as unknown as Prisma.InputJsonValue,
        vocabularyUpgrades: feedback.vocabulary_upgrades as unknown as Prisma.InputJsonValue,
        fluencyFeedbackJa: feedback.fluency_feedback_ja,
        logicalCoherenceFeedbackJa: feedback.logical_coherence_feedback_ja,
        cefrEstimate: feedback.cefr_estimate,
        nextFocusPointJa: feedback.next_focus_point_ja,
      },
    }),
    prisma.learningHistory.create({
      data: {
        userId: user.id,
        lessonId,
        weakGrammarTags: weakGrammarTags as unknown as Prisma.InputJsonValue,
        weakVocabTags: weakVocabTags as unknown as Prisma.InputJsonValue,
        cefrEstimateAtTime: feedback.cefr_estimate,
      },
    }),
  ]);

  revalidatePath(`/lesson/${lessonId}`);
  return feedback;
}

export async function submitWritingFeedbackAction(lessonId: string, text: string): Promise<WritingFeedback> {
  const user = await requireDbUser();
  const lesson = await prisma.lesson.findUniqueOrThrow({
    where: { id: lessonId },
    include: { dialogueLines: true, grammarPoints: true, expressions: true },
  });

  const [lessonContext, userProfile] = await Promise.all([
    Promise.resolve(buildLessonContext(lesson)),
    getUserProfile(user.id),
  ]);

  const feedback = await getAIProvider().correctWriting({
    lessonContext,
    userText: text,
    userProfile,
  });

  const { weakGrammarTags, weakVocabTags } = deriveWeakTags(lessonContext.grammarPoint, feedback);

  await prisma.$transaction([
    prisma.writingFeedback.create({
      data: {
        userId: user.id,
        lessonId,
        userText: text,
        strengths: feedback.strengths as unknown as Prisma.InputJsonValue,
        grammarCorrections: feedback.grammar_corrections as unknown as Prisma.InputJsonValue,
        naturalExpressionSuggestions: feedback.natural_expression_suggestions as unknown as Prisma.InputJsonValue,
        vocabularyUpgrades: feedback.vocabulary_upgrades as unknown as Prisma.InputJsonValue,
        structureFeedbackJa: feedback.structure_feedback_ja,
        logicalCoherenceFeedbackJa: feedback.logical_coherence_feedback_ja,
        cefrEstimate: feedback.cefr_estimate,
        nextFocusPointJa: feedback.next_focus_point_ja,
      },
    }),
    prisma.learningHistory.create({
      data: {
        userId: user.id,
        lessonId,
        weakGrammarTags: weakGrammarTags as unknown as Prisma.InputJsonValue,
        weakVocabTags: weakVocabTags as unknown as Prisma.InputJsonValue,
        cefrEstimateAtTime: feedback.cefr_estimate,
      },
    }),
  ]);

  revalidatePath(`/lesson/${lessonId}`);
  return feedback;
}
