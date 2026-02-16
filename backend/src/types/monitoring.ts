/**
 * Request to create a monitoring job
 */
export interface CreateMonitoringJobRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  travelClass?: string;
  airlines?: string[];
}

/**
 * Monitoring job response with history and alerts
 */
export interface MonitoringJobResponse {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string | null;
  adults: number;
  travelClass: string;
  airlines?: string[] | null;
  isActive: boolean;
  lastCheckedAt?: string | null;
  createdAt: string;
  priceHistory?: PriceHistoryEntry[];
  priceAlerts?: PriceAlertEntry[];
}

/**
 * Price history entry
 */
export interface PriceHistoryEntry {
  id: string;
  flightId: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
  recordedAt: string;
  bookingDate: string;
  travelDate: string;
}

/**
 * Price alert entry
 */
export interface PriceAlertEntry {
  id: string;
  alertType: string;
  oldPrice: number;
  newPrice: number;
  percentageChange: number;
  flightDetails: string | object;
  isRead: boolean;
  createdAt: string;
}

/**
 * Price trend data point
 */
export interface PriceTrendPoint {
  date: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  sampleSize: number;
}
