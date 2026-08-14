-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "internal";

-- CreateEnum
CREATE TYPE "internal"."StaffStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "internal"."StaffAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "status" "internal"."StaffStatus" NOT NULL DEFAULT 'INVITED',
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StaffAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal"."StaffRole" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StaffRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal"."Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal"."StaffRolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    CONSTRAINT "StaffRolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "internal"."StaffAccountRole" (
    "staffAccountId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffAccountRole_pkey" PRIMARY KEY ("staffAccountId","roleId")
);

-- CreateTable
CREATE TABLE "internal"."StaffSession" (
    "id" TEXT NOT NULL,
    "staffAccountId" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expires" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal"."StaffTotp" (
    "id" TEXT NOT NULL,
    "staffAccountId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffTotp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal"."StaffPasskey" (
    "id" TEXT NOT NULL,
    "staffAccountId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "transports" TEXT,
    "deviceType" TEXT,
    "backedUp" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffPasskey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internal"."AdminAuditLog" (
    "id" TEXT NOT NULL,
    "staffAccountId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffAccount_email_key" ON "internal"."StaffAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StaffRole_key_key" ON "internal"."StaffRole"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "internal"."Permission"("key");

-- CreateIndex
CREATE UNIQUE INDEX "StaffSession_jti_key" ON "internal"."StaffSession"("jti");

-- CreateIndex
CREATE INDEX "StaffSession_staffAccountId_idx" ON "internal"."StaffSession"("staffAccountId");

-- CreateIndex
CREATE INDEX "StaffSession_expires_isRevoked_idx" ON "internal"."StaffSession"("expires", "isRevoked");

-- CreateIndex
CREATE UNIQUE INDEX "StaffTotp_staffAccountId_key" ON "internal"."StaffTotp"("staffAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffPasskey_credentialId_key" ON "internal"."StaffPasskey"("credentialId");

-- CreateIndex
CREATE INDEX "StaffPasskey_staffAccountId_idx" ON "internal"."StaffPasskey"("staffAccountId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "internal"."AdminAuditLog"("action");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetType_targetId_idx" ON "internal"."AdminAuditLog"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "internal"."StaffAccount" ADD CONSTRAINT "StaffAccount_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "internal"."StaffAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal"."StaffRolePermission" ADD CONSTRAINT "StaffRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "internal"."StaffRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal"."StaffRolePermission" ADD CONSTRAINT "StaffRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "internal"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal"."StaffAccountRole" ADD CONSTRAINT "StaffAccountRole_staffAccountId_fkey" FOREIGN KEY ("staffAccountId") REFERENCES "internal"."StaffAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal"."StaffAccountRole" ADD CONSTRAINT "StaffAccountRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "internal"."StaffRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal"."StaffSession" ADD CONSTRAINT "StaffSession_staffAccountId_fkey" FOREIGN KEY ("staffAccountId") REFERENCES "internal"."StaffAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal"."StaffTotp" ADD CONSTRAINT "StaffTotp_staffAccountId_fkey" FOREIGN KEY ("staffAccountId") REFERENCES "internal"."StaffAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal"."StaffPasskey" ADD CONSTRAINT "StaffPasskey_staffAccountId_fkey" FOREIGN KEY ("staffAccountId") REFERENCES "internal"."StaffAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal"."AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_staffAccountId_fkey" FOREIGN KEY ("staffAccountId") REFERENCES "internal"."StaffAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
