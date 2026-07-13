import "server-only";
import type { CefrLevel, LessonContextSummary } from "@/lib/ai";
import { Prisma } from "@/generated/prisma/client";

export type LessonForContext = Prisma.LessonGetPayload<{
  include: { dialogueLines: true; grammarPoints: true; expressions: true };
}>;

export function buildLessonContext(lesson: LessonForContext): LessonContextSummary {
  const dialogueSummary = lesson.dialogueLines
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((line) => `${line.speaker}: ${line.lineEn}`)
    .join(" / ");
  const keyExpressions = lesson.expressions.map((e) => e.phrase);
  const grammarPoint = lesson.grammarPoints[0]?.name ?? "";

  return {
    dialogueSummary,
    keyExpressions,
    grammarPoint,
    targetCefr: lesson.cefrLevel as CefrLevel,
  };
}
