import type { SpeakingFeedback, WritingFeedback } from "@/lib/ai";
import styles from "./lesson.module.css";

interface FeedbackResultProps {
  feedback: SpeakingFeedback | WritingFeedback;
  secondaryLabel: string;
  secondaryFeedback: string;
}

export default function FeedbackResult({ feedback, secondaryLabel, secondaryFeedback }: FeedbackResultProps) {
  return (
    <div className={styles.feedback}>
      <p className={styles.cefrBadge}>CEFR推定: {feedback.cefr_estimate}</p>

      {feedback.strengths.length > 0 && (
        <div>
          <h4>良かった点</h4>
          <ul>
            {feedback.strengths.map((strength) => (
              <li key={strength}>{strength}</li>
            ))}
          </ul>
        </div>
      )}

      {feedback.grammar_corrections.length > 0 && (
        <div>
          <h4>文法の修正</h4>
          <ul>
            {feedback.grammar_corrections.map((correction) => (
              <li key={correction.original}>
                <span className={styles.strike}>{correction.original}</span> → <strong>{correction.corrected}</strong>
                <br />
                <span className={styles.hint}>{correction.explanation_ja}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.natural_expression_suggestions.length > 0 && (
        <div>
          <h4>より自然な表現</h4>
          <ul>
            {feedback.natural_expression_suggestions.map((suggestion) => (
              <li key={suggestion.original}>
                {suggestion.original} → <strong>{suggestion.suggestion}</strong>
                <br />
                <span className={styles.hint}>{suggestion.why_ja}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.vocabulary_upgrades.length > 0 && (
        <div>
          <h4>語彙アップグレード</h4>
          <ul>
            {feedback.vocabulary_upgrades.map((upgrade) => (
              <li key={upgrade.used_word}>
                {upgrade.used_word} → <strong>{upgrade.suggested_word}</strong>
                <br />
                <span className={styles.hint}>{upgrade.nuance_ja}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h4>{secondaryLabel}</h4>
        <p>{secondaryFeedback}</p>
      </div>

      <div>
        <h4>内容の論理性</h4>
        <p>{feedback.logical_coherence_feedback_ja}</p>
      </div>

      <div className={styles.nextFocus}>
        <h4>次回の改善ポイント</h4>
        <p>{feedback.next_focus_point_ja}</p>
      </div>
    </div>
  );
}
