import "server-only";
import { prisma } from "@/lib/prisma";
import type { CefrLevel, UserProfile } from "@/lib/ai";

const DEFAULT_CEFR: CefrLevel = "A2";
const HISTORY_WINDOW = 10;

// Aggregates recent LearningHistory rows (one per feedback event, see
// docs/ai-prompt-design.md §5) into the weak-point profile the AI prompts
// expect. Most-frequent tags win so a one-off mistake doesn't dominate.
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const history = await prisma.learningHistory.findMany({
    where: { userId },
    orderBy: { completedAt: "desc" },
    take: HISTORY_WINDOW,
  });

  const grammarCounts = new Map<string, number>();
  const vocabCounts = new Map<string, number>();

  for (const entry of history) {
    for (const tag of entry.weakGrammarTags as string[]) {
      grammarCounts.set(tag, (grammarCounts.get(tag) ?? 0) + 1);
    }
    for (const tag of entry.weakVocabTags as string[]) {
      vocabCounts.set(tag, (vocabCounts.get(tag) ?? 0) + 1);
    }
  }

  const byFrequencyDesc = (a: [string, number], b: [string, number]) => b[1] - a[1];

  return {
    weakGrammar: [...grammarCounts.entries()].sort(byFrequencyDesc).slice(0, 3).map(([tag]) => tag),
    weakVocab: [...vocabCounts.entries()].sort(byFrequencyDesc).slice(0, 5).map(([tag]) => tag),
    recentCefr: history[0]?.cefrEstimateAtTime ?? DEFAULT_CEFR,
  };
}
