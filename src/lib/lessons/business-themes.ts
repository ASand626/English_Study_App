import type { CefrLevel } from "@/lib/ai";

// Rotated in for business_english lessons at B1+ when the learner didn't type
// their own theme, so the track naturally builds Web3/finance vocabulary as
// level rises (see the "追加機能" requirements — lower levels stay generic).
const BUSINESS_WEB3_THEMES = [
  "explaining a company's quarterly earnings dip to a worried colleague",
  "onboarding a new teammate to your company's Slack and project workflow",
  "negotiating a freelance contract that pays partly in a stablecoin",
  "pitching a startup idea to potential investors",
  "debating whether your team should adopt a DAO-style decision process",
  "reviewing a client's investment portfolio during a slow market",
  "discussing the pros and cons of a remote-work stipend policy",
  "explaining what a stablecoin is to a non-technical manager",
];

const CEFR_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function isB1OrAbove(level: CefrLevel): boolean {
  return CEFR_ORDER.indexOf(level) >= CEFR_ORDER.indexOf("B1");
}

export function pickBusinessTheme(avoidThemes: string[]): string {
  const candidates = BUSINESS_WEB3_THEMES.filter((theme) => !avoidThemes.includes(theme));
  const pool = candidates.length > 0 ? candidates : BUSINESS_WEB3_THEMES;
  return pool[Math.floor(Math.random() * pool.length)];
}
