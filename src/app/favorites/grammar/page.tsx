import Link from "next/link";
import { redirect } from "next/navigation";
import { getDbUser } from "@/lib/auth/db-user";
import { prisma } from "@/lib/prisma";
import FavoriteStar from "@/components/favorite-star";
import DeleteButton from "@/components/delete-button";
import Pagination from "@/components/pagination";
import { createPersonalGrammarAction } from "@/lib/favorites/personal-actions";
import styles from "../favorites.module.css";

const PAGE_SIZE = 20;

interface GrammarItem {
  key: string;
  itemId: string;
  name: string;
  pattern: string;
  explanationJa: string;
  lessonId: string | null;
  lessonTitle: string | null;
  isPersonal: boolean;
  createdAt: Date;
}

export default async function FavoriteGrammarPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const dbUser = await getDbUser();
  if (!dbUser) redirect("/login");

  const [favoriteGrammar, personalGrammar] = await Promise.all([
    prisma.favoriteGrammar.findMany({
      where: { userId: dbUser.id },
      include: { grammar: { include: { lesson: { select: { id: true, title: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.grammar.findMany({
      where: { createdByUserId: dbUser.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const merged: GrammarItem[] = [
    ...favoriteGrammar.map((f) => ({
      key: `fav-${f.id}`,
      itemId: f.grammar.id,
      name: f.grammar.name,
      pattern: f.grammar.pattern,
      explanationJa: f.grammar.explanationJa,
      lessonId: f.grammar.lesson?.id ?? null,
      lessonTitle: f.grammar.lesson?.title ?? null,
      isPersonal: false,
      createdAt: f.createdAt,
    })),
    ...personalGrammar.map((g) => ({
      key: `personal-${g.id}`,
      itemId: g.id,
      name: g.name,
      pattern: g.pattern,
      explanationJa: g.explanationJa,
      lessonId: null,
      lessonTitle: null,
      isPersonal: true,
      createdAt: g.createdAt,
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
        <Link href="/favorites/words" className={styles.tab}>
          単語・表現
        </Link>
        <span className={styles.tabActive}>文法</span>
      </nav>

      <details className={styles.addForm}>
        <summary>+ 文法を自分で登録する</summary>
        <form action={createPersonalGrammarAction}>
          <label>
            文法名
            <input type="text" name="name" required />
          </label>
          <label>
            パターン（任意）
            <input type="text" name="pattern" placeholder="例: subject + have/has + been + verb-ing" />
          </label>
          <label>
            説明
            <textarea name="explanationJa" rows={3} required />
          </label>
          <label>
            例文（任意・1行に1つ）
            <textarea name="exampleSentences" rows={3} />
          </label>
          <button type="submit">登録する</button>
        </form>
      </details>

      {pageItems.length === 0 ? (
        <p>まだお気に入り・登録した文法がありません。</p>
      ) : (
        <ul className={styles.itemList}>
          {pageItems.map((item) => (
            <li key={item.key}>
              {item.isPersonal && <span className={styles.personalBadge}>自分で登録</span>}
              {item.isPersonal ? (
                <DeleteButton kind="grammar" itemId={item.itemId} className={styles.deleteButton} />
              ) : (
                <FavoriteStar kind="grammar" itemId={item.itemId} lessonId={item.lessonId!} initialFavorited />
              )}{" "}
              <strong>{item.name}</strong> — {item.pattern}
              <br />
              <span>{item.explanationJa}</span>
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

      <Pagination currentPage={page} totalPages={totalPages} basePath="/favorites/grammar" />
    </main>
  );
}
