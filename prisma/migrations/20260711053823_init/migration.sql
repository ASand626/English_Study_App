-- CreateEnum
CREATE TYPE "LessonCategory" AS ENUM ('daily_conversation', 'business_english', 'news_discussion', 'review');

-- CreateEnum
CREATE TYPE "CefrLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "ReviewItemType" AS ENUM ('grammar', 'vocabulary');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "currentCefrEstimate" "CefrLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "category" "LessonCategory" NOT NULL,
    "cefrLevel" "CefrLevel" NOT NULL,
    "theme" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "comprehensionQuestions" JSONB NOT NULL,
    "keyExpressions" JSONB NOT NULL,
    "speakingTask" JSONB NOT NULL,
    "writingTask" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dialogue" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "speaker" TEXT NOT NULL,
    "lineEn" TEXT NOT NULL,
    "lineJa" TEXT NOT NULL,

    CONSTRAINT "Dialogue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vocabulary" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "partOfSpeech" TEXT NOT NULL,
    "meaningJa" TEXT NOT NULL,
    "exampleSentence" TEXT NOT NULL,
    "cefrLevel" "CefrLevel" NOT NULL,

    CONSTRAINT "Vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grammar" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "explanationJa" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "exampleSentences" JSONB NOT NULL,

    CONSTRAINT "Grammar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsLesson" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "sourceTitle" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "adaptedPassageEn" TEXT NOT NULL,
    "adaptedPassageJa" TEXT NOT NULL,
    "keywords" JSONB NOT NULL,
    "discussionPrompts" JSONB NOT NULL,
    "summaryTask" JSONB NOT NULL,

    CONSTRAINT "NewsLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weakGrammarTags" JSONB NOT NULL,
    "weakVocabTags" JSONB NOT NULL,
    "cefrEstimateAtTime" "CefrLevel" NOT NULL,

    CONSTRAINT "LearningHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakingFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "userTranscript" TEXT NOT NULL,
    "strengths" JSONB NOT NULL,
    "grammarCorrections" JSONB NOT NULL,
    "naturalExpressionSuggestions" JSONB NOT NULL,
    "vocabularyUpgrades" JSONB NOT NULL,
    "fluencyFeedbackJa" TEXT NOT NULL,
    "logicalCoherenceFeedbackJa" TEXT NOT NULL,
    "cefrEstimate" "CefrLevel" NOT NULL,
    "nextFocusPointJa" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpeakingFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WritingFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "userText" TEXT NOT NULL,
    "strengths" JSONB NOT NULL,
    "grammarCorrections" JSONB NOT NULL,
    "naturalExpressionSuggestions" JSONB NOT NULL,
    "vocabularyUpgrades" JSONB NOT NULL,
    "structureFeedbackJa" TEXT NOT NULL,
    "logicalCoherenceFeedbackJa" TEXT NOT NULL,
    "cefrEstimate" "CefrLevel" NOT NULL,
    "nextFocusPointJa" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WritingFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" "ReviewItemType" NOT NULL,
    "itemLabel" TEXT NOT NULL,
    "intervalStage" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "lastReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Dialogue_lessonId_idx" ON "Dialogue"("lessonId");

-- CreateIndex
CREATE INDEX "Vocabulary_lessonId_idx" ON "Vocabulary"("lessonId");

-- CreateIndex
CREATE INDEX "Grammar_lessonId_idx" ON "Grammar"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsLesson_lessonId_key" ON "NewsLesson"("lessonId");

-- CreateIndex
CREATE INDEX "LearningHistory_userId_idx" ON "LearningHistory"("userId");

-- CreateIndex
CREATE INDEX "LearningHistory_lessonId_idx" ON "LearningHistory"("lessonId");

-- CreateIndex
CREATE INDEX "SpeakingFeedback_userId_idx" ON "SpeakingFeedback"("userId");

-- CreateIndex
CREATE INDEX "SpeakingFeedback_lessonId_idx" ON "SpeakingFeedback"("lessonId");

-- CreateIndex
CREATE INDEX "WritingFeedback_userId_idx" ON "WritingFeedback"("userId");

-- CreateIndex
CREATE INDEX "WritingFeedback_lessonId_idx" ON "WritingFeedback"("lessonId");

-- CreateIndex
CREATE INDEX "ReviewSchedule_userId_dueAt_idx" ON "ReviewSchedule"("userId", "dueAt");

-- AddForeignKey
ALTER TABLE "Dialogue" ADD CONSTRAINT "Dialogue_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vocabulary" ADD CONSTRAINT "Vocabulary_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grammar" ADD CONSTRAINT "Grammar_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsLesson" ADD CONSTRAINT "NewsLesson_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningHistory" ADD CONSTRAINT "LearningHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningHistory" ADD CONSTRAINT "LearningHistory_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingFeedback" ADD CONSTRAINT "SpeakingFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingFeedback" ADD CONSTRAINT "SpeakingFeedback_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingFeedback" ADD CONSTRAINT "WritingFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingFeedback" ADD CONSTRAINT "WritingFeedback_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSchedule" ADD CONSTRAINT "ReviewSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
