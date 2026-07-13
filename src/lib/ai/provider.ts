import type {
  LessonContent,
  LessonGenInput,
  NewsLessonGenInput,
  SpeakingCorrectionInput,
  SpeakingFeedback,
  TutorChatInput,
  WritingCorrectionInput,
  WritingFeedback,
} from "./types";

// Provider-agnostic entry point used by the app. Implementations live under
// ./providers/*, selected at runtime by getAIProvider() (see ./index.ts) so
// swapping OpenAI <-> Claude never touches call sites.
export interface AIProvider {
  generateLesson(input: LessonGenInput): Promise<LessonContent>;
  generateNewsLesson(input: NewsLessonGenInput): Promise<LessonContent>;
  correctSpeaking(input: SpeakingCorrectionInput): Promise<SpeakingFeedback>;
  correctWriting(input: WritingCorrectionInput): Promise<WritingFeedback>;
  // Free-form Q&A about a lesson — plain text (not schema-constrained) since
  // a natural conversational reply matters more here than structured output.
  askTutor(input: TutorChatInput): Promise<string>;
}
