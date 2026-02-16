import { useState, useMemo } from 'react';
import type { Flight, SortOption } from '../types/flight';
import { FlightCard } from './FlightCard';
import { durationToMinutes } from '../utils/formatters';

interface FlightListProps {
  flights: Flight[];
}

export function FlightList({ flights }: FlightListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('price');

  // Sort flights based on selected option
  const sortedFlights = useMemo(() => {
    const sorted = [...flights];

    switch (sortBy) {
      case 'price':
        sorted.sort((a, b) => a.price.amount - b.price.amount);
        break;
      case 'duration':
        sorted.sort(
          (a, b) => durationToMinutes(a.duration) - durationToMinutes(b.duration)
        );
        break;
      case 'departure':
        sorted.sort(
          (a, b) =>
            new Date(a.departure.time).getTime() -
            new Date(b.departure.time).getTime()
        );
        break;
    }

    return sorted;
  }, [flights, sortBy]);

  if (flights.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No flights found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your search criteria
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Sort controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">
          Showing {sortedFlights.length} flight{sortedFlights.length !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="sort" className="text-sm text-gray-600">
            Sort by:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="input-field py-1"
          >
            <option value="price">Price (Low to High)</option>
            <option value="duration">Duration (Shortest)</option>
            <option value="departure">Departure Time</option>
          </select>
        </div>
      </div>

      {/* Flight cards */}
      <div className="space-y-4">
        {sortedFlights.map((flight) => (
          <FlightCard key={flight.id} flight={flight} />
        ))}
      </div>
    </div>
  );
}
