-- CreateTable
CREATE TABLE "fact_orders" (
    "id" BIGSERIAL NOT NULL,
    "orderId" BIGINT NOT NULL,
    "userId" BIGINT,
    "orderTs" TIMESTAMP(3) NOT NULL,
    "dateId" INTEGER NOT NULL,
    "subtotal" DECIMAL(18,4) NOT NULL,
    "taxTotal" DECIMAL(18,4) NOT NULL,
    "shippingTotal" DECIMAL(18,4) NOT NULL,
    "discountTotal" DECIMAL(18,4) NOT NULL,
    "grandTotal" DECIMAL(18,4) NOT NULL,
    "marginTotal" DECIMAL(18,4),
    "itemCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "shippingStatus" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "source" TEXT,
    "couponCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "fact_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_order_items" (
    "id" BIGSERIAL NOT NULL,
    "orderItemId" BIGINT NOT NULL,
    "orderId" BIGINT NOT NULL,
    "productId" BIGINT NOT NULL,
    "productScId" BIGINT,
    "dateId" INTEGER NOT NULL,
    "orderTs" TIMESTAMP(3) NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitPrice" DECIMAL(18,4) NOT NULL,
    "unitCost" DECIMAL(18,4),
    "taxAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "extendedPrice" DECIMAL(18,4) NOT NULL,
    "margin" DECIMAL(18,4),
    "variantSku" TEXT,
    "productName" TEXT NOT NULL,
    "categoryName" TEXT,
    "brandName" TEXT,
    "isReturned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_payments" (
    "id" BIGSERIAL NOT NULL,
    "paymentId" BIGINT NOT NULL,
    "orderId" BIGINT,
    "dateId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "method" TEXT,
    "status" TEXT NOT NULL,
    "errorCode" TEXT,
    "isSuccess" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_shipments" (
    "id" BIGSERIAL NOT NULL,
    "shipmentId" BIGINT NOT NULL,
    "orderId" BIGINT NOT NULL,
    "dateId" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION,
    "cost" DECIMAL(18,4),
    "carrier" TEXT NOT NULL,
    "serviceLevel" TEXT,
    "shippedTs" TIMESTAMP(3),
    "deliveredTs" TIMESTAMP(3),
    "deliveryDays" DOUBLE PRECISION,
    "isOnTime" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fact_shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_sessions" (
    "id" BIGSERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" BIGINT,
    "visitorId" TEXT,
    "dateId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationSec" INTEGER,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "eventsCount" INTEGER NOT NULL DEFAULT 0,
    "cartAddCount" INTEGER NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "bounce" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT,
    "medium" TEXT,
    "campaign" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "country" TEXT,
    "city" TEXT,

    CONSTRAINT "fact_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_pageviews" (
    "id" BIGSERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" BIGINT,
    "url" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "timeOnPageSec" INTEGER,
    "scrollDepth" INTEGER,
    "loadTimeMs" INTEGER,
    "productId" BIGINT,
    "categoryId" INTEGER,

    CONSTRAINT "fact_pageviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_searches" (
    "id" BIGSERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "query" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "clickedResultPos" INTEGER,
    "converted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "fact_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_cart_activity" (
    "id" BIGSERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" BIGINT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "action" TEXT NOT NULL,
    "productId" BIGINT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantityDelta" INTEGER NOT NULL,
    "priceSnapshot" DECIMAL(18,4) NOT NULL,

    CONSTRAINT "fact_cart_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fact_reviews" (
    "id" BIGSERIAL NOT NULL,
    "reviewId" BIGINT NOT NULL,
    "productId" BIGINT NOT NULL,
    "userId" BIGINT,
    "dateId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "rating" INTEGER NOT NULL,
    "hasText" BOOLEAN NOT NULL,
    "hasImages" BOOLEAN NOT NULL,
    "textLength" INTEGER NOT NULL,
    "sentimentScore" DOUBLE PRECISION,
    "verified" BOOLEAN NOT NULL,

    CONSTRAINT "fact_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_products" (
    "productScId" BIGSERIAL NOT NULL,
    "productId" BIGINT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER,
    "brandId" INTEGER,
    "currentPrice" DECIMAL(18,4) NOT NULL,
    "costPrice" DECIMAL(18,4),
    "isActive" BOOLEAN NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "categoryName" TEXT,
    "brandName" TEXT,
    "supplier" TEXT,
    "tags" TEXT[],

    CONSTRAINT "dim_products_pkey" PRIMARY KEY ("productScId")
);

-- CreateTable
CREATE TABLE "dim_users" (
    "userScId" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "email" TEXT,
    "city" TEXT,
    "country" TEXT,
    "gender" TEXT,
    "ageGroup" TEXT,
    "segment" TEXT,
    "ltv" DECIMAL(18,4),
    "firstOrderDate" TIMESTAMP(3),
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "dim_users_pkey" PRIMARY KEY ("userScId")
);

-- CreateTable
CREATE TABLE "dim_date" (
    "dateId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "dayName" TEXT NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "weekOfYear" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "monthName" TEXT NOT NULL,
    "quarter" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "isWeekend" BOOLEAN NOT NULL,
    "isHoliday" BOOLEAN NOT NULL,
    "fiscalYear" INTEGER,
    "fiscalPeriod" INTEGER,

    CONSTRAINT "dim_date_pkey" PRIMARY KEY ("dateId")
);

-- CreateTable
CREATE TABLE "dim_marketing" (
    "id" BIGSERIAL NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,
    "channelGroup" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dim_marketing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_locations" (
    "id" SERIAL NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "region" TEXT,

    CONSTRAINT "dim_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingest_offsets" (
    "id" BIGSERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "partition" INTEGER NOT NULL DEFAULT 0,
    "lastOffset" BIGINT,
    "lastTimestamp" TIMESTAMP(3),
    "payloadHash" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingest_offsets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staging_raw_events" (
    "id" BIGSERIAL NOT NULL,
    "eventType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "headers" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "staging_raw_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agg_daily_stats" (
    "dateId" INTEGER NOT NULL,
    "totalRevenue" DECIMAL(18,2) NOT NULL,
    "totalOrders" INTEGER NOT NULL,
    "totalVisits" INTEGER NOT NULL,
    "conversionRate" DECIMAL(5,4),
    "aov" DECIMAL(10,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agg_daily_stats_pkey" PRIMARY KEY ("dateId")
);

-- CreateTable
CREATE TABLE "agg_product_performance" (
    "dateId" INTEGER NOT NULL,
    "productId" BIGINT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "cartAdds" INTEGER NOT NULL DEFAULT 0,
    "purchases" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "returns" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "agg_product_performance_pkey" PRIMARY KEY ("dateId","productId")
);

-- CreateIndex
CREATE UNIQUE INDEX "fact_orders_orderId_key" ON "fact_orders"("orderId");

-- CreateIndex
CREATE INDEX "fact_orders_orderTs_idx" ON "fact_orders"("orderTs");

-- CreateIndex
CREATE INDEX "fact_orders_userId_idx" ON "fact_orders"("userId");

-- CreateIndex
CREATE INDEX "fact_orders_status_idx" ON "fact_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fact_order_items_orderItemId_key" ON "fact_order_items"("orderItemId");

-- CreateIndex
CREATE INDEX "fact_order_items_orderTs_idx" ON "fact_order_items"("orderTs");

-- CreateIndex
CREATE INDEX "fact_order_items_productId_idx" ON "fact_order_items"("productId");

-- CreateIndex
CREATE INDEX "fact_order_items_orderId_idx" ON "fact_order_items"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "fact_payments_paymentId_key" ON "fact_payments"("paymentId");

-- CreateIndex
CREATE INDEX "fact_payments_timestamp_idx" ON "fact_payments"("timestamp");

-- CreateIndex
CREATE INDEX "fact_payments_status_idx" ON "fact_payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "fact_shipments_shipmentId_key" ON "fact_shipments"("shipmentId");

-- CreateIndex
CREATE INDEX "fact_shipments_carrier_idx" ON "fact_shipments"("carrier");

-- CreateIndex
CREATE UNIQUE INDEX "fact_sessions_sessionId_key" ON "fact_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "fact_sessions_startTime_idx" ON "fact_sessions"("startTime");

-- CreateIndex
CREATE INDEX "fact_sessions_userId_idx" ON "fact_sessions"("userId");

-- CreateIndex
CREATE INDEX "fact_pageviews_timestamp_idx" ON "fact_pageviews"("timestamp");

-- CreateIndex
CREATE INDEX "fact_pageviews_sessionId_idx" ON "fact_pageviews"("sessionId");

-- CreateIndex
CREATE INDEX "fact_searches_query_idx" ON "fact_searches"("query");

-- CreateIndex
CREATE INDEX "fact_cart_activity_timestamp_idx" ON "fact_cart_activity"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "fact_reviews_reviewId_key" ON "fact_reviews"("reviewId");

-- CreateIndex
CREATE INDEX "fact_reviews_productId_idx" ON "fact_reviews"("productId");

-- CreateIndex
CREATE INDEX "fact_reviews_rating_idx" ON "fact_reviews"("rating");

-- CreateIndex
CREATE INDEX "dim_products_productId_idx" ON "dim_products"("productId");

-- CreateIndex
CREATE INDEX "dim_products_isCurrent_idx" ON "dim_products"("isCurrent");

-- CreateIndex
CREATE INDEX "dim_users_userId_idx" ON "dim_users"("userId");

-- CreateIndex
CREATE INDEX "dim_users_email_idx" ON "dim_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "dim_date_date_key" ON "dim_date"("date");

-- CreateIndex
CREATE UNIQUE INDEX "dim_marketing_utmSource_utmMedium_utmCampaign_utmTerm_utmCo_key" ON "dim_marketing"("utmSource", "utmMedium", "utmCampaign", "utmTerm", "utmContent");

-- CreateIndex
CREATE UNIQUE INDEX "dim_locations_country_state_city_postalCode_key" ON "dim_locations"("country", "state", "city", "postalCode");

-- CreateIndex
CREATE UNIQUE INDEX "ingest_offsets_source_key" ON "ingest_offsets"("source");

-- CreateIndex
CREATE INDEX "staging_raw_events_receivedAt_idx" ON "staging_raw_events"("receivedAt");

-- CreateIndex
CREATE INDEX "staging_raw_events_status_idx" ON "staging_raw_events"("status");
