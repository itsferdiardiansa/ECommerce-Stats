-- CreateEnum
CREATE TYPE "auth"."LoginLockoutReason" AS ENUM ('TOO_MANY_ATTEMPTS', 'SUSPICIOUS_ACTIVITY', 'MANUAL_LOCK');

-- CreateTable
CREATE TABLE "auth"."LoginLockout" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "reason" "auth"."LoginLockoutReason" NOT NULL DEFAULT 'TOO_MANY_ATTEMPTS',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires" TIMESTAMP(3) NOT NULL,
    "clearedAt" TIMESTAMP(3),
    "clearedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginLockout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginLockout_email_idx" ON "auth"."LoginLockout"("email");

-- CreateIndex
CREATE INDEX "LoginLockout_expires_idx" ON "auth"."LoginLockout"("expires");
