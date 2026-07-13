"use client";

import { useState } from "react";
import type { WritingFeedback, WritingTask } from "@/lib/ai";
import { submitWritingFeedbackAction } from "@/lib/lessons/actions";
import FeedbackResult from "./feedback-result";
import styles from "./lesson.module.css";

export default function WritingForm({ lessonId, task }: { lessonId: string; task: WritingTask }) {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await submitWritingFeedbackAction(lessonId, text);
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
      <p className={styles.hint}>※ {task.min_words}語以上を目安に書いてください。</p>
      <form onSubmit={handleSubmit} className={styles.taskForm}>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={5}
          placeholder="ここに英語で書いてください"
          required
        />
        <button type="submit" disabled={loading || text.trim().length === 0}>
          {loading ? "添削中..." : "添削してもらう"}
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      {feedback && (
        <FeedbackResult
          feedback={feedback}
          secondaryLabel="文章構成"
          secondaryFeedback={feedback.structure_feedback_ja}
        />
      )}
    </div>
  );
}
