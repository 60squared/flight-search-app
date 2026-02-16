import * as cron from 'node-cron';
import monitoringService from './monitoringService';
import amadeusService from './amadeusService';
import { normalizeAmadeusResponse } from '../utils/responseNormalizer';

// Scheduler mode: 'test' for 1 minute, 'production' for 6 hours
// Defaults to production (6 hours), set SCHEDULER_MODE=test for testing
const SCHEDULER_MODE: 'test' | 'production' = process.env.SCHEDULER_MODE === 'test' ? 'test' : 'production';

const SCHEDULER_CONFIG = {
  test: {
    cron: '*/1 * * * *',  // Every 1 minute
    intervalMinutes: 1,
    description: 'Every 1 minute (testing mode)',
  },
  production: {
    cron: '0 */6 * * *',  // Every 6 hours
    intervalMinutes: 360,
    description: 'Every 6 hours (00:00, 06:00, 12:00, 18:00)',
  },
};

/**
 * Scheduler service for running price monitoring checks
 * Mode: test (1 min) or production (6 hours)
 */
class SchedulerService {
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning = false;
  private mode: 'test' | 'production' = SCHEDULER_MODE;

  /**
   * Delay utility for throttling between job checks
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.cronJob) {
      console.log('Scheduler already running');
      return;
    }

    const config = SCHEDULER_CONFIG[this.mode];
    this.cronJob = cron.schedule(config.cron, async () => {
      console.log('⏰ Scheduled price monitoring check triggered');
      await this.runPriceChecks();
    });

    console.log(`✅ Scheduler started - ${config.description}`);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log('Scheduler stopped');
    }
  }

  /**
   * Run price checks for all active monitoring jobs
   */
  async runPriceChecks() {
    if (this.isRunning) {
      console.log('Price check already in progress, skipping...');
      return;
    }

    this.isRunning = true;

    try {
      const activeJobs = await monitoringService.getActiveJobs();

      if (activeJobs.length === 0) {
        console.log('No active monitoring jobs to check');
        return;
      }

      console.log(`Starting price checks for ${activeJobs.length} active job(s)...`);

      let successCount = 0;
      let errorCount = 0;

      for (const job of activeJobs) {
        try {
          console.log(
            `Checking job ${job.id}: ${job.origin} → ${job.destination} on ${job.departureDate}`
          );

          // Parse airlines if present
          const airlines = job.airlines ? JSON.parse(job.airlines as string) : undefined;

          // Search flights
          const response = await amadeusService.searchFlights({
            origin: job.origin,
            destination: job.destination,
            departureDate: job.departureDate,
            returnDate: job.returnDate || undefined,
            adults: job.adults,
            travelClass: job.travelClass as 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST',
            airlines,
          });

          const flights = normalizeAmadeusResponse(response);

          // Record prices
          await monitoringService.recordPriceSnapshot(job.id, flights);

          // Check for price drops
          await monitoringService.checkForPriceDrops(job.id);

          // Update last checked time
          await monitoringService.updateJobLastChecked(job.id);

          console.log(`✓ Job ${job.id} checked successfully (${flights.length} flights found)`);
          successCount++;

          // Add 2-second delay between jobs to avoid rate limits
          await this.delay(2000);
        } catch (error) {
          console.error(`✗ Failed to check job ${job.id}:`, error);
          errorCount++;

          // Continue with other jobs even if one fails
          continue;
        }
      }

      console.log(
        `Price check completed: ${successCount} succeeded, ${errorCount} failed out of ${activeJobs.length} total`
      );
    } catch (error) {
      console.error('Error during scheduled price checks:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manually trigger price checks (for testing)
   */
  async triggerManualCheck() {
    console.log('Manual price check triggered');
    await this.runPriceChecks();
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    const config = SCHEDULER_CONFIG[this.mode];
    return {
      isScheduled: this.cronJob !== null,
      isRunning: this.isRunning,
      mode: this.mode,
      schedule: config.description,
      intervalMinutes: config.intervalMinutes,
    };
  }

  /**
   * Change scheduler mode and restart
   */
  setMode(newMode: 'test' | 'production') {
    if (newMode === this.mode) {
      console.log(`Scheduler already in ${newMode} mode`);
      return;
    }

    console.log(`Changing scheduler mode from ${this.mode} to ${newMode}`);
    this.mode = newMode;

    // Restart scheduler with new mode
    if (this.cronJob) {
      this.stop();
      this.start();
    }

    console.log(`✅ Scheduler mode changed to ${newMode}`);
  }

  /**
   * Get current mode
   */
  getMode() {
    return this.mode;
  }
}

// Export singleton instance
export default new SchedulerService();
