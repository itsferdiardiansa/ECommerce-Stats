-- CreateEnum
CREATE TYPE "auth"."VerificationLockoutReason" AS ENUM ('TOO_MANY_ATTEMPTS', 'SUSPICIOUS_ACTIVITY', 'MANUAL_LOCK');

-- CreateTable
CREATE TABLE "auth"."VerificationLockout" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "reason" "auth"."VerificationLockoutReason" NOT NULL DEFAULT 'TOO_MANY_ATTEMPTS',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires" TIMESTAMP(3) NOT NULL,
    "clearedAt" TIMESTAMP(3),
    "clearedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationLockout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationLockout_email_idx" ON "auth"."VerificationLockout"("email");

-- CreateIndex
CREATE INDEX "VerificationLockout_expires_idx" ON "auth"."VerificationLockout"("expires");

-- CreateIndex
CREATE INDEX "VerificationLockout_createdAt_idx" ON "auth"."VerificationLockout"("createdAt");
