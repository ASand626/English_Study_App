"use client";

import { useState } from "react";
import type { TutorChatMessage } from "@/lib/ai";
import { askTutorAction } from "@/lib/lessons/chat-actions";
import styles from "./lesson.module.css";

export default function TutorChat({ lessonId }: { lessonId: string }) {
  const [messages, setMessages] = useState<TutorChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    const history = messages;
    setMessages([...history, { role: "user", content: trimmed }]);
    setQuestion("");
    setLoading(true);
    setError(null);

    try {
      const answer = await askTutorAction(lessonId, history, trimmed);
      setMessages((prev) => [...prev, { role: "assistant", content: answer }]);
    } catch (err) {
      console.error(err);
      setError("回答の取得に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.chatBlock}>
      <p className={styles.hint}>このレッスンの内容について、疑問点をAI講師に質問できます。</p>
      {messages.length > 0 && (
        <div className={styles.chatMessages}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={message.role === "user" ? styles.chatMessageUser : styles.chatMessageAssistant}
            >
              {message.content}
            </div>
          ))}
          {loading && <div className={styles.chatMessageAssistant}>...</div>}
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.chatForm}>
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="例: なぜここは現在完了進行形を使うの？"
          disabled={loading}
        />
        <button type="submit" disabled={loading || question.trim().length === 0}>
          送信
        </button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
