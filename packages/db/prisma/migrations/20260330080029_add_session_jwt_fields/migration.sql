/*
  Warnings:

  - You are about to drop the column `sessionToken` on the `Session` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[jti]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jti` to the `Session` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refreshTokenHash` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "auth"."Session_sessionToken_key";

-- AlterTable
ALTER TABLE "auth"."Session" DROP COLUMN "sessionToken",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "isRevoked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jti" TEXT NOT NULL,
ADD COLUMN     "lastUsedAt" TIMESTAMP(3),
ADD COLUMN     "orgId" TEXT,
ADD COLUMN     "refreshTokenHash" TEXT NOT NULL,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "userAgent" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Session_jti_key" ON "auth"."Session"("jti");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "auth"."Session"("userId");

-- CreateIndex
CREATE INDEX "Session_jti_idx" ON "auth"."Session"("jti");

-- CreateIndex
CREATE INDEX "Session_expires_isRevoked_idx" ON "auth"."Session"("expires", "isRevoked");
