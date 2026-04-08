-- Add deviceFingerprint to Session table.
-- Column is required in the schema (NOT NULL) but existing rows need a placeholder,
-- so we add as nullable, backfill with jti (already unique per session), then tighten.

-- Step 1: add nullable
ALTER TABLE "auth"."Session" ADD COLUMN "deviceFingerprint" TEXT;

-- Step 2: backfill existing rows using jti as a unique stand-in fingerprint
UPDATE "auth"."Session" SET "deviceFingerprint" = "jti" WHERE "deviceFingerprint" IS NULL;

-- Step 3: enforce NOT NULL
ALTER TABLE "auth"."Session" ALTER COLUMN "deviceFingerprint" SET NOT NULL;

-- Step 4: unique constraint on (userId, deviceFingerprint)
CREATE UNIQUE INDEX "Session_userId_deviceFingerprint_key" ON "auth"."Session"("userId", "deviceFingerprint");
