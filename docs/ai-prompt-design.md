# AIプロンプト設計（1レッスン分）

対象: MVPの中核である「教材生成」と「AI添削」のプロンプト設計。
方針: 出力は必ずJSONのみ（マークダウンや説明文を含めない）とし、パース失敗を防ぐ。プロンプト本文は英語（モデルの追従精度が高いため）、学習者向けの説明文フィールドは日本語（`_ja`）で持たせる。

---

## 0. 共通のAIプロバイダー抽象化

```ts
interface AIProvider {
  generateLesson(input: LessonGenInput): Promise<LessonContent>
  generateNewsLesson(input: NewsLessonGenInput): Promise<LessonContent>
  correctSpeaking(input: SpeakingCorrectionInput): Promise<SpeakingFeedback>
  correctWriting(input: WritingCorrectionInput): Promise<WritingFeedback>
}
```

`OpenAIProvider` / `ClaudeProvider` がこれを実装し、環境変数で切り替え。プロンプト本文（system prompt）はプロバイダー非依存のテンプレートとして共通管理し、両モデルで同じJSONスキーマを強制する。

**モデル階層（コスト設計）:**

| 用途 | 呼び出し頻度 | モデル階層 |
|---|---|---|
| レッスン教材生成（バッチ・夜間） | 低頻度・共有教材 | 高性能モデル |
| ニュース要約・教材化（バッチ） | 低頻度・共有教材 | 高性能モデル |
| スピーキング/ライティング添削 | 高頻度・ユーザー毎 | 中位モデル（品質とコストのバランス、JSON出力で低temperature） |
| 自由英会話（将来） | 高頻度・リアルタイム | 低レイテンシモデル |

---

## 1. レッスン教材生成プロンプト（Daily Conversation / Business English / Review）

### Input

```ts
interface LessonGenInput {
  category: "daily_conversation" | "business_english" | "review"
  targetCefr: "A2" | "B1" | "B2" | "C1"
  theme: string                // 例: "ordering coffee and small talk"
  avoidThemes: string[]        // 直近使用済みテーマ（ローテーション用）
  focusGrammar?: string        // Reviewの場合、ユーザーの苦手文法を指定
  focusVocab?: string[]        // Reviewの場合、ユーザーの苦手語彙を指定
}
```

### System Prompt

```
You are an expert curriculum designer creating a 15-minute English lesson unit
for a Japanese learner. Output valid JSON ONLY — no markdown, no prose, no
code fences, matching the schema provided by the caller.

Design rules:
1. The dialogue must be natural, realistic spoken English between two people,
   calibrated to CEFR level {{targetCefr}}. Avoid textbook-stiff phrasing.
2. Keep the dialogue to roughly 120-220 words (~45-90 seconds spoken).
3. Every item in key_expressions, vocabulary, and grammar_point MUST occur
   naturally inside the dialogue. Do not introduce items that aren't used.
4. If focusGrammar or focusVocab are provided, the dialogue MUST incorporate
   them naturally — this lesson exists to help the learner review them.
5. speaking_task and writing_task must require the learner to actively reuse
   at least 2 key_expressions and the grammar_point — don't ask generic
   "talk about your day" questions disconnected from the lesson content.
6. Do not reuse any theme listed in avoidThemes.
```

### Output JSON Schema

```json
{
  "title": "string",
  "category": "daily_conversation | business_english | review",
  "cefr_level": "A2 | B1 | B2 | C1",
  "theme": "string",
  "dialogue": [
    { "speaker": "A|B", "line_en": "string", "line_ja": "string" }
  ],
  "comprehension_questions": [
    { "question_en": "string", "choices": ["string"], "answer": "string", "explanation_ja": "string" }
  ],
  "key_expressions": [
    { "phrase": "string", "meaning_ja": "string", "example_sentence": "string" }
  ],
  "grammar_point": {
    "name": "string",
    "explanation_ja": "string",
    "pattern": "string",
    "example_sentences": ["string"]
  },
  "vocabulary": [
    { "word": "string", "part_of_speech": "string", "meaning_ja": "string", "example_sentence": "string", "cefr_level": "string" }
  ],
  "speaking_task": {
    "prompt_en": "string",
    "prompt_ja": "string",
    "must_use_expressions": ["string"]
  },
  "writing_task": {
    "prompt_en": "string",
    "prompt_ja": "string",
    "min_words": 40,
    "must_use_grammar": "string"
  }
}
```

### 具体例（Daily Conversation, theme: "ordering coffee and small talk", CEFR A2–B1）

