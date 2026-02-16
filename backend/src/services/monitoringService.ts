import databaseService from './databaseService';
import { FlightSearchParams, Flight } from '../types/flight';

/**
 * Service for managing price monitoring jobs and tracking price history
 */
class MonitoringService {
  private prisma = databaseService.getClient();

  /**
   * Create a new monitoring job
   */
  async createMonitoringJob(params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    travelClass?: string;
    airlines?: string[];
  }) {
    const job = await this.prisma.monitoringJob.create({
      data: {
        origin: params.origin.toUpperCase(),
        destination: params.destination.toUpperCase(),
        departureDate: params.departureDate,
        returnDate: params.returnDate,
        adults: params.adults,
        travelClass: params.travelClass || 'ECONOMY',
        airlines: params.airlines ? JSON.stringify(params.airlines) : null,
        isActive: true,
        checkIntervalHours: 6,
      },
    });

    console.log(`Created monitoring job: ${job.id} for ${job.origin} → ${job.destination}`);
    return job;
  }

  /**
   * Get all active monitoring jobs ready for checking
   */
  async getActiveJobs() {
    const jobs = await this.prisma.monitoringJob.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        lastCheckedAt: 'asc', // Check oldest first
      },
    });

    return jobs;
  }

  /**
   * Get a specific monitoring job by ID with history and alerts
   */
  async getJobById(jobId: string) {
    const job = await this.prisma.monitoringJob.findUnique({
      where: { id: jobId },
      include: {
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 100, // Last 100 price records
        },
        priceAlerts: {
          orderBy: { createdAt: 'desc' },
          take: 20, // Last 20 alerts
        },
      },
    });

    return job;
  }

  /**
   * Get all monitoring jobs (with optional filters)
   */
  async getAllJobs(options?: { isActive?: boolean }) {
    const jobs = await this.prisma.monitoringJob.findMany({
      where: options?.isActive !== undefined ? { isActive: options.isActive } : undefined,
      include: {
        priceHistory: {
          orderBy: { recordedAt: 'desc' },
          take: 10, // Last 10 price records per job
        },
        priceAlerts: {
          where: { isRead: false },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return jobs;
  }

  /**
   * Update last checked timestamp for a job
   */
  async updateJobLastChecked(jobId: string) {
    await this.prisma.monitoringJob.update({
      where: { id: jobId },
      data: { lastCheckedAt: new Date() },
    });
  }

  /**
   * Deactivate a monitoring job
   */
  async deactivateJob(jobId: string) {
    await this.prisma.monitoringJob.update({
      where: { id: jobId },
      data: { isActive: false },
    });

    console.log(`Deactivated monitoring job: ${jobId}`);
  }

  /**
   * Record price snapshot for a monitoring job
   */
  async recordPriceSnapshot(jobId: string, flights: Flight[]) {
    if (flights.length === 0) {
      console.log(`No flights to record for job ${jobId}`);
      return;
    }

    const bookingDate = new Date().toISOString().split('T')[0];

    // Record each flight's price
    const priceRecords = flights.map((flight) => ({
      monitoringJobId: jobId,
      flightId: flight.id,
      airline: flight.airline,
      airlineCode: flight.airlineCode,
      flightNumber: flight.flightNumber,
      departureTime: flight.departure.time,
      arrivalTime: flight.arrival.time,
      duration: flight.duration,
      stops: flight.stops,
      price: flight.price.amount,
      currency: flight.price.currency,
      bookingDate,
      travelDate: flight.departure.time.split('T')[0],
    }));

    await this.prisma.priceHistory.createMany({
      data: priceRecords,
    });

    console.log(`Recorded ${priceRecords.length} price records for job ${jobId}`);
  }

  /**
   * Check for price drops and create alerts
   * Alerts when price drops 10% or more from the first observed price
   */
  async checkForPriceDrops(jobId: string) {
    // Get all price history for this job
    const history = await this.prisma.priceHistory.findMany({
      where: { monitoringJobId: jobId },
      orderBy: { recordedAt: 'asc' },
    });

    if (history.length < 2) {
      // Need at least 2 data points to compare
      return;
    }

    // Group by flight ID to track individual flights
    const flightGroups = new Map<string, typeof history>();
    for (const record of history) {
      const existing = flightGroups.get(record.flightId) || [];
      existing.push(record);
      flightGroups.set(record.flightId, existing);
    }

    // Check each flight for price drops
    for (const [flightId, records] of flightGroups) {
      if (records.length < 2) continue;

      const firstPrice = records[0].price;
      const latestPrice = records[records.length - 1].price;

      // Calculate percentage change
      const percentChange = ((firstPrice - latestPrice) / firstPrice) * 100;

      // Check if price dropped 10% or more
      if (percentChange >= 10) {
        // Check if we already have an alert for this price drop
        const existingAlert = await this.prisma.priceAlert.findFirst({
          where: {
            monitoringJobId: jobId,
            oldPrice: firstPrice,
            newPrice: latestPrice,
          },
        });

        if (!existingAlert) {
          // Create new alert
          const latest = records[records.length - 1];
          await this.prisma.priceAlert.create({
            data: {
              monitoringJobId: jobId,
              alertType: 'PRICE_DROP',
              oldPrice: firstPrice,
              newPrice: latestPrice,
              percentageChange: -percentChange, // Negative for drop
              flightDetails: JSON.stringify({
                airline: latest.airline,
                flightNumber: latest.flightNumber,
                departureTime: latest.departureTime,
                arrivalTime: latest.arrivalTime,
                duration: latest.duration,
                stops: latest.stops,
              }),
              isRead: false,
            },
          });

          console.log(
            `🚨 Price drop alert created for job ${jobId}: ${firstPrice} → ${latestPrice} (${percentChange.toFixed(1)}% off)`
          );
        }
      }
    }
  }

  /**
   * Get all alerts (optionally filter by read status)
   */
  async getAlerts(options?: { isRead?: boolean; jobId?: string }) {
    const alerts = await this.prisma.priceAlert.findMany({
      where: {
        ...(options?.isRead !== undefined && { isRead: options.isRead }),
        ...(options?.jobId && { monitoringJobId: options.jobId }),
      },
      include: {
        monitoringJob: {
          select: {
            origin: true,
            destination: true,
            departureDate: true,
            returnDate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return alerts;
  }

  /**
   * Mark an alert as read
   */
  async markAlertAsRead(alertId: string) {
    await this.prisma.priceAlert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
  }

  /**
   * Get price trends for a monitoring job
   * Returns aggregated price data over time
   */
  async getPriceTrends(jobId: string) {
    const history = await this.prisma.priceHistory.findMany({
      where: { monitoringJobId: jobId },
      orderBy: { recordedAt: 'asc' },
    });

    // Group by booking date and calculate averages
    const trendMap = new Map<string, { sum: number; count: number; min: number; max: number }>();

    for (const record of history) {
      const existing = trendMap.get(record.bookingDate) || {
        sum: 0,
        count: 0,
        min: Infinity,
        max: -Infinity,
      };

      existing.sum += record.price;
      existing.count += 1;
      existing.min = Math.min(existing.min, record.price);
      existing.max = Math.max(existing.max, record.price);

      trendMap.set(record.bookingDate, existing);
    }

    // Convert to array with averages
    const trends = Array.from(trendMap.entries()).map(([date, stats]) => ({
      date,
      avgPrice: stats.sum / stats.count,
      minPrice: stats.min,
      maxPrice: stats.max,
      sampleSize: stats.count,
    }));

    return trends;
  }
}

// Export singleton instance
export default new MonitoringService();
