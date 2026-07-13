import type { AIProvider } from "./provider";
import { ClaudeProvider } from "./providers/claude";
import { OpenAIProvider } from "./providers/openai";

export type { AIProvider } from "./provider";
export * from "./types";

let cachedProvider: AIProvider | null = null;

// AI_PROVIDER env var selects the backing model provider — call sites never
// import OpenAIProvider/ClaudeProvider directly, so switching providers is a
// one-line env change (see docs/ai-prompt-design.md §0).
export function getAIProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const provider = (process.env.AI_PROVIDER ?? "openai").toLowerCase();
  if (provider === "claude" || provider === "anthropic") {
    cachedProvider = new ClaudeProvider();
  } else if (provider === "openai") {
    cachedProvider = new OpenAIProvider();
  } else {
    throw new Error(`Unknown AI_PROVIDER "${provider}" — expected "openai" or "claude".`);
  }
  return cachedProvider;
}
