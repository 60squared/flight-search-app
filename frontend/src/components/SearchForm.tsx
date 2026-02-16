import { useState, useEffect, type FormEvent } from 'react';
import type { FlightSearchParams } from '../types/flight';
import { getMinDate, isValidIataCode, formatDateForApi } from '../utils/formatters';
import { AirlineFilter } from './AirlineFilter';
import { DateRangeToggle } from './DateRangeToggle';

interface SearchFormProps {
  onSearch: (params: FlightSearchParams) => void;
  onFilterChange?: (maxStops: number) => void;
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

export function SearchForm({ onSearch, onFilterChange, isLoading = false }: SearchFormProps) {
  // Load saved settings from localStorage or use defaults
  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem('flightSearchSettings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading saved settings:', error);
    }
    return null;
  };

  const savedSettings = loadSavedSettings();

  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>(savedSettings?.tripType || 'round-trip');
  const [origin, setOrigin] = useState(savedSettings?.origin || 'SFO');
  const [destination, setDestination] = useState(savedSettings?.destination || 'CDG');
  const [departureDate, setDepartureDate] = useState(savedSettings?.departureDate || getTomorrowDate());
  const [returnDate, setReturnDate] = useState(savedSettings?.returnDate || getOneWeekFromTomorrow());
  const [adults, setAdults] = useState(savedSettings?.adults || 1);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>(savedSettings?.airlines || []);
  const [dateRangeEnabled, setDateRangeEnabled] = useState(savedSettings?.dateRange || false);
  const [maxStops, setMaxStops] = useState<number>(savedSettings?.maxStops ?? 0); // Default to non-stop
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settings = {
      tripType,
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      airlines: selectedAirlines,
      dateRange: dateRangeEnabled,
      maxStops,
    };
    localStorage.setItem('flightSearchSettings', JSON.stringify(settings));
  }, [tripType, origin, destination, departureDate, returnDate, adults, selectedAirlines, dateRangeEnabled, maxStops]);

  // Notify parent of filter changes
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(maxStops);
    }
  }, [maxStops, onFilterChange]);

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

      {/* Stops Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Number of Stops</label>
        <div className="flex items-center space-x-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="stops"
              value="0"
              checked={maxStops === 0}
              onChange={() => setMaxStops(0)}
              className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
              disabled={isLoading}
            />
            <span className="text-sm font-medium text-gray-700">Non-stop</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="stops"
              value="1"
              checked={maxStops === 1}
              onChange={() => setMaxStops(1)}
              className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
              disabled={isLoading}
            />
            <span className="text-sm font-medium text-gray-700">1 Stop</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="stops"
              value="99"
              checked={maxStops === 99}
              onChange={() => setMaxStops(99)}
              className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
              disabled={isLoading}
            />
            <span className="text-sm font-medium text-gray-700">1+ Stops</span>
          </label>
        </div>
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
