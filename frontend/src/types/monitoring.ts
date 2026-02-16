/**
 * Monitoring types for frontend
 */

export interface MonitoringJob {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  travelClass: string;
  airlines?: string[];
  isActive: boolean;
  checkIntervalHours: number;
  lastCheckedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceHistoryEntry {
  id: string;
  monitoringJobId: string;
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

export interface PriceAlert {
  id: string;
  monitoringJobId: string;
  alertType: string;
  oldPrice: number;
  newPrice: number;
  percentageChange: number;
  flightDetails: string;
  isRead: boolean;
  createdAt: string;
}

export interface PriceTrendPoint {
  date: string;
  lowestPrice: number;
  averagePrice: number;
  highestPrice: number;
  flightCount: number;
}

export interface CreateMonitoringJobRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  travelClass: string;
  airlines?: string[];
}

export interface MonitoringJobWithHistory extends MonitoringJob {
  priceHistory: PriceHistoryEntry[];
  priceAlerts: PriceAlert[];
}
