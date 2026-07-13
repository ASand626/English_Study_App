import Anthropic from "@anthropic-ai/sdk";
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

interface ClaudeProviderOptions {
  apiKey?: string;
  contentModel?: string;
  correctionModel?: string;
}

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  private contentModel: string;
  private correctionModel: string;

  constructor(options: ClaudeProviderOptions = {}) {
    this.client = new Anthropic({ apiKey: options.apiKey ?? process.env.ANTHROPIC_API_KEY });
    this.contentModel = options.contentModel ?? "claude-sonnet-5";
    this.correctionModel = options.correctionModel ?? "claude-haiku-4-5-20251001";
  }

  // Claude has no native "JSON mode": forcing a single tool call with a
  // strict input_schema is the reliable way to get schema-conformant JSON.
  // `strict: true` is required for the required-fields list to actually be
  // enforced — without it Claude can (and did, in testing) omit a required
  // property like `title` under a large schema.
  private async createJson<T>(params: {
    model: string;
    system: string;
    user: string;
    schema: { name: string; schema: object };
    maxTokens?: number;
  }): Promise<T> {
    const response = await this.client.messages.create({
      model: params.model,
      max_tokens: params.maxTokens ?? 4096,
      // Claude 5-generation models reject an explicit `temperature` param.
      system: params.system,
      messages: [{ role: "user", content: params.user }],
      tools: [
        {
          name: params.schema.name,
          input_schema: params.schema.schema as Anthropic.Tool["input_schema"],
          strict: true,
        },
      ],
      tool_choice: { type: "tool", name: params.schema.name },
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error(`Claude returned no tool_use block for ${params.schema.name}`);
    }
    return toolUse.input as T;
  }

  async generateLesson(input: LessonGenInput): Promise<LessonContent> {
    return this.createJson<LessonContent>({
      model: this.contentModel,
      system: lessonGenerationSystemPrompt(input),
      user: lessonGenerationUserPrompt(input),
      schema: LESSON_CONTENT_SCHEMA,
      maxTokens: 8192,
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
      maxTokens: 8192,
    });

    return {
      title: adaptation.source_title,
      category: "news_discussion",
      cefr_level: input.targetCefr,
      theme: adaptation.source_title,
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
    const response = await this.client.messages.create({
      model: this.correctionModel,
      max_tokens: 1024,
      system: tutorChatSystemPrompt(input.lessonContext),
      messages: [
        ...input.history.map((m) => ({ role: m.role, content: m.content }) as const),
        { role: "user" as const, content: input.question },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Claude returned no text block for askTutor");
    }
    return textBlock.text;
  }
}
