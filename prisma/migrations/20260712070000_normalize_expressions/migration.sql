-- CreateTable
CREATE TABLE "Expression" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "meaningJa" TEXT NOT NULL,
    "exampleSentence" TEXT NOT NULL,

    CONSTRAINT "Expression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteExpression" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expressionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteExpression_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expression_lessonId_idx" ON "Expression"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteExpression_userId_expressionId_key" ON "FavoriteExpression"("userId", "expressionId");

-- AddForeignKey
ALTER TABLE "Expression" ADD CONSTRAINT "Expression_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteExpression" ADD CONSTRAINT "FavoriteExpression_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteExpression" ADD CONSTRAINT "FavoriteExpression_expressionId_fkey" FOREIGN KEY ("expressionId") REFERENCES "Expression"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: migrate existing Lesson.keyExpressions JSON rows into Expression
-- before dropping the column, so pre-existing lessons keep their expressions.
INSERT INTO "Expression" ("id", "lessonId", "phrase", "meaningJa", "exampleSentence")
SELECT
  gen_random_uuid()::text,
  l."id",
  elem->>'phrase',
  elem->>'meaning_ja',
  elem->>'example_sentence'
FROM "Lesson" l, jsonb_array_elements(l."keyExpressions") AS elem
WHERE l."keyExpressions" IS NOT NULL;

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "keyExpressions";
