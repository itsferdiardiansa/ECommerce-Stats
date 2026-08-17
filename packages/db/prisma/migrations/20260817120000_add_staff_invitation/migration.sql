-- CreateEnum
CREATE TYPE "internal"."StaffInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "internal"."StaffInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "internal"."StaffInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "roleKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "resentAt" TIMESTAMP(3),
    "resendCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "invitedById" TEXT,
    "staffAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StaffInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffInvitation_staffAccountId_key" ON "internal"."StaffInvitation"("staffAccountId");

-- CreateIndex
CREATE INDEX "StaffInvitation_email_idx" ON "internal"."StaffInvitation"("email");

-- CreateIndex
CREATE INDEX "StaffInvitation_status_idx" ON "internal"."StaffInvitation"("status");

-- CreateIndex
CREATE INDEX "StaffInvitation_expiresAt_idx" ON "internal"."StaffInvitation"("expiresAt");

-- AddForeignKey
ALTER TABLE "internal"."StaffInvitation" ADD CONSTRAINT "StaffInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "internal"."StaffAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal"."StaffInvitation" ADD CONSTRAINT "StaffInvitation_staffAccountId_fkey" FOREIGN KEY ("staffAccountId") REFERENCES "internal"."StaffAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
