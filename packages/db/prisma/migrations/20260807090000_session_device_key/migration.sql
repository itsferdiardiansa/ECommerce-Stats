-- AlterTable
ALTER TABLE "auth"."Session" ADD COLUMN "deviceKey" TEXT;

-- DropIndex
DROP INDEX "auth"."Session_userId_deviceFingerprint_key";

-- CreateIndex
CREATE UNIQUE INDEX "Session_userId_deviceKey_key" ON "auth"."Session"("userId", "deviceKey");
