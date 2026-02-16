import { Router } from 'express';
import flightController from '../controllers/flightController';
import { validateFlightSearch } from '../middleware/validator';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * POST /api/flights/search
 * Search for flights with validation and rate limiting
 */
router.post('/search', rateLimiter, validateFlightSearch, (req, res, next) => {
  flightController.search(req, res, next);
});

/**
 * GET /api/flights/health
 * Health check endpoint
 */
router.get('/health', (req, res, next) => {
  flightController.health(req, res, next);
});

/**
 * POST /api/flights/cache/clear
 * Clear the cache (useful for development/testing)
 */
router.post('/cache/clear', (req, res) => {
  flightController.clearCache(req, res);
});

/**
 * GET /api/flights/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', (req, res) => {
  flightController.getCacheStats(req, res);
});

export default router;
