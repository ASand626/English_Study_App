"use client";

import { useState } from "react";
import type { ComprehensionQuestion } from "@/lib/ai";
import styles from "./lesson.module.css";

export default function ComprehensionQuiz({ questions }: { questions: ComprehensionQuestion[] }) {
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  return (
    <div className={styles.quiz}>
      {questions.map((question, index) => (
        <div key={question.question_en} className={styles.quizQuestion}>
          <p>{question.question_en}</p>
          <div className={styles.quizChoices}>
            {question.choices.map((choice) => (
              <label key={choice}>
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={choice}
                  checked={selected[index] === choice}
                  onChange={() => setSelected((prev) => ({ ...prev, [index]: choice }))}
                />
                {choice}
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRevealed((prev) => ({ ...prev, [index]: true }))}
            disabled={!selected[index]}
          >
            答え合わせ
          </button>
          {revealed[index] && (
            <p className={selected[index] === question.answer ? styles.correct : styles.incorrect}>
              {selected[index] === question.answer ? "正解！" : `不正解。正解: ${question.answer}`}
              <br />
              {question.explanation_ja}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
