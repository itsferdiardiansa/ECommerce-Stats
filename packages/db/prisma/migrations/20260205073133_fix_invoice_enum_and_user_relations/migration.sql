/*
  Warnings:

  - Changed the type of `status` on the `Invoice` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "billing"."InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE');

-- AlterTable
ALTER TABLE "billing"."Invoice" DROP COLUMN "status",
ADD COLUMN     "status" "billing"."InvoiceStatus" NOT NULL;
