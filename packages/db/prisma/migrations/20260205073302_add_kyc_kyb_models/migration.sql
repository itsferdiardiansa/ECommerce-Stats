-- CreateEnum
CREATE TYPE "user"."KycStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'REQUIRES_ACTION');

-- CreateEnum
CREATE TYPE "user"."KycDocumentType" AS ENUM ('PASSPORT', 'ID_CARD', 'DRIVERS_LICENSE', 'UTILITY_BILL', 'COMPANY_REGISTRATION', 'TAX_DOCUMENT', 'OTHER');

-- CreateTable
CREATE TABLE "user"."IdentityVerification" (
    "id" TEXT NOT NULL,
    "userId" INTEGER,
    "organizationId" TEXT,
    "status" "user"."KycStatus" NOT NULL DEFAULT 'PENDING',
    "level" TEXT NOT NULL DEFAULT 'STANDARD',
    "legalName" TEXT,
    "registrationNo" TEXT,
    "taxId" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "IdentityVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user"."KycDocument" (
    "id" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "type" "user"."KycDocumentType" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "user"."KycStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentityVerification_userId_key" ON "user"."IdentityVerification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "IdentityVerification_organizationId_key" ON "user"."IdentityVerification"("organizationId");

-- AddForeignKey
ALTER TABLE "user"."IdentityVerification" ADD CONSTRAINT "IdentityVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user"."IdentityVerification" ADD CONSTRAINT "IdentityVerification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "user"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user"."KycDocument" ADD CONSTRAINT "KycDocument_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "user"."IdentityVerification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
