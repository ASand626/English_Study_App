"use server";

import { revalidatePath } from "next/cache";
import type { CefrLevel } from "@/lib/ai";
import { requireDbUser } from "@/lib/auth/db-user";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

function parseExampleSentences(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

// User-authored entries (createdByUserId set, lessonId left null) — these
// live alongside AI-generated, lesson-sourced Vocabulary/Expression/Grammar
// rows and show up in the same /favorites pages.
export async function createPersonalVocabularyAction(formData: FormData): Promise<void> {
  const user = await requireDbUser();
  const word = String(formData.get("word") ?? "").trim();
  const meaningJa = String(formData.get("meaningJa") ?? "").trim();
  const exampleSentence = String(formData.get("exampleSentence") ?? "").trim();
  const partOfSpeech = String(formData.get("partOfSpeech") ?? "").trim();
  const cefrLevel = String(formData.get("cefrLevel") ?? "A2") as CefrLevel;

  if (!word || !meaningJa) throw new Error("単語と意味は必須です");

  await prisma.vocabulary.create({
    data: {
      word,
      meaningJa,
      exampleSentence: exampleSentence || word,
      partOfSpeech: partOfSpeech || "-",
      cefrLevel,
      createdByUserId: user.id,
    },
  });

  revalidatePath("/favorites/words");
}

export async function createPersonalExpressionAction(formData: FormData): Promise<void> {
  const user = await requireDbUser();
  const phrase = String(formData.get("phrase") ?? "").trim();
  const meaningJa = String(formData.get("meaningJa") ?? "").trim();
  const exampleSentence = String(formData.get("exampleSentence") ?? "").trim();

  if (!phrase || !meaningJa) throw new Error("表現と意味は必須です");

  await prisma.expression.create({
    data: {
      phrase,
      meaningJa,
      exampleSentence: exampleSentence || phrase,
      createdByUserId: user.id,
    },
  });

  revalidatePath("/favorites/words");
}

export async function createPersonalGrammarAction(formData: FormData): Promise<void> {
  const user = await requireDbUser();
  const name = String(formData.get("name") ?? "").trim();
  const explanationJa = String(formData.get("explanationJa") ?? "").trim();
  const pattern = String(formData.get("pattern") ?? "").trim();
  const exampleSentences = parseExampleSentences(String(formData.get("exampleSentences") ?? ""));

  if (!name || !explanationJa) throw new Error("文法名と説明は必須です");

  await prisma.grammar.create({
    data: {
      name,
      explanationJa,
      pattern: pattern || name,
      exampleSentences: exampleSentences as unknown as Prisma.InputJsonValue,
      createdByUserId: user.id,
    },
  });

  revalidatePath("/favorites/grammar");
}

export async function deletePersonalVocabularyAction(id: string): Promise<void> {
  const user = await requireDbUser();
  const item = await prisma.vocabulary.findUniqueOrThrow({ where: { id } });
  if (item.createdByUserId !== user.id) throw new Error("この単語を削除する権限がありません");

  await prisma.vocabulary.delete({ where: { id } });
  revalidatePath("/favorites/words");
}

export async function deletePersonalExpressionAction(id: string): Promise<void> {
  const user = await requireDbUser();
  const item = await prisma.expression.findUniqueOrThrow({ where: { id } });
  if (item.createdByUserId !== user.id) throw new Error("この表現を削除する権限がありません");

  await prisma.expression.delete({ where: { id } });
  revalidatePath("/favorites/words");
}

export async function deletePersonalGrammarAction(id: string): Promise<void> {
  const user = await requireDbUser();
  const item = await prisma.grammar.findUniqueOrThrow({ where: { id } });
  if (item.createdByUserId !== user.id) throw new Error("この文法を削除する権限がありません");

  await prisma.grammar.delete({ where: { id } });
  revalidatePath("/favorites/grammar");
}
