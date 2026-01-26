/*
  Warnings:

  - You are about to drop the column `externalId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `userExternalId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Order_externalId_key";

-- DropIndex
DROP INDEX "Order_userExternalId_idx";

-- DropIndex
DROP INDEX "Product_externalId_key";

-- DropIndex
DROP INDEX "User_externalId_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "externalId",
DROP COLUMN "userExternalId",
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Order_id_seq";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "externalId",
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Product_id_seq";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "externalId";
