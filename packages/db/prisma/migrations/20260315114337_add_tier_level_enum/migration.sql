/*
  Warnings:

  - The `tierLevel` column on the `UserProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `username` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `passwordHash` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "user"."TierLevel" AS ENUM ('BASIC', 'PRO', 'PREMIUM');

-- AlterTable
ALTER TABLE "user"."User" ALTER COLUMN "username" SET NOT NULL,
ALTER COLUMN "passwordHash" SET NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "isActive" SET DEFAULT false;

-- AlterTable
ALTER TABLE "user"."UserProfile" DROP COLUMN "tierLevel",
ADD COLUMN     "tierLevel" "user"."TierLevel" NOT NULL DEFAULT 'BASIC';
