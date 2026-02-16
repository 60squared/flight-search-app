import { Request, Response, NextFunction } from 'express';
import amadeusService from '../services/amadeusService';
import cacheService from '../services/cacheService';
import dateRangeSearchService from '../services/dateRangeSearchService';
import { normalizeAmadeusResponse, filterFlights } from '../utils/responseNormalizer';
import { FlightSearchParams } from '../types/flight';

export class FlightController {
  /**
   * Search for flights
   * POST /api/flights/search
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const searchParams: FlightSearchParams = {
        origin: req.body.origin,
        destination: req.body.destination,
        departureDate: req.body.departureDate,
        returnDate: req.body.returnDate,
        adults: req.body.adults,
        travelClass: req.body.travelClass || 'ECONOMY',
        airlines: req.body.airlines,
        dateRange: req.body.dateRange,
      };

      console.log('Flight search request:', searchParams);
      if (searchParams.airlines && searchParams.airlines.length > 0) {
        console.log('Filtering by airlines:', searchParams.airlines.join(', '));
      }

      // Handle date range search (±1 day)
      if (searchParams.dateRange) {
        console.log('Date range search enabled - will search ±1 day from selected dates');

        const result = await dateRangeSearchService.searchWithDateRange(searchParams);

        // Apply airline filtering if specified
        let flights = result.flights;
        if (searchParams.airlines && searchParams.airlines.length > 0) {
          const beforeCount = flights.length;
          flights = filterFlights(flights, { airlines: searchParams.airlines });
          console.log(`Filtered ${beforeCount} flights to ${flights.length} matching airlines`);
        }

        // Return results with metadata
        res.json({
          success: true,
          data: flights,
          cached: false,
          count: flights.length,
          searchInfo: {
            dateRangeEnabled: true,
            totalSearches: result.totalSearches,
            successfulSearches: result.successfulSearches,
            errors: result.errors.length,
            errorDetails: result.errors.length > 0 ? result.errors : undefined,
          },
        });
        return;
      }

      // Generate cache key
      const cacheKey = cacheService.generateKey({
        origin: searchParams.origin,
        destination: searchParams.destination,
        departureDate: searchParams.departureDate,
        returnDate: searchParams.returnDate,
        adults: searchParams.adults,
        travelClass: searchParams.travelClass,
      });

      // Check cache first
      let cachedFlights = cacheService.get(cacheKey);
      if (cachedFlights) {
        // Apply airline filtering to cached results if specified
        if (searchParams.airlines && searchParams.airlines.length > 0) {
          cachedFlights = filterFlights(cachedFlights, { airlines: searchParams.airlines });
        }
        res.json({
          success: true,
          data: cachedFlights,
          cached: true,
          count: cachedFlights.length,
        });
        return;
      }

      // Cache miss - fetch from Amadeus API
      const amadeusResponse = await amadeusService.searchFlights(searchParams);

      // Normalize the response
      let flights = normalizeAmadeusResponse(amadeusResponse);

      // Apply client-side filtering if airlines are specified
      // (Amadeus API includedAirlineCodes may not work in test environment)
      if (searchParams.airlines && searchParams.airlines.length > 0) {
        const beforeCount = flights.length;
        flights = filterFlights(flights, { airlines: searchParams.airlines });
        console.log(`Filtered ${beforeCount} flights to ${flights.length} matching airlines`);
      }

      // Cache the results
      cacheService.set(cacheKey, flights);

      // Return response
      res.json({
        success: true,
        data: flights,
        cached: false,
        count: flights.length,
      });
    } catch (error) {
      // Pass error to error handling middleware
      next(error);
    }
  }

  /**
   * Health check endpoint
   * GET /api/flights/health
   */
  async health(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isHealthy = await amadeusService.healthCheck();

      if (isHealthy) {
        res.json({
          success: true,
          message: 'Flight service is healthy',
          cache: {
            keys: cacheService.keys().length,
            stats: cacheService.getStats(),
          },
        });
      } else {
        res.status(503).json({
          success: false,
          message: 'Flight service is unhealthy - Amadeus API connection failed',
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear cache
   * POST /api/flights/cache/clear
   */
  clearCache(req: Request, res: Response): void {
    cacheService.flush();
    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  }

  /**
   * Get cache stats
   * GET /api/flights/cache/stats
   */
  getCacheStats(req: Request, res: Response): void {
    const stats = cacheService.getStats();
    const keys = cacheService.keys();

    res.json({
      success: true,
      data: {
        ...stats,
        keys: keys.length,
        keyList: keys,
      },
    });
  }
}

// Export a singleton instance
export default new FlightController();
