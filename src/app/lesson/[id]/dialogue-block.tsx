"use client";

import { useState } from "react";
import styles from "./lesson.module.css";

interface DialogueLine {
  id: string;
  speaker: string;
  lineEn: string;
  lineJa: string;
}

export default function DialogueBlock({ lines }: { lines: DialogueLine[] }) {
  const [showJa, setShowJa] = useState(false);

  return (
    <div>
      <button type="button" className={styles.toggleJaButton} onClick={() => setShowJa((prev) => !prev)}>
        {showJa ? "日本語を隠す" : "日本語を表示"}
      </button>
      <div className={styles.dialogue}>
        {lines.map((line) => (
          <p key={line.id}>
            <strong>{line.speaker}:</strong> {line.lineEn}
            {showJa && (
              <>
                <br />
                <span className={styles.lineJa}>{line.lineJa}</span>
              </>
            )}
          </p>
        ))}
      </div>
    </div>
  );
}
