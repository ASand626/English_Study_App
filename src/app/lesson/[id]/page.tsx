import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ComprehensionQuestion, SpeakingTask, WritingTask } from "@/lib/ai";
import { getDbUser } from "@/lib/auth/db-user";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META } from "@/lib/category-meta";
import FavoriteStar from "@/components/favorite-star";
import ScrollReveal from "@/components/scroll-reveal";
import ComprehensionQuiz from "./comprehension-quiz";
import DialogueBlock from "./dialogue-block";
import SpeakingForm from "./speaking-form";
import TutorChat from "./tutor-chat";
import WritingForm from "./writing-form";
import styles from "./lesson.module.css";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const dbUser = await getDbUser();
  if (!dbUser) redirect("/login");

  const { id } = await params;
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      dialogueLines: { orderBy: { order: "asc" } },
      vocabulary: true,
      expressions: true,
      grammarPoints: true,
    },
  });
  if (!lesson) notFound();

  const [favoriteVocab, favoriteGrammar, favoriteExpression] = await Promise.all([
    prisma.favoriteVocabulary.findMany({
      where: { userId: dbUser.id, vocabularyId: { in: lesson.vocabulary.map((v) => v.id) } },
      select: { vocabularyId: true },
    }),
    prisma.favoriteGrammar.findMany({
      where: { userId: dbUser.id, grammarId: { in: lesson.grammarPoints.map((g) => g.id) } },
      select: { grammarId: true },
    }),
    prisma.favoriteExpression.findMany({
      where: { userId: dbUser.id, expressionId: { in: lesson.expressions.map((e) => e.id) } },
      select: { expressionId: true },
    }),
  ]);
  const favoriteVocabIds = new Set(favoriteVocab.map((f) => f.vocabularyId));
  const favoriteGrammarIds = new Set(favoriteGrammar.map((f) => f.grammarId));
  const favoriteExpressionIds = new Set(favoriteExpression.map((f) => f.expressionId));

  const comprehensionQuestions = lesson.comprehensionQuestions as unknown as ComprehensionQuestion[];
  const speakingTask = lesson.speakingTask as unknown as SpeakingTask;
  const writingTask = lesson.writingTask as unknown as WritingTask;
  const grammarPoint = lesson.grammarPoints[0];
  const categoryMeta = CATEGORY_META[lesson.category as keyof typeof CATEGORY_META];

  return (
    <main className={styles.main}>
      <Link href="/dashboard" className={styles.backLink}>
        ← ダッシュボードに戻る
      </Link>

      <header className={styles.header}>
        <span className={styles.categoryBadge} style={{ background: categoryMeta.color }}>
          {categoryMeta.emoji} {categoryMeta.label}
        </span>
        <h1>{lesson.title}</h1>
        <p className={styles.meta}>
          {lesson.cefrLevel} ・ {lesson.theme}
        </p>
      </header>

      <ScrollReveal className={styles.section}>
        <h2>
          <span className={styles.stepChip}>1</span> ダイアログ
        </h2>
        <DialogueBlock lines={lesson.dialogueLines} />
      </ScrollReveal>

      <ScrollReveal className={styles.section}>
        <h2>
          <span className={styles.stepChip}>2</span> 内容理解
        </h2>
        <ComprehensionQuiz questions={comprehensionQuestions} />
      </ScrollReveal>

      <ScrollReveal className={styles.section}>
        <h2>
          <span className={styles.stepChip}>3</span> 重要表現
        </h2>
        <ul>
          {lesson.expressions.map((expression) => (
            <li key={expression.id}>
              <strong>{expression.phrase}</strong> — {expression.meaningJa}{" "}
              <FavoriteStar
                kind="expression"
                itemId={expression.id}
                lessonId={lesson.id}
                initialFavorited={favoriteExpressionIds.has(expression.id)}
              />
              <br />
              <span className={styles.example}>{expression.exampleSentence}</span>
            </li>
          ))}
        </ul>
      </ScrollReveal>

      {grammarPoint && (
        <ScrollReveal className={styles.section}>
          <h2>
            <span className={styles.stepChip}>4</span> 文法
          </h2>
          <h3>
            {grammarPoint.name}{" "}
            <FavoriteStar
              kind="grammar"
              itemId={grammarPoint.id}
              lessonId={lesson.id}
              initialFavorited={favoriteGrammarIds.has(grammarPoint.id)}
            />
          </h3>
          <p>{grammarPoint.explanationJa}</p>
          <p className={styles.pattern}>{grammarPoint.pattern}</p>
          <ul>
            {(grammarPoint.exampleSentences as unknown as string[]).map((sentence) => (
              <li key={sentence}>{sentence}</li>
            ))}
          </ul>
        </ScrollReveal>
      )}

      <ScrollReveal className={styles.section}>
        <h2>
          <span className={styles.stepChip}>5</span> 単語
        </h2>
        <ul>
          {lesson.vocabulary.map((item) => (
            <li key={item.id}>
              <strong>{item.word}</strong> ({item.partOfSpeech}, {item.cefrLevel}) — {item.meaningJa}{" "}
              <FavoriteStar
                kind="vocabulary"
                itemId={item.id}
                lessonId={lesson.id}
                initialFavorited={favoriteVocabIds.has(item.id)}
              />
              <br />
              <span className={styles.example}>{item.exampleSentence}</span>
            </li>
          ))}
        </ul>
      </ScrollReveal>

      <ScrollReveal className={styles.section}>
        <h2>
          <span className={styles.stepChip}>6</span> スピーキング
        </h2>
        <SpeakingForm lessonId={lesson.id} task={speakingTask} />
      </ScrollReveal>

      <ScrollReveal className={styles.section}>
        <h2>
          <span className={styles.stepChip}>7</span> ライティング
        </h2>
        <WritingForm lessonId={lesson.id} task={writingTask} />
      </ScrollReveal>

      <ScrollReveal className={styles.section}>
        <h2>
          <span className={styles.stepChip}>8</span> AI講師に質問する
        </h2>
        <TutorChat lessonId={lesson.id} />
      </ScrollReveal>
    </main>
  );
}
