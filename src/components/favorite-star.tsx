"use client";

import { useState, useTransition } from "react";
import {
  toggleFavoriteExpressionAction,
  toggleFavoriteGrammarAction,
  toggleFavoriteVocabularyAction,
} from "@/lib/favorites/actions";
import styles from "./favorite-star.module.css";

interface FavoriteStarProps {
  kind: "vocabulary" | "grammar" | "expression";
  itemId: string;
  lessonId: string;
  initialFavorited: boolean;
}

const TOGGLE_ACTIONS = {
  vocabulary: toggleFavoriteVocabularyAction,
  grammar: toggleFavoriteGrammarAction,
  expression: toggleFavoriteExpressionAction,
} as const;

export default function FavoriteStar({ kind, itemId, lessonId, initialFavorited }: FavoriteStarProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const next = await TOGGLE_ACTIONS[kind](itemId, lessonId);
      setFavorited(next);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={favorited ? "お気に入りから削除" : "お気に入りに追加"}
      aria-pressed={favorited}
      className={styles.favoriteStar}
    >
      {favorited ? "★" : "☆"}
    </button>
  );
}
