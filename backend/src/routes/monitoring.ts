import { Router } from 'express';
import monitoringController from '../controllers/monitoringController';

const router = Router();

/**
 * POST /api/monitoring/create
 * Create a new price monitoring job
 */
router.post('/create', monitoringController.createJob.bind(monitoringController));

/**
 * GET /api/monitoring/jobs
 * Get all monitoring jobs (with optional ?active=true/false filter)
 */
router.get('/jobs', monitoringController.getJobs.bind(monitoringController));

/**
 * GET /api/monitoring/jobs/:id
 * Get a specific monitoring job by ID with history and alerts
 */
router.get('/jobs/:id', monitoringController.getJobById.bind(monitoringController));

/**
 * DELETE /api/monitoring/jobs/:id
 * Deactivate a monitoring job
 */
router.delete('/jobs/:id', monitoringController.deactivateJob.bind(monitoringController));

/**
 * GET /api/monitoring/jobs/:id/trends
 * Get price trends for a specific job
 */
router.get('/jobs/:id/trends', monitoringController.getPriceTrends.bind(monitoringController));

/**
 * POST /api/monitoring/jobs/:id/check
 * Manually trigger a price check for a job (for testing)
 */
router.post('/jobs/:id/check', monitoringController.triggerCheck.bind(monitoringController));

/**
 * GET /api/monitoring/alerts
 * Get all alerts (with optional ?read=true/false&jobId=xxx filters)
 */
router.get('/alerts', monitoringController.getAlerts.bind(monitoringController));

/**
 * PATCH /api/monitoring/alerts/:id/read
 * Mark an alert as read
 */
router.patch('/alerts/:id/read', monitoringController.markAlertRead.bind(monitoringController));

/**
 * GET /api/monitoring/scheduler/status
 * Get scheduler configuration and status
 */
router.get('/scheduler/status', monitoringController.getSchedulerStatus.bind(monitoringController));

export default router;
