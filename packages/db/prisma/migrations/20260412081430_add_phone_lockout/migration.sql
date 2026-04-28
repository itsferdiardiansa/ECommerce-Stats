-- CreateEnum
CREATE TYPE "auth"."PhoneLockoutReason" AS ENUM ('TOO_MANY_ATTEMPTS', 'SUSPICIOUS_ACTIVITY', 'MANUAL_LOCK');

-- CreateTable
CREATE TABLE "auth"."PhoneLockout" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "reason" "auth"."PhoneLockoutReason" NOT NULL DEFAULT 'TOO_MANY_ATTEMPTS',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires" TIMESTAMP(3) NOT NULL,
    "clearedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhoneLockout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PhoneLockout_phone_idx" ON "auth"."PhoneLockout"("phone");

-- CreateIndex
CREATE INDEX "PhoneLockout_expires_idx" ON "auth"."PhoneLockout"("expires");
