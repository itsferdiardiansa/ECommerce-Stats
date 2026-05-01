-- AlterTable
ALTER TABLE "auth"."PhoneLockout" ADD COLUMN "userId" INTEGER;

-- CreateIndex
CREATE INDEX "PhoneLockout_phone_userId_idx" ON "auth"."PhoneLockout"("phone", "userId");