```json
{
  "title": "A Quick Coffee Chat",
  "category": "daily_conversation",
  "cefr_level": "A2",
  "theme": "ordering coffee and small talk",
  "dialogue": [
    { "speaker": "A", "line_en": "Hi, could I get a medium latte to go?", "line_ja": "こんにちは、Mサイズのラテをテイクアウトでお願いできますか？" },
    { "speaker": "B", "line_en": "Sure thing. Anything else for you today?", "line_ja": "かしこまりました。他にはいかがですか？" },
    { "speaker": "A", "line_en": "Actually, yeah — I'll grab a blueberry muffin too. It's been a long morning already.", "line_ja": "そうですね、ブルーベリーマフィンももらいます。今朝はもうバタバタで。" },
    { "speaker": "B", "line_en": "Tell me about it, we've been slammed since we opened. That'll be $7.50.", "line_ja": "ほんとそうですよね、開店してからずっと忙しくて。7ドル50セントになります。" }
  ],
  "comprehension_questions": [
    { "question_en": "What did the customer order besides a latte?", "choices": ["A croissant", "A blueberry muffin", "Nothing else"], "answer": "A blueberry muffin", "explanation_ja": "客は 'I'll grab a blueberry muffin too' と言っている。" }
  ],
  "key_expressions": [
    { "phrase": "to go", "meaning_ja": "持ち帰りで", "example_sentence": "Can I get this to go?" },
    { "phrase": "Tell me about it", "meaning_ja": "ほんとそれ（共感）", "example_sentence": "Tell me about it, I'm exhausted too." },
    { "phrase": "slammed", "meaning_ja": "（お店などが）めちゃくちゃ忙しい", "example_sentence": "We were slammed during lunch rush." }
  ],
  "grammar_point": {
    "name": "Present perfect continuous for ongoing situations",
    "explanation_ja": "'have/has been + -ing' で、過去から現在まで続いている状況を表す。",
    "pattern": "subject + have/has + been + verb-ing",
    "example_sentences": ["We've been slammed since we opened.", "It's been raining all day."]
  },
  "vocabulary": [
    { "word": "slammed", "part_of_speech": "adjective (informal)", "meaning_ja": "非常に忙しい", "example_sentence": "The restaurant was slammed on Friday night.", "cefr_level": "B1" }
  ],
  "speaking_task": {
    "prompt_en": "Imagine you're ordering at a busy cafe. Order a drink and a snack 'to go', then react when the barista says they've been slammed all morning.",
    "prompt_ja": "忙しいカフェで注文している場面を想像してください。飲み物と軽食を「to go」で注文し、店員が「ずっとslammedだった」と言ったら反応してください。",
    "must_use_expressions": ["to go", "slammed"]
  },
  "writing_task": {
    "prompt_en": "Write 3-4 sentences describing a time your workplace or a place you visited was 'slammed'. Use present perfect continuous at least once.",
    "prompt_ja": "職場や訪れた場所が「slammed（激混み）」だった経験を3〜4文で書いてください。現在完了進行形を1回以上使うこと。",
    "min_words": 40,
    "must_use_grammar": "present perfect continuous"
  }
}
```

---

## 2. News Discussion 用プロンプト（2段階生成）

News記事は生の英語ニュース（NewsAPI等から取得）をそのまま出すと難易度・長さが不適切なため、2段階で処理する。

### Stage A — ニュースの学習者向けアダプテーション

**Input:** 元記事本文（英語）、`targetCefr`

**System Prompt:**
```
You are adapting a real news article into a short listening passage for a
{{targetCefr}}-level English learner. Output valid JSON ONLY.

Rules:
1. Preserve factual accuracy — do not invent or distort facts from the source.
2. Simplify vocabulary and sentence structure to {{targetCefr}} level, but keep
   it sounding like natural spoken/narrated English, not a dumbed-down list.
3. Target length: 100-180 words.
4. Extract 5-8 keywords/phrases that are essential to understanding the story.
```

**Output schema:**
```json
{
  "adapted_passage_en": "string",
  "adapted_passage_ja": "string",
  "keywords": [{ "term": "string", "meaning_ja": "string" }],
  "source_title": "string",
  "source_url": "string"
}
```

### Stage B — 教材化（Stage Aの出力を入力に、セクション1と同じ後半スキーマを生成）

`comprehension_questions` / `key_expressions` / `vocabulary` はセクション1と同一スキーマ。加えて:

```json
{
  "discussion_prompts": [
    { "prompt_en": "string", "prompt_ja": "string" }
  ],
  "summary_task": {
    "prompt_en": "Summarize this news story in 2-3 sentences, including your own opinion.",
    "prompt_ja": "このニュースを2〜3文で要約し、自分の意見も添えてください。",
    "min_words": 30
  }
}
```

`discussion_prompts` は「AIとのディスカッション」フェーズで、リアルタイムAIが1問ずつ投げかけ、ユーザーの回答をフォローアップ質問で深掘りする（この部分だけはリアルタイムAI呼び出し）。

---

## 3. スピーキング添削プロンプト（リアルタイム・コア機能）

### Input

