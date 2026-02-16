import { Flight, FlightSegment, AmadeusFlightOffersResponse, AmadeusFlightOffer } from '../types/flight';

/**
 * Format ISO duration (PT5H30M) to human-readable format (5h 30m)
 */
function formatDuration(isoDuration: string): string {
  const hoursMatch = isoDuration.match(/(\d+)H/);
  const minutesMatch = isoDuration.match(/(\d+)M/);

  const hours = hoursMatch ? hoursMatch[1] : '0';
  const minutes = minutesMatch ? minutesMatch[1] : '0';

  if (hours === '0') {
    return `${minutes}m`;
  }
  if (minutes === '0') {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * Normalize a single Amadeus flight offer to our Flight type
 */
function normalizeFlightOffer(
  offer: AmadeusFlightOffer,
  carriers: { [key: string]: string }
): Flight {
  // Get the first itinerary (outbound flight)
  const itinerary = offer.itineraries[0];
  const firstSegment = itinerary.segments[0];
  const lastSegment = itinerary.segments[itinerary.segments.length - 1];

  // Get carrier name and code
  const carrierCode = firstSegment.carrierCode;
  const carrierName = carriers[carrierCode] || carrierCode;

  // Calculate number of stops (segments - 1)
  const stops = itinerary.segments.length - 1;

  // Build flight number (use first segment's flight number)
  const flightNumber = `${carrierCode}${firstSegment.number}`;

  // Map segments to our FlightSegment type
  const segments: FlightSegment[] = itinerary.segments.map((seg) => ({
    departure: {
      iataCode: seg.departure.iataCode,
      terminal: seg.departure.terminal,
      at: seg.departure.at,
    },
    arrival: {
      iataCode: seg.arrival.iataCode,
      terminal: seg.arrival.terminal,
      at: seg.arrival.at,
    },
    carrierCode: seg.carrierCode,
    number: seg.number,
    duration: formatDuration(seg.duration),
  }));

  // Build the normalized flight object
  const flight: Flight = {
    id: offer.id,
    airline: carrierName,
    airlineCode: carrierCode,
    flightNumber,
    departure: {
      airport: firstSegment.departure.iataCode,
      time: firstSegment.departure.at,
      terminal: firstSegment.departure.terminal,
    },
    arrival: {
      airport: lastSegment.arrival.iataCode,
      time: lastSegment.arrival.at,
      terminal: lastSegment.arrival.terminal,
    },
    duration: formatDuration(itinerary.duration),
    stops,
    price: {
      amount: parseFloat(offer.price.grandTotal),
      currency: offer.price.currency,
    },
    segments,
    bookingSource: offer.source,
    validatingAirlines: offer.validatingAirlineCodes,
  };

  return flight;
}

/**
 * Normalize Amadeus API response to array of simplified Flight objects
 */
export function normalizeAmadeusResponse(response: AmadeusFlightOffersResponse): Flight[] {
  const { data, dictionaries } = response;

  // If no flights found, return empty array
  if (!data || data.length === 0) {
    return [];
  }

  // Map each flight offer to our normalized Flight type
  const flights = data.map((offer) => normalizeFlightOffer(offer, dictionaries.carriers));

  // Sort by price (lowest first) as default
  flights.sort((a, b) => a.price.amount - b.price.amount);

  return flights;
}

/**
 * Filter and sort flights based on criteria
 */
export function filterFlights(
  flights: Flight[],
  filters?: {
    maxPrice?: number;
    minPrice?: number;
    airlines?: string[];
    maxStops?: number;
  }
): Flight[] {
  let filtered = [...flights];

  if (filters) {
    const { maxPrice, minPrice, airlines, maxStops } = filters;

    if (minPrice !== undefined) {
      filtered = filtered.filter((f) => f.price.amount >= minPrice);
    }

    if (maxPrice !== undefined) {
      filtered = filtered.filter((f) => f.price.amount <= maxPrice);
    }

    if (airlines && airlines.length > 0) {
      filtered = filtered.filter((f) => airlines.includes(f.airlineCode));
    }

    if (maxStops !== undefined) {
      filtered = filtered.filter((f) => f.stops <= maxStops);
    }
  }

  return filtered;
}

/**
 * Sort flights based on criteria
 */
export function sortFlights(
  flights: Flight[],
  sortBy: 'price' | 'duration' | 'departure' = 'price'
): Flight[] {
  const sorted = [...flights];

  switch (sortBy) {
    case 'price':
      sorted.sort((a, b) => a.price.amount - b.price.amount);
      break;
    case 'duration': {
      // Convert duration strings to minutes for comparison
      const durationToMinutes = (duration: string): number => {
        const hoursMatch = duration.match(/(\d+)h/);
        const minutesMatch = duration.match(/(\d+)m/);
        const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
        const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
        return hours * 60 + minutes;
      };
      sorted.sort((a, b) => durationToMinutes(a.duration) - durationToMinutes(b.duration));
      break;
    }
    case 'departure':
      sorted.sort((a, b) => new Date(a.departure.time).getTime() - new Date(b.departure.time).getTime());
      break;
    default:
      break;
  }

  return sorted;
}
