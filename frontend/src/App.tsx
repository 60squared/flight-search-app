import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchForm } from './components/SearchForm';
import { FlightList } from './components/FlightList';
import { LoadingState } from './components/LoadingState';
import { MonitorPriceButton } from './components/MonitorPriceButton';
import { PriceMonitoringDashboard } from './components/PriceMonitoringDashboard';
import { useFlightSearch } from './hooks/useFlightSearch';
import type { FlightSearchParams } from './types/flight';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
    },
  },
});

function FlightSearchApp() {
  const [activeTab, setActiveTab] = useState<'search' | 'monitoring'>('search');
  const [lastSearchParams, setLastSearchParams] = useState<FlightSearchParams | null>(null);
  const [maxStops, setMaxStops] = useState<number>(0); // Default to non-stop
  const { mutate: searchFlights, data, isPending, isError, error } = useFlightSearch();

  const handleSearch = (params: FlightSearchParams) => {
    searchFlights(params);
    setLastSearchParams(params);
  };

  const handleFilterChange = (stops: number) => {
    setMaxStops(stops);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-primary-600">Flight Search & Price Monitor</h1>
          <p className="text-sm text-gray-600 mt-1">
            Find flights and track prices for your favorite routes
          </p>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'search'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Search Flights
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'monitoring'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Price Monitoring
            </button>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main>
        {activeTab === 'search' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Search form */}
            <SearchForm onSearch={handleSearch} onFilterChange={handleFilterChange} isLoading={isPending} />

            {/* Results section */}
            <div className="mt-8">
              {isPending && <LoadingState />}

              {isError && (
                <div className="card bg-red-50 border border-red-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-6 w-6 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Search Failed</h3>
                      <p className="mt-1 text-sm text-red-700">{error?.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {data && !isPending && (
                <div>
                  {/* Monitor Price Button - Moved to top */}
                  {lastSearchParams && data.data.length > 0 && (
                    <div className="mb-6 card">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Track Prices for This Route
                      </h3>
                      <MonitorPriceButton
                        searchParams={{
                          origin: lastSearchParams.origin,
                          destination: lastSearchParams.destination,
                          departureDate: lastSearchParams.departureDate,
                          returnDate: lastSearchParams.returnDate,
                          adults: lastSearchParams.adults,
                          travelClass: lastSearchParams.travelClass || 'ECONOMY',
                          airlines: lastSearchParams.airlines,
                        }}
                        onSuccess={() => setActiveTab('monitoring')}
                      />
                    </div>
                  )}

                  {data.cached && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Cached results:</span> These results were
                        retrieved from cache for faster performance.
                      </p>
                    </div>
                  )}
                  <FlightList flights={data.data} maxStops={maxStops} />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && <PriceMonitoringDashboard />}
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Powered by Amadeus API • Flight search demo application
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FlightSearchApp />
    </QueryClientProvider>
  );
}

export default App;
