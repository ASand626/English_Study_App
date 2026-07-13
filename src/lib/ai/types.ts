export type LessonCategory =
  | "daily_conversation"
  | "business_english"
  | "review";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export interface UserProfile {
  weakGrammar: string[];
  weakVocab: string[];
  recentCefr: CefrLevel;
}

export interface LessonGenInput {
  category: LessonCategory;
  targetCefr: CefrLevel;
  theme: string;
  avoidThemes: string[];
  focusGrammar?: string;
  focusVocab?: string[];
}

export interface DialogueLine {
  speaker: string;
  line_en: string;
  line_ja: string;
}

export interface ComprehensionQuestion {
  question_en: string;
  choices: string[];
  answer: string;
  explanation_ja: string;
}

export interface KeyExpression {
  phrase: string;
  meaning_ja: string;
  example_sentence: string;
}

export interface GrammarPoint {
  name: string;
  explanation_ja: string;
  pattern: string;
  example_sentences: string[];
}

export interface VocabularyItem {
  word: string;
  part_of_speech: string;
  meaning_ja: string;
  example_sentence: string;
  cefr_level: CefrLevel;
}

export interface SpeakingTask {
  prompt_en: string;
  prompt_ja: string;
  must_use_expressions: string[];
}

export interface WritingTask {
  prompt_en: string;
  prompt_ja: string;
  min_words: number;
  must_use_grammar: string;
}

export interface LessonContent {
  title: string;
  category: LessonCategory | "news_discussion";
  cefr_level: CefrLevel;
  theme: string;
  dialogue: DialogueLine[];
  comprehension_questions: ComprehensionQuestion[];
  key_expressions: KeyExpression[];
  grammar_point: GrammarPoint;
  vocabulary: VocabularyItem[];
  speaking_task: SpeakingTask;
  writing_task: WritingTask;
  // Present only for category === "news_discussion" (see NewsLessonExtra).
  news?: NewsLessonExtra;
}

export interface NewsLessonGenInput {
  targetCefr: CefrLevel;
  sourceArticleText: string;
  sourceTitle: string;
  sourceUrl: string;
}

export interface NewsLessonExtra {
  adapted_passage_en: string;
  adapted_passage_ja: string;
  keywords: { term: string; meaning_ja: string }[];
  source_title: string;
  source_url: string;
  discussion_prompts: { prompt_en: string; prompt_ja: string }[];
  summary_task: { prompt_en: string; prompt_ja: string; min_words: number };
}

export interface LessonContextSummary {
  dialogueSummary: string;
  keyExpressions: string[];
  grammarPoint: string;
  targetCefr: CefrLevel;
}

export interface SpeakingCorrectionInput {
  lessonContext: LessonContextSummary;
  userTranscript: string;
  userProfile: UserProfile;
}

export interface WritingCorrectionInput {
  lessonContext: LessonContextSummary;
  userText: string;
  userProfile: UserProfile;
}

export interface TutorChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TutorChatInput {
  lessonContext: LessonContextSummary;
  history: TutorChatMessage[];
  question: string;
}

export interface GrammarCorrection {
  original: string;
  corrected: string;
  explanation_ja: string;
}

export interface NaturalExpressionSuggestion {
  original: string;
  suggestion: string;
  why_ja: string;
}

export interface VocabularyUpgrade {
  used_word: string;
  suggested_word: string;
  nuance_ja: string;
}

export interface SpeakingFeedback {
  strengths: string[];
  grammar_corrections: GrammarCorrection[];
  natural_expression_suggestions: NaturalExpressionSuggestion[];
  vocabulary_upgrades: VocabularyUpgrade[];
  fluency_feedback_ja: string;
  logical_coherence_feedback_ja: string;
  cefr_estimate: CefrLevel;
  next_focus_point_ja: string;
}

export interface WritingFeedback {
  strengths: string[];
  grammar_corrections: GrammarCorrection[];
  natural_expression_suggestions: NaturalExpressionSuggestion[];
  vocabulary_upgrades: VocabularyUpgrade[];
  structure_feedback_ja: string;
  logical_coherence_feedback_ja: string;
  cefr_estimate: CefrLevel;
  next_focus_point_ja: string;
}
