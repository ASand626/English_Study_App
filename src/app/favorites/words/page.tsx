import Link from "next/link";
import { redirect } from "next/navigation";
import { getDbUser } from "@/lib/auth/db-user";
import { prisma } from "@/lib/prisma";
import FavoriteStar from "@/components/favorite-star";
import DeleteButton from "@/components/delete-button";
import Pagination from "@/components/pagination";
import { createPersonalExpressionAction, createPersonalVocabularyAction } from "@/lib/favorites/personal-actions";
import styles from "../favorites.module.css";

const PAGE_SIZE = 20;

interface WordItem {
  type: "vocabulary" | "expression";
  key: string;
  itemId: string;
  headword: string;
  meaningJa: string;
  exampleSentence: string;
  lessonId: string | null;
  lessonTitle: string | null;
  isPersonal: boolean;
  createdAt: Date;
}

export default async function FavoriteWordsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const dbUser = await getDbUser();
  if (!dbUser) redirect("/login");

  const [favoriteVocab, favoriteExpressions, personalVocab, personalExpressions] = await Promise.all([
    prisma.favoriteVocabulary.findMany({
      where: { userId: dbUser.id },
      include: { vocabulary: { include: { lesson: { select: { id: true, title: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favoriteExpression.findMany({
      where: { userId: dbUser.id },
      include: { expression: { include: { lesson: { select: { id: true, title: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vocabulary.findMany({
      where: { createdByUserId: dbUser.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expression.findMany({
      where: { createdByUserId: dbUser.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const merged: WordItem[] = [
    ...favoriteVocab.map((f) => ({
      type: "vocabulary" as const,
      key: `fav-vocab-${f.id}`,
      itemId: f.vocabulary.id,
      headword: f.vocabulary.word,
      meaningJa: f.vocabulary.meaningJa,
      exampleSentence: f.vocabulary.exampleSentence,
      lessonId: f.vocabulary.lesson?.id ?? null,
      lessonTitle: f.vocabulary.lesson?.title ?? null,
      isPersonal: false,
      createdAt: f.createdAt,
    })),
    ...favoriteExpressions.map((f) => ({
      type: "expression" as const,
      key: `fav-expr-${f.id}`,
      itemId: f.expression.id,
      headword: f.expression.phrase,
      meaningJa: f.expression.meaningJa,
      exampleSentence: f.expression.exampleSentence,
      lessonId: f.expression.lesson?.id ?? null,
      lessonTitle: f.expression.lesson?.title ?? null,
      isPersonal: false,
      createdAt: f.createdAt,
    })),
    ...personalVocab.map((v) => ({
      type: "vocabulary" as const,
      key: `personal-vocab-${v.id}`,
      itemId: v.id,
      headword: v.word,
      meaningJa: v.meaningJa,
      exampleSentence: v.exampleSentence,
      lessonId: null,
      lessonTitle: null,
      isPersonal: true,
      createdAt: v.createdAt,
    })),
    ...personalExpressions.map((e) => ({
      type: "expression" as const,
      key: `personal-expr-${e.id}`,
      itemId: e.id,
      headword: e.phrase,
      meaningJa: e.meaningJa,
      exampleSentence: e.exampleSentence,
      lessonId: null,
      lessonTitle: null,
      isPersonal: true,
      createdAt: e.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const totalPages = Math.max(1, Math.ceil(merged.length / PAGE_SIZE));
  const { page: pageParam } = await searchParams;
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const pageItems = merged.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <main className={styles.main}>
      <Link href="/dashboard" className={styles.backLink}>
        ← ダッシュボードに戻る
      </Link>
      <h1>お気に入り</h1>

      <nav className={styles.tabs}>
        <span className={styles.tabActive}>単語・表現</span>
        <Link href="/favorites/grammar" className={styles.tab}>
          文法
        </Link>
      </nav>

      <details className={styles.addForm}>
        <summary>+ 単語を自分で登録する</summary>
        <form action={createPersonalVocabularyAction}>
          <label>
            単語
            <input type="text" name="word" required />
          </label>
          <label>
            品詞（任意）
            <input type="text" name="partOfSpeech" placeholder="例: noun, verb" />
          </label>
          <label>
            意味
            <input type="text" name="meaningJa" required />
          </label>
          <label>
            例文（任意）
            <input type="text" name="exampleSentence" />
          </label>
          <label>
            レベル
            <select name="cefrLevel" defaultValue="A2">
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
          </label>
          <button type="submit">登録する</button>
        </form>
      </details>

      <details className={styles.addForm}>
        <summary>+ 表現を自分で登録する</summary>
        <form action={createPersonalExpressionAction}>
          <label>
            表現
            <input type="text" name="phrase" required />
          </label>
          <label>
            意味
            <input type="text" name="meaningJa" required />
          </label>
          <label>
            例文（任意）
            <input type="text" name="exampleSentence" />
          </label>
          <button type="submit">登録する</button>
        </form>
      </details>

      {pageItems.length === 0 ? (
        <p>まだお気に入り・登録した単語・表現がありません。</p>
      ) : (
        <ul className={styles.itemList}>
          {pageItems.map((item) => (
            <li key={item.key}>
              <span className={styles.typeBadge}>{item.type === "vocabulary" ? "単語" : "表現"}</span>
              {item.isPersonal && <span className={styles.personalBadge}>自分で登録</span>}
              <br />
              {item.isPersonal ? (
                <DeleteButton kind={item.type} itemId={item.itemId} className={styles.deleteButton} />
              ) : (
                <FavoriteStar kind={item.type} itemId={item.itemId} lessonId={item.lessonId!} initialFavorited />
              )}{" "}
              <strong>{item.headword}</strong> — {item.meaningJa}
              <br />
              <span>{item.exampleSentence}</span>
              {item.lessonId && item.lessonTitle && (
                <>
                  <br />
                  <Link href={`/lesson/${item.lessonId}`} className={styles.sourceLink}>
                    {item.lessonTitle}
                  </Link>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <Pagination currentPage={page} totalPages={totalPages} basePath="/favorites/words" />
    </main>
  );
}
