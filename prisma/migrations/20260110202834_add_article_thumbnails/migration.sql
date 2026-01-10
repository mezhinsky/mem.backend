-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "ogImageAssetId" TEXT,
ADD COLUMN     "thumbnailAssetId" TEXT;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_thumbnailAssetId_fkey" FOREIGN KEY ("thumbnailAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_ogImageAssetId_fkey" FOREIGN KEY ("ogImageAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
