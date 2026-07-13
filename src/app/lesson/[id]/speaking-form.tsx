"use client";

import { useState } from "react";
import type { SpeakingFeedback, SpeakingTask } from "@/lib/ai";
import { submitSpeakingFeedbackAction } from "@/lib/lessons/actions";
import FeedbackResult from "./feedback-result";
import styles from "./lesson.module.css";

export default function SpeakingForm({ lessonId, task }: { lessonId: string; task: SpeakingTask }) {
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await submitSpeakingFeedbackAction(lessonId, transcript);
      setFeedback(result);
    } catch (err) {
      console.error(err);
      setError("添削の取得に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.taskBlock}>
      <p>{task.prompt_ja}</p>
      <p className={styles.hint}>※ 今回は音声入力の代わりに、話した内容をテキストで入力してください。</p>
      <form onSubmit={handleSubmit} className={styles.taskForm}>
        <textarea
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          rows={4}
          placeholder="ここに話す内容を英語で入力してください"
          required
        />
        <button type="submit" disabled={loading || transcript.trim().length === 0}>
          {loading ? "添削中..." : "添削してもらう"}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      {feedback && (
        <FeedbackResult
          feedback={feedback}
          secondaryLabel="流暢さ"
          secondaryFeedback={feedback.fluency_feedback_ja}
        />
      )}
    </div>
  );
}
