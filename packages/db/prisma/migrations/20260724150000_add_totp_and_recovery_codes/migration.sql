-- DropForeignKey
ALTER TABLE "auth"."TwoFactorConfirmation" DROP CONSTRAINT "TwoFactorConfirmation_userId_fkey";

-- DropTable
DROP TABLE "auth"."TwoFactorConfirmation";

-- DropTable
DROP TABLE "auth"."TwoFactorToken";

-- CreateTable
CREATE TABLE "auth"."UserTotp" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "secret" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserTotp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."RecoveryCode" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "codeHash" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserTotp_userId_key" ON "auth"."UserTotp"("userId");

-- CreateIndex
CREATE INDEX "RecoveryCode_userId_idx" ON "auth"."RecoveryCode"("userId");

-- AddForeignKey
ALTER TABLE "auth"."UserTotp" ADD CONSTRAINT "UserTotp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."RecoveryCode" ADD CONSTRAINT "RecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

