/*
  Warnings:

  - You are about to drop the column `userExternalId` on the `ProductReview` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productId,userId]` on the table `ProductReview` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ProductReview_productId_userExternalId_key";

-- DropIndex
DROP INDEX "ProductReview_userExternalId_idx";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "price" DROP NOT NULL,
ALTER COLUMN "rating" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "ProductReview" DROP COLUMN "userExternalId";

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_productId_userId_key" ON "ProductReview"("productId", "userId");
