"use server";

import { revalidatePath } from "next/cache";
import { requireDbUser } from "@/lib/auth/db-user";
import { prisma } from "@/lib/prisma";

// Toggles favorite state and returns the new state, so the client can update
// the star icon without a separate read round-trip.
export async function toggleFavoriteVocabularyAction(vocabularyId: string, lessonId: string): Promise<boolean> {
  const user = await requireDbUser();

  const existing = await prisma.favoriteVocabulary.findUnique({
    where: { userId_vocabularyId: { userId: user.id, vocabularyId } },
  });

  if (existing) {
    await prisma.favoriteVocabulary.delete({ where: { id: existing.id } });
    revalidatePath(`/lesson/${lessonId}`);
    return false;
  }

  await prisma.favoriteVocabulary.create({ data: { userId: user.id, vocabularyId } });
  revalidatePath(`/lesson/${lessonId}`);
  return true;
}

export async function toggleFavoriteGrammarAction(grammarId: string, lessonId: string): Promise<boolean> {
  const user = await requireDbUser();

  const existing = await prisma.favoriteGrammar.findUnique({
    where: { userId_grammarId: { userId: user.id, grammarId } },
  });

  if (existing) {
    await prisma.favoriteGrammar.delete({ where: { id: existing.id } });
    revalidatePath(`/lesson/${lessonId}`);
    return false;
  }

  await prisma.favoriteGrammar.create({ data: { userId: user.id, grammarId } });
  revalidatePath(`/lesson/${lessonId}`);
  return true;
}

export async function toggleFavoriteExpressionAction(expressionId: string, lessonId: string): Promise<boolean> {
  const user = await requireDbUser();

  const existing = await prisma.favoriteExpression.findUnique({
    where: { userId_expressionId: { userId: user.id, expressionId } },
  });

  if (existing) {
    await prisma.favoriteExpression.delete({ where: { id: existing.id } });
    revalidatePath(`/lesson/${lessonId}`);
    return false;
  }

  await prisma.favoriteExpression.create({ data: { userId: user.id, expressionId } });
  revalidatePath(`/lesson/${lessonId}`);
  return true;
}
