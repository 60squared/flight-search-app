export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  airlines?: string[]; // Array of airline codes to filter (e.g., ['AF', 'KL', 'UA'])
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
  bookingSource?: string; // e.g., "GDS", airline code
  validatingAirlines?: string[]; // Airlines that can issue tickets
}

// Amadeus API response types
export interface AmadeusTokenResponse {
  type: string;
  username: string;
  application_name: string;
  client_id: string;
  token_type: string;
  access_token: string;
  expires_in: number;
  state: string;
}

export interface AmadeusFlightOffer {
  type: string;
  id: string;
  source: string;
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: Array<{
    duration: string;
    segments: Array<{
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
      aircraft: {
        code: string;
      };
      operating?: {
        carrierCode: string;
      };
      duration: string;
      id: string;
      numberOfStops: number;
      blacklistedInEU: boolean;
    }>;
  }>;
  price: {
    currency: string;
    total: string;
    base: string;
    fees: Array<{
      amount: string;
      type: string;
    }>;
    grandTotal: string;
  };
  pricingOptions: {
    fareType: string[];
    includedCheckedBagsOnly: boolean;
  };
  validatingAirlineCodes: string[];
  travelerPricings: Array<{
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: {
      currency: string;
      total: string;
      base: string;
    };
    fareDetailsBySegment: Array<{
      segmentId: string;
      cabin: string;
      fareBasis: string;
      class: string;
      includedCheckedBags: {
        weight?: number;
        weightUnit?: string;
      };
    }>;
  }>;
}

export interface AmadeusFlightOffersResponse {
  meta: {
    count: number;
    links?: {
      self: string;
    };
  };
  data: AmadeusFlightOffer[];
  dictionaries: {
    locations: {
      [key: string]: {
        cityCode: string;
        countryCode: string;
      };
    };
    aircraft: {
      [key: string]: string;
    };
    currencies: {
      [key: string]: string;
    };
    carriers: {
      [key: string]: string;
    };
  };
}

export interface AmadeusErrorResponse {
  errors: Array<{
    status: number;
    code: number;
    title: string;
    detail: string;
    source?: {
      parameter?: string;
      pointer?: string;
      example?: string;
    };
  }>;
}
