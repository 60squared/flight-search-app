import { useMutation } from '@tanstack/react-query';
import { searchFlights } from '../services/api';
import type { FlightSearchParams, FlightSearchResponse } from '../types/flight';

/**
 * Custom hook for flight search using React Query
 * Returns mutation state and methods for searching flights
 */
export function useFlightSearch() {
  return useMutation<FlightSearchResponse, Error, FlightSearchParams>({
    mutationFn: searchFlights,
    onSuccess: (data) => {
      console.log('Flight search successful:', data.count, 'flights found');
    },
    onError: (error) => {
      console.error('Flight search failed:', error.message);
    },
  });
}
