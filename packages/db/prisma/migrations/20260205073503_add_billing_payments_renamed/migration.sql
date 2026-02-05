-- CreateEnum
CREATE TYPE "billing"."PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'REFUNDED', 'REQUIRES_ACTION');

-- CreateTable
CREATE TABLE "billing"."BillingPaymentMethod" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "providerMethodId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'card',
    "brand" TEXT,
    "last4" TEXT,
    "expMonth" INTEGER,
    "expYear" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing"."BillingPayment" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "billing"."PaymentStatus" NOT NULL,
    "providerPaymentId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "organizationId" TEXT NOT NULL,
    "methodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingPaymentMethod_providerMethodId_key" ON "billing"."BillingPaymentMethod"("providerMethodId");

-- CreateIndex
CREATE INDEX "BillingPaymentMethod_organizationId_idx" ON "billing"."BillingPaymentMethod"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingPayment_providerPaymentId_key" ON "billing"."BillingPayment"("providerPaymentId");

-- CreateIndex
CREATE INDEX "BillingPayment_invoiceId_idx" ON "billing"."BillingPayment"("invoiceId");

-- CreateIndex
CREATE INDEX "BillingPayment_organizationId_idx" ON "billing"."BillingPayment"("organizationId");

-- AddForeignKey
ALTER TABLE "billing"."BillingPaymentMethod" ADD CONSTRAINT "BillingPaymentMethod_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "user"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."BillingPayment" ADD CONSTRAINT "BillingPayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "billing"."Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."BillingPayment" ADD CONSTRAINT "BillingPayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "user"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing"."BillingPayment" ADD CONSTRAINT "BillingPayment_methodId_fkey" FOREIGN KEY ("methodId") REFERENCES "billing"."BillingPaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