```ts
interface SpeakingCorrectionInput {
  lessonContext: {
    dialogueSummary: string
    keyExpressions: string[]
    grammarPoint: string
    targetCefr: string
  }
  userTranscript: string       // STTからのテキスト（ノイズを含む可能性あり）
  userProfile: {
    weakGrammar: string[]
    weakVocab: string[]
    recentCefr: string
  }
}
```

### System Prompt

```
You are a warm, encouraging English speaking coach for a Japanese learner —
act as a supportive coach who runs alongside the learner, not a strict
teacher. You receive: the lesson context, the learner's spoken response
(transcribed by speech-to-text, so assume occasional transcription noise
around homophones or unclear audio), and the learner's known weak points.

Output valid JSON ONLY, matching the schema.

Feedback philosophy (follow strictly):
1. Always identify 1-2 specific things the learner did well BEFORE any
   correction. Be specific — quote their actual words, don't give generic
   praise.
2. Every correction must quote the learner's exact original phrase, then the
   corrected version, then a short reason in Japanese.
3. Prioritize corrections related to (a) this lesson's target grammar point
   and key expressions, and (b) the learner's known weak points, before
   generic nitpicks.
4. Limit to the 3 most impactful corrections. Do not overwhelm the learner
   with every possible issue.
5. Never use discouraging language ("wrong", "bad", "failed"). Frame
   corrections as "an even more natural way to say this is...".
6. cefr_estimate must be a single CEFR sub-level (e.g. "B1", "B1+"), based on
   grammar range, vocabulary range, and coherence shown in this response only.
```

### Output JSON Schema

```json
{
  "strengths": ["string"],
  "grammar_corrections": [
    { "original": "string", "corrected": "string", "explanation_ja": "string" }
  ],
  "natural_expression_suggestions": [
    { "original": "string", "suggestion": "string", "why_ja": "string" }
  ],
  "vocabulary_upgrades": [
    { "used_word": "string", "suggested_word": "string", "nuance_ja": "string" }
  ],
  "fluency_feedback_ja": "string",
  "logical_coherence_feedback_ja": "string",
  "cefr_estimate": "string",
  "next_focus_point_ja": "string"
}
```

**発音フィードバックについての既知の制約（MVP）:** STTのテキストのみを入力とするため、音素レベルの発音採点はできない。文脈上不自然な単語への置き換わり（STTの誤認識）が起きた場合はそれを手がかりに「発音が聞き取りにくかった可能性がある単語」として`fluency_feedback_ja`に含める程度に留める。本格的な発音評価（例: Azure Pronunciation Assessment等の音声ベースAPI）は将来拡張とする。

---

## 4. ライティング添削プロンプト

スピーキング添削とほぼ同一だが、以下の差分:

- STTノイズがないため、文法・スペルの指摘はより厳密に行う。
- `fluency_feedback_ja` の代わりに `structure_feedback_ja`（段落構成・論理展開についてのフィードバック）を持つ。
- 発音関連フィールドは持たない。

### Output JSON Schema（差分のみ）

```json
{
  "strengths": ["string"],
  "grammar_corrections": [{ "original": "string", "corrected": "string", "explanation_ja": "string" }],
  "natural_expression_suggestions": [{ "original": "string", "suggestion": "string", "why_ja": "string" }],
  "vocabulary_upgrades": [{ "used_word": "string", "suggested_word": "string", "nuance_ja": "string" }],
  "structure_feedback_ja": "string",
  "logical_coherence_feedback_ja": "string",
  "cefr_estimate": "string",
  "next_focus_point_ja": "string"
}
```

---

## 5. 個別最適化（パーソナライゼーション）の連携ルール

1. 添削（3, 4）が返るたびに、`grammar_corrections` / `vocabulary_upgrades` / `cefr_estimate` を `LearningHistory` に構造化して保存する。
2. 次回レッスン生成（1のInput）時、直近N日でレビューされていない「頻出の弱点タグ」を`focusGrammar` / `focusVocab`として渡す。
3. Review カテゴリのレッスンは、この`focusGrammar`/`focusVocab`を必ず使い切ることを生成ルールで強制する（セクション1のSystem Promptルール4）。
4. `ReviewSchedule`は間隔反復（例: 1日後・3日後・7日後）で「まだ定着していない」弱点タグを再度Reviewレッスンの候補に戻す。

---

## 未決事項 / 次に詰めるべき点

- STT出力のタイムスタンプ・信頼度スコアを使えるなら、発音フィードバックの精度を上げられる（プロバイダー次第）。
- `cefr_estimate`の一貫性をどう担保するか（同じ実力のユーザーが日によってブレないか）→ 複数レッスン分の移動平均をLearningHistory側で計算する方が安全かもしれない。
- News Discussionの`discussion_prompts`はリアルタイムAI呼び出しになるため、コスト・レイテンシをどこまで許容するか要検討。
