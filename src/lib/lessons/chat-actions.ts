"use server";

import { getAIProvider } from "@/lib/ai";
import type { TutorChatMessage } from "@/lib/ai";
import { requireDbUser } from "@/lib/auth/db-user";
import { buildLessonContext } from "@/lib/lessons/context";
import { prisma } from "@/lib/prisma";

// Ephemeral for now — history lives in the client component's state only,
// not persisted. Adding persistence later just means writing `history` +
// the new answer to a ChatMessage table here; the call site doesn't change.
export async function askTutorAction(
  lessonId: string,
  history: TutorChatMessage[],
  question: string,
): Promise<string> {
  await requireDbUser();

  const lesson = await prisma.lesson.findUniqueOrThrow({
    where: { id: lessonId },
    include: { dialogueLines: true, grammarPoints: true, expressions: true },
  });

  return getAIProvider().askTutor({
    lessonContext: buildLessonContext(lesson),
    history,
    question,
  });
}
