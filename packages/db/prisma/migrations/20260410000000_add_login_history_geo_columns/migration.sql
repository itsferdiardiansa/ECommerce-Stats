-- AlterTable (already applied manually)
ALTER TABLE "auth"."LoginHistory" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "auth"."LoginHistory" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
