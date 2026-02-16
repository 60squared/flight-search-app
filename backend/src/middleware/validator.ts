import { Request, Response, NextFunction } from 'express';

/**
 * Validate flight search request body
 */
export function validateFlightSearch(req: Request, res: Response, next: NextFunction): void {
  const { origin, destination, departureDate, adults, travelClass } = req.body;

  // Validate origin
  if (!origin || typeof origin !== 'string' || origin.length !== 3) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Origin must be a valid 3-letter IATA airport code',
        field: 'origin',
      },
    });
    return;
  }

  // Validate destination
  if (!destination || typeof destination !== 'string' || destination.length !== 3) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Destination must be a valid 3-letter IATA airport code',
        field: 'destination',
      },
    });
    return;
  }

  // Validate that origin and destination are different
  if (origin.toUpperCase() === destination.toUpperCase()) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Origin and destination must be different',
      },
    });
    return;
  }

  // Validate departure date
  if (!departureDate || typeof departureDate !== 'string') {
    res.status(400).json({
      success: false,
      error: {
        message: 'Departure date is required in YYYY-MM-DD format',
        field: 'departureDate',
      },
    });
    return;
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(departureDate)) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Departure date must be in YYYY-MM-DD format',
        field: 'departureDate',
      },
    });
    return;
  }

  // Validate that date is not in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const depDate = new Date(departureDate);

  if (depDate < today) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Departure date cannot be in the past',
        field: 'departureDate',
      },
    });
    return;
  }

  // Validate adults
  if (!adults || typeof adults !== 'number' || adults < 1 || adults > 9) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Number of adults must be between 1 and 9',
        field: 'adults',
      },
    });
    return;
  }

  // Validate travel class (optional)
  if (travelClass) {
    const validClasses = ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'];
    if (!validClasses.includes(travelClass)) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Travel class must be one of: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST',
          field: 'travelClass',
        },
      });
      return;
    }
  }

  // Validate airlines (optional)
  if (req.body.airlines !== undefined) {
    if (!Array.isArray(req.body.airlines)) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Airlines must be an array of airline codes',
          field: 'airlines',
        },
      });
      return;
    }

    // Validate each airline code is 2 characters
    const invalidAirlines = req.body.airlines.filter(
      (code: any) => typeof code !== 'string' || code.length !== 2
    );

    if (invalidAirlines.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Each airline code must be a 2-letter code (e.g., AF, KL, UA)',
          field: 'airlines',
        },
      });
      return;
    }
  }

  // Validate dateRange (optional)
  if (req.body.dateRange !== undefined && typeof req.body.dateRange !== 'boolean') {
    res.status(400).json({
      success: false,
      error: {
        message: 'dateRange must be a boolean value',
        field: 'dateRange',
      },
    });
    return;
  }

  // All validations passed
  next();
}
