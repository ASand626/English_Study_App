// JSON Schemas shared by every provider so OpenAI's `response_format` and
// Claude's forced tool-call input_schema stay in lockstep with src/lib/ai/types.ts.
// See docs/ai-prompt-design.md for the prompts these schemas pair with.

const dialogueLine = {
  type: "object",
  properties: {
    speaker: { type: "string" },
    line_en: { type: "string" },
    line_ja: { type: "string" },
  },
  required: ["speaker", "line_en", "line_ja"],
  additionalProperties: false,
};

const comprehensionQuestion = {
  type: "object",
  properties: {
    question_en: { type: "string" },
    choices: { type: "array", items: { type: "string" } },
    answer: { type: "string" },
    explanation_ja: { type: "string" },
  },
  required: ["question_en", "choices", "answer", "explanation_ja"],
  additionalProperties: false,
};

const keyExpression = {
  type: "object",
  properties: {
    phrase: { type: "string" },
    meaning_ja: { type: "string" },
    example_sentence: { type: "string" },
  },
  required: ["phrase", "meaning_ja", "example_sentence"],
  additionalProperties: false,
};

const grammarPoint = {
  type: "object",
  properties: {
    name: { type: "string" },
    explanation_ja: { type: "string" },
    pattern: { type: "string" },
    example_sentences: { type: "array", items: { type: "string" } },
  },
  required: ["name", "explanation_ja", "pattern", "example_sentences"],
  additionalProperties: false,
};

const vocabularyItem = {
  type: "object",
  properties: {
    word: { type: "string" },
    part_of_speech: { type: "string" },
    meaning_ja: { type: "string" },
    example_sentence: { type: "string" },
    cefr_level: { type: "string", enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
  },
  required: ["word", "part_of_speech", "meaning_ja", "example_sentence", "cefr_level"],
  additionalProperties: false,
};

const speakingTask = {
  type: "object",
  properties: {
    prompt_en: { type: "string" },
    prompt_ja: { type: "string" },
    must_use_expressions: { type: "array", items: { type: "string" } },
  },
  required: ["prompt_en", "prompt_ja", "must_use_expressions"],
  additionalProperties: false,
};

const writingTask = {
  type: "object",
  properties: {
    prompt_en: { type: "string" },
    prompt_ja: { type: "string" },
    min_words: { type: "integer" },
    must_use_grammar: { type: "string" },
  },
  required: ["prompt_en", "prompt_ja", "min_words", "must_use_grammar"],
  additionalProperties: false,
};

export const LESSON_CONTENT_SCHEMA = {
  name: "lesson_content",
  schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      category: {
        type: "string",
        enum: ["daily_conversation", "business_english", "review", "news_discussion"],
      },
      cefr_level: { type: "string", enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
      theme: { type: "string" },
      dialogue: { type: "array", items: dialogueLine },
      comprehension_questions: { type: "array", items: comprehensionQuestion },
      key_expressions: { type: "array", items: keyExpression },
      grammar_point: grammarPoint,
      vocabulary: { type: "array", items: vocabularyItem },
      speaking_task: speakingTask,
      writing_task: writingTask,
    },
    required: [
      "title",
      "category",
      "cefr_level",
      "theme",
      "dialogue",
      "comprehension_questions",
      "key_expressions",
      "grammar_point",
      "vocabulary",
      "speaking_task",
      "writing_task",
    ],
    additionalProperties: false,
  },
} as const;

export const NEWS_ADAPTATION_SCHEMA = {
  name: "news_adaptation",
  schema: {
    type: "object",
    properties: {
      adapted_passage_en: { type: "string" },
      adapted_passage_ja: { type: "string" },
      keywords: {
        type: "array",
        items: {
          type: "object",
          properties: {
            term: { type: "string" },
            meaning_ja: { type: "string" },
          },
          required: ["term", "meaning_ja"],
          additionalProperties: false,
        },
      },
      source_title: { type: "string" },
      source_url: { type: "string" },
    },
    required: ["adapted_passage_en", "adapted_passage_ja", "keywords", "source_title", "source_url"],
    additionalProperties: false,
  },
} as const;

