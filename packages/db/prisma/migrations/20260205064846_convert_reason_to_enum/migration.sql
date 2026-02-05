/*
  Warnings:

  - The `reason` column on the `LoginHistory` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "auth"."LoginReason" AS ENUM ('SUCCESS', 'INVALID_PASSWORD', 'USER_NOT_FOUND', 'ACCOUNT_LOCKED', 'ACCOUNT_DISABLED', 'EMAIL_NOT_VERIFIED', 'TWO_FACTOR_REQUIRED', 'TWO_FACTOR_INVALID', 'RECOVERY_CODE_INVALID', 'OAUTH_ERROR', 'IP_RESTRICTED', 'UNKNOWN_ERROR');

-- AlterTable
ALTER TABLE "auth"."LoginHistory" DROP COLUMN "reason",
ADD COLUMN     "reason" "auth"."LoginReason";
