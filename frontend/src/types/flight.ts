export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  airlines?: string[]; // Array of airline codes to filter
  dateRange?: boolean; // Enable ±3 day search
}

export interface FlightSegment {
  departure: {
    iataCode: string;
    terminal?: string;
    at: string;
  };
  arrival: {
    iataCode: string;
    terminal?: string;
    at: string;
  };
  carrierCode: string;
  number: string;
  duration: string;
}

export interface Flight {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  departure: {
    airport: string;
    time: string;
    terminal?: string;
  };
  arrival: {
    airport: string;
    time: string;
    terminal?: string;
  };
  duration: string;
  stops: number;
  price: {
    amount: number;
    currency: string;
  };
  segments: FlightSegment[];
  bookingSource?: string;
  validatingAirlines?: string[];
}

export interface FlightSearchResponse {
  success: boolean;
  data: Flight[];
  cached: boolean;
  count: number;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    field?: string;
  };
}

export type SortOption = 'price' | 'duration' | 'departure';

export interface FilterOptions {
  maxPrice?: number;
  minPrice?: number;
  airlines?: string[];
  maxStops?: number;
}
