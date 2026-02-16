import { useRef } from 'react';
import type { Flight } from '../types/flight';
import { formatTime, formatPrice } from '../utils/formatters';

interface FlightCardProps {
  flight: Flight;
}

export function FlightCard({ flight }: FlightCardProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  // Check if this is a round-trip by seeing if we return to origin
  const originCode = flight.segments[0]?.departure.iataCode;
  const finalArrivalCode = flight.segments[flight.segments.length - 1]?.arrival.iataCode;
  const isRoundTrip = flight.segments.length > 1 && finalArrivalCode === originCode;

  // Split segments into outbound and return for round-trip flights
  let outboundSegments = flight.segments;
  let returnSegments: typeof flight.segments = [];

  if (isRoundTrip) {
    // Use the flight's destination (flight.arrival.airport) to split segments
    // This is reliable because we set it to the actual destination (e.g., CDG) in the backend
    const destination = flight.arrival.airport;

    // Find the last segment that arrives at the destination - that's the end of outbound
    let splitIndex = -1;
    for (let i = 0; i < flight.segments.length; i++) {
      if (flight.segments[i].arrival.iataCode === destination) {
        splitIndex = i + 1; // Split AFTER this segment
        break;
      }
    }

    // If we couldn't find the destination in arrivals, use midpoint as fallback
    if (splitIndex === -1) {
      splitIndex = Math.ceil(flight.segments.length / 2);
    }

    outboundSegments = flight.segments.slice(0, splitIndex);
    returnSegments = flight.segments.slice(splitIndex);

    console.log('Round-trip detected:', {
      origin: originCode,
      destination: flight.arrival.airport,
      finalArrival: finalArrivalCode,
      totalSegments: flight.segments.length,
      splitIndex,
      outboundCount: outboundSegments.length,
      returnCount: returnSegments.length,
      outbound: outboundSegments.map(s => `${s.departure.iataCode}->${s.arrival.iataCode}`),
      return: returnSegments.map(s => `${s.departure.iataCode}->${s.arrival.iataCode}`)
    });
  }

  return (
    <div className="card">
      <div className="flex justify-between items-start gap-6">
        {/* Left side - Flight details */}
        <div className="flex-1 space-y-3">
          {/* Airline and flight number */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-gray-900">{flight.airline}</span>
            <span className="text-xs text-gray-500">{flight.flightNumber}</span>
            {isRoundTrip && <span className="text-xs text-blue-600 font-medium">Round-trip</span>}
          </div>

          {/* Outbound Flight route */}
          <div>
            {isRoundTrip && <div className="text-xs font-medium text-gray-600 mb-1">Outbound</div>}
            <div className="flex items-center space-x-4">
              {/* Departure */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatTime(outboundSegments[0].departure.at)}
                </div>
                <div className="text-sm font-medium text-gray-600">{outboundSegments[0].departure.iataCode}</div>
                {outboundSegments[0].departure.terminal && (
                  <div className="text-xs text-gray-500">Terminal {outboundSegments[0].departure.terminal}</div>
                )}
              </div>

              {/* Duration and stops */}
              <div className="flex-1 flex flex-col items-center px-4">
                <div className="text-xs text-gray-500 mb-1">{isRoundTrip ? '→' : flight.duration}</div>
                <div className="w-full border-t-2 border-gray-300 relative">
                  {outboundSegments.length > 1 && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {outboundSegments.length === 1 ? 'Non-stop' : `${outboundSegments.length - 1} stop${outboundSegments.length > 2 ? 's' : ''}`}
                </div>
              </div>

              {/* Arrival */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {formatTime(outboundSegments[outboundSegments.length - 1].arrival.at)}
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {outboundSegments[outboundSegments.length - 1].arrival.iataCode}
                </div>
                {outboundSegments[outboundSegments.length - 1].arrival.terminal && (
                  <div className="text-xs text-gray-500">
                    Terminal {outboundSegments[outboundSegments.length - 1].arrival.terminal}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Return Flight route (if round-trip) */}
          {isRoundTrip && returnSegments.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs font-medium text-gray-600 mb-1">Return</div>
              <div className="flex items-center space-x-4">
                {/* Departure */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatTime(returnSegments[0].departure.at)}
                  </div>
                  <div className="text-sm font-medium text-gray-600">{returnSegments[0].departure.iataCode}</div>
                  {returnSegments[0].departure.terminal && (
                    <div className="text-xs text-gray-500">Terminal {returnSegments[0].departure.terminal}</div>
                  )}
                </div>

                {/* Duration and stops */}
                <div className="flex-1 flex flex-col items-center px-4">
                  <div className="text-xs text-gray-500 mb-1">←</div>
                  <div className="w-full border-t-2 border-gray-300 relative">
                    {returnSegments.length > 1 && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {returnSegments.length === 1 ? 'Non-stop' : `${returnSegments.length - 1} stop${returnSegments.length > 2 ? 's' : ''}`}
                  </div>
                </div>

                {/* Arrival */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatTime(returnSegments[returnSegments.length - 1].arrival.at)}
                  </div>
                  <div className="text-sm font-medium text-gray-600">
                    {returnSegments[returnSegments.length - 1].arrival.iataCode}
                  </div>
                  {returnSegments[returnSegments.length - 1].arrival.terminal && (
                    <div className="text-xs text-gray-500">
                      Terminal {returnSegments[returnSegments.length - 1].arrival.terminal}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Price and select button */}
        <div className="flex flex-col items-end space-y-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">
              {formatPrice(flight.price.amount, flight.price.currency)}
            </div>
            <div className="text-xs text-gray-500">per person</div>
          </div>
          <button
            onClick={() => {
              if (detailsRef.current) {
                detailsRef.current.open = true;
                detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }}
            className="btn-primary px-6"
          >
            Select
          </button>
        </div>
      </div>

      {/* Expandable details - always shown */}
      <details ref={detailsRef} className="mt-4 pt-4 border-t border-gray-200">
        <summary className="cursor-pointer text-sm text-primary-600 hover:text-primary-700 font-medium">
          View flight details
        </summary>

        {/* Flight segments */}
        {flight.segments.length > 0 && (
          <div className="mt-3 space-y-4">
            {/* Outbound segments */}
            {isRoundTrip && <div className="text-sm font-semibold text-gray-800">Outbound Journey</div>}
            <div className="space-y-3">
              {outboundSegments.map((segment, index) => (
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

            {/* Return segments */}
            {isRoundTrip && returnSegments.length > 0 && (
              <>
                <div className="text-sm font-semibold text-gray-800 pt-2">Return Journey</div>
                <div className="space-y-3">
                  {returnSegments.map((segment, index) => (
                    <div key={`return-${index}`} className="text-sm text-gray-600 pl-4">
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
              </>
            )}
          </div>
        )}

        {/* Booking Information */}
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
      </details>
    </div>
  );
}
