import amadeusService from './amadeusService';
import { FlightSearchParams, Flight } from '../types/flight';
import { normalizeAmadeusResponse } from '../utils/responseNormalizer';

/**
 * Service for handling date range searches (±3 days)
 * Makes multiple API calls with throttling to avoid rate limits
 */
class DateRangeSearchService {
  /**
   * Delay utility for throttling API calls
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generate array of dates within range of base date
   * @param baseDate - Base date in YYYY-MM-DD format
   * @param days - Number of days before and after (e.g., 3 for ±3 days)
   * @returns Array of date strings in YYYY-MM-DD format
   */
  private generateDateRange(baseDate: string, days: number): string[] {
    const dates: string[] = [];
    const base = new Date(baseDate);

    // Generate dates from -days to +days
    for (let i = -days; i <= days; i++) {
      const date = new Date(base);
      date.setDate(date.getDate() + i);

      // Format as YYYY-MM-DD
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);
    }

    return dates;
  }

  /**
   * Search flights with date range (±1 day)
   * Makes multiple API calls with 1-second delay between each
   * @param params - Flight search parameters
   * @returns Object containing flights, errors, and search metadata
   */
  async searchWithDateRange(
    params: FlightSearchParams
  ): Promise<{
    flights: Flight[];
    errors: Array<{ date: string; error: string }>;
    totalSearches: number;
    successfulSearches: number;
  }> {
    console.log('Starting date range search (±1 day)...');

    const departureDates = this.generateDateRange(params.departureDate, 1);
    const returnDates = params.returnDate ? this.generateDateRange(params.returnDate, 1) : [undefined];

    const allFlights: Flight[] = [];
    const errors: Array<{ date: string; error: string }> = [];
    let successfulSearches = 0;

    // For one-way: search 7 departure dates
    // For round-trip: search 7 departure × 7 return = 49 combinations (!)
    const totalSearches = departureDates.length * returnDates.length;
    console.log(`Will perform ${totalSearches} searches (${departureDates.length} departure dates × ${returnDates.length} return dates)`);

    if (totalSearches > 20) {
      console.warn('⚠️  Warning: This will make many API calls. Consider reducing date range or using one-way only.');
    }

    let searchCount = 0;

    for (const depDate of departureDates) {
      for (const retDate of returnDates) {
        searchCount++;
        const searchLabel = retDate
          ? `${depDate} → ${retDate} (${searchCount}/${totalSearches})`
          : `${depDate} (${searchCount}/${totalSearches})`;

        try {
          // Add 1-second delay between API calls to avoid rate limiting
          // (except for the first call)
          if (searchCount > 1) {
            await this.delay(1000);
          }

          console.log(`Searching: ${searchLabel}`);

          const searchParams: FlightSearchParams = {
            ...params,
            departureDate: depDate,
            returnDate: retDate,
          };

          const response = await amadeusService.searchFlights(searchParams);
          const flights = normalizeAmadeusResponse(response);

          allFlights.push(...flights);
          successfulSearches++;

          console.log(`✓ Found ${flights.length} flights for ${searchLabel}`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          console.error(`✗ Failed to search ${searchLabel}: ${errorMsg}`);
          errors.push({
            date: searchLabel,
            error: errorMsg,
          });
        }
      }
    }

    // Deduplicate flights by ID
    const uniqueFlights = this.deduplicateFlights(allFlights);

    console.log(`Date range search complete:`);
    console.log(`  - Total searches: ${totalSearches}`);
    console.log(`  - Successful: ${successfulSearches}`);
    console.log(`  - Failed: ${errors.length}`);
    console.log(`  - Total flights found: ${allFlights.length}`);
    console.log(`  - Unique flights: ${uniqueFlights.length}`);

    return {
      flights: uniqueFlights,
      errors,
      totalSearches,
      successfulSearches,
    };
  }

  /**
   * Remove duplicate flights based on flight ID
   * @param flights - Array of flights potentially containing duplicates
   * @returns Array of unique flights
   */
  private deduplicateFlights(flights: Flight[]): Flight[] {
    const seen = new Set<string>();
    const unique: Flight[] = [];

    for (const flight of flights) {
      if (!seen.has(flight.id)) {
        seen.add(flight.id);
        unique.push(flight);
      }
    }

    const duplicatesRemoved = flights.length - unique.length;
    if (duplicatesRemoved > 0) {
      console.log(`Removed ${duplicatesRemoved} duplicate flights`);
    }

    return unique;
  }
}

// Export singleton instance
export default new DateRangeSearchService();
