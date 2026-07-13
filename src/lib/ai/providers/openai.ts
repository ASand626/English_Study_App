import OpenAI from "openai";
import type { AIProvider } from "../provider";
import {
  correctionUserPrompt,
  lessonGenerationSystemPrompt,
  lessonGenerationUserPrompt,
  newsAdaptationSystemPrompt,
  newsLessonBodySystemPrompt,
  speakingCorrectionSystemPrompt,
  tutorChatSystemPrompt,
  writingCorrectionSystemPrompt,
} from "../prompts";
import {
  LESSON_CONTENT_SCHEMA,
  NEWS_ADAPTATION_SCHEMA,
  NEWS_LESSON_BODY_SCHEMA,
  SPEAKING_FEEDBACK_SCHEMA,
  WRITING_FEEDBACK_SCHEMA,
} from "../schemas";
import type {
  LessonContent,
  LessonGenInput,
  NewsLessonGenInput,
  SpeakingCorrectionInput,
  SpeakingFeedback,
  TutorChatInput,
  WritingCorrectionInput,
  WritingFeedback,
} from "../types";

interface OpenAIProviderOptions {
  apiKey?: string;
  // Higher-quality tier for batch content generation vs. the cheaper tier
  // used for high-volume, real-time correction calls (see
  // docs/ai-prompt-design.md model-tier table).
  contentModel?: string;
  correctionModel?: string;
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;
  private contentModel: string;
  private correctionModel: string;

  constructor(options: OpenAIProviderOptions = {}) {
    this.client = new OpenAI({ apiKey: options.apiKey ?? process.env.OPENAI_API_KEY });
    this.contentModel = options.contentModel ?? "gpt-4.1";
    this.correctionModel = options.correctionModel ?? "gpt-4.1-mini";
  }

  private async createJson<T>(params: {
    model: string;
    system: string;
    user: string;
    schema: { name: string; schema: object };
  }): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: params.model,
      temperature: 0.4,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: params.schema.name, schema: params.schema.schema as Record<string, unknown>, strict: true },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error(`OpenAI returned no content for ${params.schema.name}`);
    return JSON.parse(content) as T;
  }

  async generateLesson(input: LessonGenInput): Promise<LessonContent> {
    return this.createJson<LessonContent>({
      model: this.contentModel,
      system: lessonGenerationSystemPrompt(input),
      user: lessonGenerationUserPrompt(input),
      schema: LESSON_CONTENT_SCHEMA,
    });
  }

  async generateNewsLesson(input: NewsLessonGenInput): Promise<LessonContent> {
    const adaptation = await this.createJson<{
      adapted_passage_en: string;
      adapted_passage_ja: string;
      keywords: { term: string; meaning_ja: string }[];
      source_title: string;
      source_url: string;
    }>({
      model: this.contentModel,
      system: newsAdaptationSystemPrompt(input.targetCefr),
      user: `Source title: ${input.sourceTitle}\nSource URL: ${input.sourceUrl}\n\nArticle:\n${input.sourceArticleText}`,
      schema: NEWS_ADAPTATION_SCHEMA,
    });

    const body = await this.createJson<{
      comprehension_questions: LessonContent["comprehension_questions"];
      key_expressions: LessonContent["key_expressions"];
      grammar_point: LessonContent["grammar_point"];
      vocabulary: LessonContent["vocabulary"];
      discussion_prompts: { prompt_en: string; prompt_ja: string }[];
      summary_task: { prompt_en: string; prompt_ja: string; min_words: number };
    }>({
      model: this.contentModel,
      system: newsLessonBodySystemPrompt(input.targetCefr),
      user: `Adapted passage:\n${adaptation.adapted_passage_en}`,
      schema: NEWS_LESSON_BODY_SCHEMA,
    });

    return {
      title: adaptation.source_title,
      category: "news_discussion",
      cefr_level: input.targetCefr,
      theme: adaptation.source_title,
      // No two-person dialogue for news — the narrated passage fills the
      // same "audio to play" slot so the player/lesson UI stays uniform
      // across categories.
      dialogue: [
        { speaker: "Narrator", line_en: adaptation.adapted_passage_en, line_ja: adaptation.adapted_passage_ja },
      ],
      comprehension_questions: body.comprehension_questions,
      key_expressions: body.key_expressions,
      grammar_point: body.grammar_point,
      vocabulary: body.vocabulary,
      speaking_task: {
        prompt_en: body.discussion_prompts[0]?.prompt_en ?? "Share your opinion on this story.",
        prompt_ja: body.discussion_prompts[0]?.prompt_ja ?? "このニュースについてあなたの意見を話してください。",
        must_use_expressions: body.key_expressions.slice(0, 2).map((e) => e.phrase),
      },
      writing_task: {
        prompt_en: body.summary_task.prompt_en,
        prompt_ja: body.summary_task.prompt_ja,
        min_words: body.summary_task.min_words,
        must_use_grammar: body.grammar_point.name,
      },
      news: {
        adapted_passage_en: adaptation.adapted_passage_en,
        adapted_passage_ja: adaptation.adapted_passage_ja,
        keywords: adaptation.keywords,
        source_title: adaptation.source_title,
        source_url: adaptation.source_url,
        discussion_prompts: body.discussion_prompts,
        summary_task: body.summary_task,
      },
    };
  }

  async correctSpeaking(input: SpeakingCorrectionInput): Promise<SpeakingFeedback> {
    return this.createJson<SpeakingFeedback>({
      model: this.correctionModel,
      system: speakingCorrectionSystemPrompt(),
      user: correctionUserPrompt(input.lessonContext, input.userProfile, "spoken response (transcript)", input.userTranscript),
      schema: SPEAKING_FEEDBACK_SCHEMA,
    });
  }

  async correctWriting(input: WritingCorrectionInput): Promise<WritingFeedback> {
    return this.createJson<WritingFeedback>({
      model: this.correctionModel,
      system: writingCorrectionSystemPrompt(),
      user: correctionUserPrompt(input.lessonContext, input.userProfile, "written response", input.userText),
      schema: WRITING_FEEDBACK_SCHEMA,
    });
  }

  async askTutor(input: TutorChatInput): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.correctionModel,
      temperature: 0.5,
      messages: [
        { role: "system", content: tutorChatSystemPrompt(input.lessonContext) },
        ...input.history.map((m) => ({ role: m.role, content: m.content }) as const),
        { role: "user", content: input.question },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned no content for askTutor");
    return content;
  }
}
