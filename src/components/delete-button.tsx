"use client";

import { useState, useTransition } from "react";
import {
  deletePersonalExpressionAction,
  deletePersonalGrammarAction,
  deletePersonalVocabularyAction,
} from "@/lib/favorites/personal-actions";

interface DeleteButtonProps {
  kind: "vocabulary" | "expression" | "grammar";
  itemId: string;
  className?: string;
}

const DELETE_ACTIONS = {
  vocabulary: deletePersonalVocabularyAction,
  expression: deletePersonalExpressionAction,
  grammar: deletePersonalGrammarAction,
} as const;

export default function DeleteButton({ kind, itemId, className }: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);

  function handleClick() {
    if (!window.confirm("削除しますか？")) return;
    startTransition(async () => {
      await DELETE_ACTIONS[kind](itemId);
      setDeleted(true);
    });
  }

  if (deleted) return null;

  return (
    <button type="button" onClick={handleClick} disabled={isPending} className={className}>
      {isPending ? "削除中..." : "削除"}
    </button>
  );
}
