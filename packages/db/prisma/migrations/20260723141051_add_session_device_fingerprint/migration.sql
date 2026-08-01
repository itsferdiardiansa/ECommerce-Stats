-- AlterTable
ALTER TABLE "auth"."LoginHistory" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "auth"."Session" ADD COLUMN     "deviceFingerprint" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Session_userId_deviceFingerprint_key" ON "auth"."Session"("userId", "deviceFingerprint");
