import { Request, Response, NextFunction } from 'express';
import monitoringService from '../services/monitoringService';
import amadeusService from '../services/amadeusService';
import schedulerService from '../services/schedulerService';
import { normalizeAmadeusResponse } from '../utils/responseNormalizer';

export class MonitoringController {
  /**
   * Create a new monitoring job
   * POST /api/monitoring/create
   */
  async createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { origin, destination, departureDate, returnDate, adults, travelClass, airlines } =
        req.body;

      const job = await monitoringService.createMonitoringJob({
        origin,
        destination,
        departureDate,
        returnDate,
        adults,
        travelClass,
        airlines,
      });

      // Send response immediately
      res.status(201).json({
        success: true,
        data: job,
        message: 'Price monitoring activated. We will check prices every 6 hours.',
      });

      // Perform initial search and record prices asynchronously (don't wait)
      setImmediate(async () => {
        try {
          console.log(`Performing initial price check for job ${job.id}...`);
          const response = await amadeusService.searchFlights({
            origin,
            destination,
            departureDate,
            returnDate,
            adults,
            travelClass,
            airlines,
          });

          const flights = normalizeAmadeusResponse(response);
          await monitoringService.recordPriceSnapshot(job.id, flights);

          console.log(`✓ Initial price snapshot recorded for job ${job.id} (${flights.length} flights)`);
        } catch (error) {
          console.error(`✗ Failed to record initial price snapshot for job ${job.id}:`, error);
          // Don't fail - the scheduled job will pick it up
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all monitoring jobs
   * GET /api/monitoring/jobs
   */
  async getJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isActive = req.query.active === 'true' ? true : req.query.active === 'false' ? false : undefined;

      const jobs = await monitoringService.getAllJobs({ isActive });

      // Parse airlines from JSON strings
      const formattedJobs = jobs.map((job) => ({
        ...job,
        airlines: job.airlines ? JSON.parse(job.airlines as string) : null,
      }));

      res.json({
        success: true,
        data: formattedJobs,
        count: formattedJobs.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific monitoring job by ID
   * GET /api/monitoring/jobs/:id
   */
  async getJobById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const job = await monitoringService.getJobById(id as string);

      if (!job) {
        res.status(404).json({
          success: false,
          error: { message: 'Monitoring job not found' },
        });
        return;
      }

      // Parse airlines from JSON string
      const formattedJob = {
        ...job,
        airlines: job.airlines ? JSON.parse(job.airlines as string) : null,
      };

      res.json({
        success: true,
        data: formattedJob,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate a monitoring job
   * DELETE /api/monitoring/jobs/:id
   */
  async deactivateJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await monitoringService.deactivateJob(id as string);

      res.json({
        success: true,
        message: 'Monitoring job deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all alerts
   * GET /api/monitoring/alerts
   */
  async getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isRead = req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined;
      const jobId = req.query.jobId as string | undefined;

      const alerts = await monitoringService.getAlerts({ isRead, jobId });

      // Parse flight details from JSON strings
      const formattedAlerts = alerts.map((alert) => ({
        ...alert,
        flightDetails:
          typeof alert.flightDetails === 'string'
            ? JSON.parse(alert.flightDetails)
            : alert.flightDetails,
      }));

      res.json({
        success: true,
        data: formattedAlerts,
        count: formattedAlerts.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark an alert as read
   * PATCH /api/monitoring/alerts/:id/read
   */
  async markAlertRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      await monitoringService.markAlertAsRead(id as string);

      res.json({
        success: true,
        message: 'Alert marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get price trends for a monitoring job
   * GET /api/monitoring/jobs/:id/trends
   */
  async getPriceTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const trends = await monitoringService.getPriceTrends(id as string);

      res.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manually trigger a price check for a job (admin/testing)
   * POST /api/monitoring/jobs/:id/check
   */
  async triggerCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const job = await monitoringService.getJobById(id as string);

      if (!job) {
        res.status(404).json({
          success: false,
          error: { message: 'Monitoring job not found' },
        });
        return;
      }

      // Search flights
      const airlines = job.airlines ? JSON.parse(job.airlines as string) : undefined;
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

      res.json({
        success: true,
        message: 'Price check completed',
        data: {
          flightsFound: flights.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get scheduler configuration and status
   * GET /api/monitoring/scheduler/status
   */
  getSchedulerStatus(req: Request, res: Response, next: NextFunction): void {
    try {
      const status = schedulerService.getStatus();
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change scheduler mode (test/production)
   * POST /api/monitoring/scheduler/mode
   */
  async setSchedulerMode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { mode } = req.body;

      if (mode !== 'test' && mode !== 'production') {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid mode. Must be "test" or "production"' },
        });
        return;
      }

      schedulerService.setMode(mode);
      const status = schedulerService.getStatus();

      res.json({
        success: true,
        data: status,
        message: `Scheduler mode changed to ${mode}`,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export default new MonitoringController();