// Stage B of the news pipeline (docs/ai-prompt-design.md §2): everything
// derived from the Stage A adapted passage in a single call.
export const NEWS_LESSON_BODY_SCHEMA = {
  name: "news_lesson_body",
  schema: {
    type: "object",
    properties: {
      comprehension_questions: { type: "array", items: comprehensionQuestion },
      key_expressions: { type: "array", items: keyExpression },
      grammar_point: grammarPoint,
      vocabulary: { type: "array", items: vocabularyItem },
      discussion_prompts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            prompt_en: { type: "string" },
            prompt_ja: { type: "string" },
          },
          required: ["prompt_en", "prompt_ja"],
          additionalProperties: false,
        },
      },
      summary_task: {
        type: "object",
        properties: {
          prompt_en: { type: "string" },
          prompt_ja: { type: "string" },
          min_words: { type: "integer" },
        },
        required: ["prompt_en", "prompt_ja", "min_words"],
        additionalProperties: false,
      },
    },
    required: [
      "comprehension_questions",
      "key_expressions",
      "grammar_point",
      "vocabulary",
      "discussion_prompts",
      "summary_task",
    ],
    additionalProperties: false,
  },
} as const;

const grammarCorrection = {
  type: "object",
  properties: {
    original: { type: "string" },
    corrected: { type: "string" },
    explanation_ja: { type: "string" },
  },
  required: ["original", "corrected", "explanation_ja"],
  additionalProperties: false,
};

const naturalExpressionSuggestion = {
  type: "object",
  properties: {
    original: { type: "string" },
    suggestion: { type: "string" },
    why_ja: { type: "string" },
  },
  required: ["original", "suggestion", "why_ja"],
  additionalProperties: false,
};

const vocabularyUpgrade = {
  type: "object",
  properties: {
    used_word: { type: "string" },
    suggested_word: { type: "string" },
    nuance_ja: { type: "string" },
  },
  required: ["used_word", "suggested_word", "nuance_ja"],
  additionalProperties: false,
};

export const SPEAKING_FEEDBACK_SCHEMA = {
  name: "speaking_feedback",
  schema: {
    type: "object",
    properties: {
      strengths: { type: "array", items: { type: "string" } },
      grammar_corrections: { type: "array", items: grammarCorrection },
      natural_expression_suggestions: { type: "array", items: naturalExpressionSuggestion },
      vocabulary_upgrades: { type: "array", items: vocabularyUpgrade },
      fluency_feedback_ja: { type: "string" },
      logical_coherence_feedback_ja: { type: "string" },
      cefr_estimate: { type: "string", enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
      next_focus_point_ja: { type: "string" },
    },
    required: [
      "strengths",
      "grammar_corrections",
      "natural_expression_suggestions",
      "vocabulary_upgrades",
      "fluency_feedback_ja",
      "logical_coherence_feedback_ja",
      "cefr_estimate",
      "next_focus_point_ja",
    ],
    additionalProperties: false,
  },
} as const;

export const WRITING_FEEDBACK_SCHEMA = {
  name: "writing_feedback",
  schema: {
    type: "object",
    properties: {
      strengths: { type: "array", items: { type: "string" } },
      grammar_corrections: { type: "array", items: grammarCorrection },
      natural_expression_suggestions: { type: "array", items: naturalExpressionSuggestion },
      vocabulary_upgrades: { type: "array", items: vocabularyUpgrade },
      structure_feedback_ja: { type: "string" },
      logical_coherence_feedback_ja: { type: "string" },
      cefr_estimate: { type: "string", enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
      next_focus_point_ja: { type: "string" },
    },
    required: [
      "strengths",
      "grammar_corrections",
      "natural_expression_suggestions",
      "vocabulary_upgrades",
      "structure_feedback_ja",
      "logical_coherence_feedback_ja",
      "cefr_estimate",
      "next_focus_point_ja",
    ],
    additionalProperties: false,
  },
} as const;
