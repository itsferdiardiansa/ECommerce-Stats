-- DropForeignKey
ALTER TABLE "auth"."Authenticator" DROP CONSTRAINT "Authenticator_userId_fkey";

-- DropTable
DROP TABLE "auth"."Authenticator";

-- CreateTable
CREATE TABLE "auth"."Passkey" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL DEFAULT false,
    "transports" TEXT[],
    "userHandle" TEXT NOT NULL,
    "name" TEXT,
    "aaguid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "Passkey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Passkey_credentialId_key" ON "auth"."Passkey"("credentialId");

-- CreateIndex
CREATE INDEX "Passkey_userId_idx" ON "auth"."Passkey"("userId");

-- AddForeignKey
ALTER TABLE "auth"."Passkey" ADD CONSTRAINT "Passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

