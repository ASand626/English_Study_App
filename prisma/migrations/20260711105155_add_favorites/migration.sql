-- CreateTable
CREATE TABLE "FavoriteVocabulary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vocabularyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteVocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteGrammar" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grammarId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteGrammar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteVocabulary_userId_vocabularyId_key" ON "FavoriteVocabulary"("userId", "vocabularyId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteGrammar_userId_grammarId_key" ON "FavoriteGrammar"("userId", "grammarId");

-- AddForeignKey
ALTER TABLE "FavoriteVocabulary" ADD CONSTRAINT "FavoriteVocabulary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteVocabulary" ADD CONSTRAINT "FavoriteVocabulary_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteGrammar" ADD CONSTRAINT "FavoriteGrammar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteGrammar" ADD CONSTRAINT "FavoriteGrammar_grammarId_fkey" FOREIGN KEY ("grammarId") REFERENCES "Grammar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
