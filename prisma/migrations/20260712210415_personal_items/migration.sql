-- AlterTable
ALTER TABLE "Expression" ADD COLUMN     "createdByUserId" TEXT,
ALTER COLUMN "lessonId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Grammar" ADD COLUMN     "createdByUserId" TEXT,
ALTER COLUMN "lessonId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Vocabulary" ADD COLUMN     "createdByUserId" TEXT,
ALTER COLUMN "lessonId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Expression_createdByUserId_idx" ON "Expression"("createdByUserId");

-- CreateIndex
CREATE INDEX "Grammar_createdByUserId_idx" ON "Grammar"("createdByUserId");

-- CreateIndex
CREATE INDEX "Vocabulary_createdByUserId_idx" ON "Vocabulary"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Vocabulary" ADD CONSTRAINT "Vocabulary_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expression" ADD CONSTRAINT "Expression_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grammar" ADD CONSTRAINT "Grammar_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
