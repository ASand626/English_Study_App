import Link from "next/link";
import ScrollReveal from "@/components/scroll-reveal";
import styles from "./page.module.css";

const CATEGORIES = [
  {
    key: "daily",
    emoji: "☕",
    color: "var(--cat-daily)",
    soft: "var(--primary-soft)",
    title: "Daily Conversation",
    ja: "日常会話",
    body: "カフェでの注文、雑談、ちょっとした一言。毎日使う場面から、自然な英語を身につける。",
  },
  {
    key: "business",
    emoji: "💼",
    color: "var(--cat-business)",
    soft: "var(--purple-soft)",
    title: "Business English",
    ja: "ビジネス英会話",
    body: "レベルが上がるほど、Web3・金融など旬の話題も織り込みながら実践力を鍛える。",
  },
  {
    key: "news",
    emoji: "📰",
    color: "var(--cat-news)",
    soft: "var(--secondary-soft)",
    title: "News Discussion",
    ja: "ニュース",
    body: "暗号資産・経済ニュースを教材化。世界の動きを英語で理解し、意見を話せるようになる。",
  },
  {
    key: "review",
    emoji: "🔁",
    color: "var(--cat-review)",
    soft: "var(--accent-soft)",
    title: "Review",
    ja: "復習",
    body: "AIが記録したあなたの苦手を、翌日の教材へ自動で反映。学ぶほど自分専用になる。",
  },
];

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.blobPink} />
        <div className={styles.blobMint} />
        <div className={styles.blobYellow} />
        <div className={styles.heroContent}>
          <span className={styles.kicker}>AI英語学習アプリ</span>
          <h1 className={styles.heroTitle}>
            1日15分、
            <br />
            話せる英語が育つ。
          </h1>
          <p className={styles.heroSubtitle}>
            リスニングも、文法も、スピーキングも。1つの会話から、まるごと学ぶ。
            <br />
            AIコーチが、あなただけの伸びしろに寄り添う。
          </p>
          <Link href="/login" className={styles.ctaButton}>
            ログインして始める
          </Link>
        </div>
      </section>

      {CATEGORIES.map((category, index) => (
        <ScrollReveal key={category.key} className={styles.featureSection}>
          <div className={index % 2 === 1 ? styles.featureRowReverse : styles.featureRow}>
            <div className={styles.featureBadge} style={{ background: category.soft }}>
              <span className={styles.featureEmoji}>{category.emoji}</span>
            </div>
            <div className={styles.featureText}>
              <span className={styles.featureKicker} style={{ color: category.color }}>
                {category.ja}
              </span>
              <h2 className={styles.featureTitle}>{category.title}</h2>
              <p className={styles.featureBody}>{category.body}</p>
            </div>
          </div>
        </ScrollReveal>
      ))}

      <ScrollReveal className={styles.coachSection}>
        <div className={styles.coachCard}>
          <span className={styles.coachKicker}>AI添削</span>
          <h2 className={styles.featureTitle}>先生じゃない、伴走するコーチ。</h2>
          <p className={styles.featureBody}>
            良かった点を先に伝えて、そのうえで改善点を提案。文法・自然な言い回し・語彙・CEFR評価まで、
            話すたび、書くたびに専属コーチが寄り添う。
          </p>
        </div>
      </ScrollReveal>

      <ScrollReveal className={styles.finalCta}>
        <h2 className={styles.finalCtaTitle}>さあ、はじめよう。</h2>
        <Link href="/login" className={styles.ctaButton}>
          ログインして始める
        </Link>
      </ScrollReveal>
    </main>
  );
}
