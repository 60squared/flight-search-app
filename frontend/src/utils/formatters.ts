import { format, parseISO } from 'date-fns';

/**
 * Format ISO datetime string to readable time (e.g., "2:30 PM")
 */
export function formatTime(isoString: string): string {
  try {
    return format(parseISO(isoString), 'h:mm a');
  } catch {
    return isoString;
  }
}

/**
 * Format ISO datetime string to readable date (e.g., "Mar 15, 2026")
 */
export function formatDate(isoString: string): string {
  try {
    return format(parseISO(isoString), 'MMM d, yyyy');
  } catch {
    return isoString;
  }
}

/**
 * Format ISO datetime string to full datetime (e.g., "Mar 15, 2026 at 2:30 PM")
 */
export function formatDateTime(isoString: string): string {
  try {
    return format(parseISO(isoString), 'MMM d, yyyy \'at\' h:mm a');
  } catch {
    return isoString;
  }
}

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format number of stops
 */
export function formatStops(stops: number): string {
  if (stops === 0) return 'Nonstop';
  if (stops === 1) return '1 stop';
  return `${stops} stops`;
}

/**
 * Validate IATA airport code (3 letters)
 */
export function isValidIataCode(code: string): boolean {
  return /^[A-Z]{3}$/.test(code.toUpperCase());
}

/**
 * Format date for API (YYYY-MM-DD)
 */
export function formatDateForApi(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get minimum date (today)
 */
export function getMinDate(): string {
  return formatDateForApi(new Date());
}

/**
 * Parse duration string to minutes
 */
export function durationToMinutes(duration: string): number {
  const hoursMatch = duration.match(/(\d+)h/);
  const minutesMatch = duration.match(/(\d+)m/);
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  return hours * 60 + minutes;
}
