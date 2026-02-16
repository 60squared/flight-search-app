import type { Flight } from '../types/flight';
import { formatTime, formatPrice, formatStops } from '../utils/formatters';

interface FlightCardProps {
  flight: Flight;
}

export function FlightCard({ flight }: FlightCardProps) {
  return (
    <div className="card">
      <div className="flex justify-between items-start gap-6">
        {/* Left side - Flight details */}
        <div className="flex-1 space-y-3">
          {/* Airline and flight number */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-gray-900">{flight.airline}</span>
            <span className="text-xs text-gray-500">{flight.flightNumber}</span>
          </div>

          {/* Flight route */}
          <div className="flex items-center space-x-4">
            {/* Departure */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatTime(flight.departure.time)}
              </div>
              <div className="text-sm font-medium text-gray-600">{flight.departure.airport}</div>
              {flight.departure.terminal && (
                <div className="text-xs text-gray-500">Terminal {flight.departure.terminal}</div>
              )}
            </div>

            {/* Duration and stops */}
            <div className="flex-1 flex flex-col items-center px-4">
              <div className="text-xs text-gray-500 mb-1">{flight.duration}</div>
              <div className="w-full border-t-2 border-gray-300 relative">
                {flight.stops > 0 && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-1">{formatStops(flight.stops)}</div>
            </div>

            {/* Arrival */}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatTime(flight.arrival.time)}
              </div>
              <div className="text-sm font-medium text-gray-600">{flight.arrival.airport}</div>
              {flight.arrival.terminal && (
                <div className="text-xs text-gray-500">Terminal {flight.arrival.terminal}</div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Price and select button */}
        <div className="flex flex-col items-end space-y-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">
              {formatPrice(flight.price.amount, flight.price.currency)}
            </div>
            <div className="text-xs text-gray-500">per person</div>
          </div>
          <button className="btn-primary px-6">Select</button>
        </div>
      </div>

      {/* Expandable details for segments (if multiple) */}
      {flight.stops > 0 && (
        <details className="mt-4 pt-4 border-t border-gray-200">
          <summary className="cursor-pointer text-sm text-primary-600 hover:text-primary-700 font-medium">
            View flight details
          </summary>
          <div className="mt-3 space-y-3">
            {flight.segments.map((segment, index) => (
              <div key={index} className="text-sm text-gray-600 pl-4">
                <div className="font-medium">
                  Segment {index + 1}: {segment.carrierCode}{segment.number}
                </div>
                <div className="text-xs space-y-1 mt-1">
                  <div>
                    Departs: {segment.departure.iataCode} at {formatTime(segment.departure.at)}
                    {segment.departure.terminal && ` (Terminal ${segment.departure.terminal})`}
                  </div>
                  <div>
                    Arrives: {segment.arrival.iataCode} at {formatTime(segment.arrival.at)}
                    {segment.arrival.terminal && ` (Terminal ${segment.arrival.terminal})`}
                  </div>
                  <div>Duration: {segment.duration}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Booking Information */}
          {(flight.bookingSource || flight.validatingAirlines) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-900 mb-2">Booking Information</div>
              <div className="space-y-2 text-sm text-gray-600">
                {flight.bookingSource && (
                  <div>
                    <span className="font-medium">Source:</span> {flight.bookingSource}
                  </div>
                )}
                {flight.validatingAirlines && flight.validatingAirlines.length > 0 && (
                  <div>
                    <span className="font-medium">Book with:</span>{' '}
                    {flight.validatingAirlines.join(', ')}
                  </div>
                )}
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-2">Compare prices and book:</div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://www.google.com/travel/flights`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Google Flights
                    </a>
                    <a
                      href={`https://www.kayak.com/flights/${flight.departure.airport}-${flight.arrival.airport}/${flight.departure.time.split('T')[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Kayak
                    </a>
                    <a
                      href={`https://www.skyscanner.com/transport/flights/${flight.departure.airport.toLowerCase()}/${flight.arrival.airport.toLowerCase()}/${flight.departure.time.split('T')[0].replace(/-/g, '')}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Skyscanner
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </details>
      )}
    </div>
  );
}
