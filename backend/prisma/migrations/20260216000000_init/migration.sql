-- CreateTable
CREATE TABLE "MonitoringJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureDate" TEXT NOT NULL,
    "returnDate" TEXT,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "travelClass" TEXT NOT NULL DEFAULT 'ECONOMY',
    "airlines" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "checkIntervalHours" INTEGER NOT NULL DEFAULT 6,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoringJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "monitoringJobId" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "airlineCode" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "arrivalTime" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "stops" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingDate" TEXT NOT NULL,
    "travelDate" TEXT NOT NULL,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceAlert" (
    "id" TEXT NOT NULL,
    "monitoringJobId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "oldPrice" DOUBLE PRECISION NOT NULL,
    "newPrice" DOUBLE PRECISION NOT NULL,
    "percentageChange" DOUBLE PRECISION NOT NULL,
    "flightDetails" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonitoringJob_isActive_lastCheckedAt_idx" ON "MonitoringJob"("isActive", "lastCheckedAt");

-- CreateIndex
CREATE INDEX "MonitoringJob_origin_destination_departureDate_idx" ON "MonitoringJob"("origin", "destination", "departureDate");

-- CreateIndex
CREATE INDEX "PriceHistory_monitoringJobId_recordedAt_idx" ON "PriceHistory"("monitoringJobId", "recordedAt");

-- CreateIndex
CREATE INDEX "PriceHistory_travelDate_airlineCode_idx" ON "PriceHistory"("travelDate", "airlineCode");

-- CreateIndex
CREATE INDEX "PriceAlert_monitoringJobId_isRead_idx" ON "PriceAlert"("monitoringJobId", "isRead");

-- CreateIndex
CREATE INDEX "PriceAlert_createdAt_idx" ON "PriceAlert"("createdAt");

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_monitoringJobId_fkey" FOREIGN KEY ("monitoringJobId") REFERENCES "MonitoringJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_monitoringJobId_fkey" FOREIGN KEY ("monitoringJobId") REFERENCES "MonitoringJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
