import { useState, type FormEvent } from 'react';
import type { FlightSearchParams } from '../types/flight';
import { getMinDate, isValidIataCode, formatDateForApi } from '../utils/formatters';
import { AirlineFilter } from './AirlineFilter';
import { DateRangeToggle } from './DateRangeToggle';

interface SearchFormProps {
  onSearch: (params: FlightSearchParams) => void;
  isLoading?: boolean;
}

// Helper function to get tomorrow's date
const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateForApi(tomorrow);
};

// Helper function to get one week from tomorrow
const getOneWeekFromTomorrow = (): string => {
  const oneWeek = new Date();
  oneWeek.setDate(oneWeek.getDate() + 8); // +1 for tomorrow, +7 for one week
  return formatDateForApi(oneWeek);
};

export function SearchForm({ onSearch, isLoading = false }: SearchFormProps) {
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('round-trip');
  const [origin, setOrigin] = useState('SFO');
  const [destination, setDestination] = useState('CDG');
  const [departureDate, setDepartureDate] = useState(getTomorrowDate());
  const [returnDate, setReturnDate] = useState(getOneWeekFromTomorrow());
  const [adults, setAdults] = useState(1);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [dateRangeEnabled, setDateRangeEnabled] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!origin || !isValidIataCode(origin)) {
      newErrors.origin = 'Please enter a valid 3-letter airport code (e.g., LAX)';
    }

    if (!destination || !isValidIataCode(destination)) {
      newErrors.destination = 'Please enter a valid 3-letter airport code (e.g., JFK)';
    }

    if (origin && destination && origin.toUpperCase() === destination.toUpperCase()) {
      newErrors.destination = 'Origin and destination must be different';
    }

    if (!departureDate) {
      newErrors.departureDate = 'Please select a departure date';
    } else if (departureDate < getMinDate()) {
      newErrors.departureDate = 'Departure date cannot be in the past';
    }

    // Validate return date for round-trip
    if (tripType === 'round-trip') {
      if (!returnDate) {
        newErrors.returnDate = 'Please select a return date';
      } else if (returnDate < departureDate) {
        newErrors.returnDate = 'Return date must be after departure date';
      }
    }

    if (adults < 1 || adults > 9) {
      newErrors.adults = 'Number of adults must be between 1 and 9';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSearch({
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      returnDate: tripType === 'round-trip' ? returnDate : undefined,
      adults,
      travelClass: 'ECONOMY',
      airlines: selectedAirlines.length > 0 ? selectedAirlines : undefined,
      dateRange: dateRangeEnabled,
    });
  };

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Flights</h2>

      {/* Trip Type Selector */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="tripType"
              value="round-trip"
              checked={tripType === 'round-trip'}
              onChange={(e) => setTripType(e.target.value as 'round-trip')}
              className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
              disabled={isLoading}
            />
            <span className="text-sm font-medium text-gray-700">Round-trip</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="tripType"
              value="one-way"
              checked={tripType === 'one-way'}
              onChange={(e) => {
                setTripType(e.target.value as 'one-way');
                setReturnDate(''); // Clear return date when switching to one-way
              }}
              className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
              disabled={isLoading}
            />
            <span className="text-sm font-medium text-gray-700">One-way</span>
          </label>
        </div>
      </div>

      {/* Airline Filter */}
      <div className="mb-6">
        <AirlineFilter
          selectedAirlines={selectedAirlines}
          onChange={setSelectedAirlines}
          disabled={isLoading}
        />
      </div>

      {/* Date Range Toggle */}
      <div className="mb-6">
        <DateRangeToggle
          enabled={dateRangeEnabled}
          onChange={setDateRangeEnabled}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Origin */}
        <div>
          <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">
            From
          </label>
          <input
            type="text"
            id="origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value.toUpperCase())}
            placeholder="LAX"
            maxLength={3}
            className={`input-field ${errors.origin ? 'border-red-500' : ''}`}
            disabled={isLoading}
          />
          {errors.origin && <p className="mt-1 text-xs text-red-600">{errors.origin}</p>}
        </div>

        {/* Swap button */}
        <div className="hidden md:flex items-end pb-2">
          <button
            type="button"
            onClick={handleSwap}
            className="btn-secondary p-2"
            disabled={isLoading}
            title="Swap origin and destination"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* Destination */}
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
            To
          </label>
          <input
            type="text"
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value.toUpperCase())}
            placeholder="JFK"
            maxLength={3}
            className={`input-field ${errors.destination ? 'border-red-500' : ''}`}
            disabled={isLoading}
          />
          {errors.destination && (
            <p className="mt-1 text-xs text-red-600">{errors.destination}</p>
          )}
        </div>

        {/* Departure date */}
        <div>
          <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700 mb-1">
            Departure Date
          </label>
          <input
            type="date"
            id="departureDate"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            min={getMinDate()}
            className={`input-field ${errors.departureDate ? 'border-red-500' : ''}`}
            disabled={isLoading}
          />
          {errors.departureDate && (
            <p className="mt-1 text-xs text-red-600">{errors.departureDate}</p>
          )}
        </div>

        {/* Return date - only show for round-trip */}
        {tripType === 'round-trip' && (
          <div>
            <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 mb-1">
              Return Date
            </label>
            <input
              type="date"
              id="returnDate"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              min={departureDate || getMinDate()}
              className={`input-field ${errors.returnDate ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            {errors.returnDate && (
              <p className="mt-1 text-xs text-red-600">{errors.returnDate}</p>
            )}
          </div>
        )}

        {/* Adults */}
        <div>
          <label htmlFor="adults" className="block text-sm font-medium text-gray-700 mb-1">
            Passengers
          </label>
          <input
            type="number"
            id="adults"
            value={adults}
            onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
            min={1}
            max={9}
            className={`input-field ${errors.adults ? 'border-red-500' : ''}`}
            disabled={isLoading}
          />
          {errors.adults && <p className="mt-1 text-xs text-red-600">{errors.adults}</p>}
        </div>
      </div>

      <div className="mt-6">
        <button type="submit" className="btn-primary w-full md:w-auto px-8" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </span>
          ) : (
            'Search Flights'
          )}
        </button>
      </div>
    </form>
  );
}
