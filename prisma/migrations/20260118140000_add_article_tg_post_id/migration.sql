-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "tgPostId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Article_tgPostId_key" ON "Article"("tgPostId");

