-- AlterTable
ALTER TABLE "auth"."LoginHistory" ADD COLUMN     "attemptedEmail" TEXT,
ADD COLUMN     "deviceFingerprint" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "LoginHistory_userId_deviceFingerprint_idx" ON "auth"."LoginHistory"("userId", "deviceFingerprint");

-- CreateIndex
CREATE INDEX "LoginHistory_ipAddress_createdAt_idx" ON "auth"."LoginHistory"("ipAddress", "createdAt");
