import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { deactivateMonitoringJob, triggerPriceCheck } from '../services/monitoringApi';
import type { MonitoringJobWithHistory, PriceTrendPoint } from '../types/monitoring';

interface MonitoringJobCardProps {
  job: MonitoringJobWithHistory;
  trends: PriceTrendPoint[];
  schedulerMode: 'test' | 'production';
  intervalMinutes: number;
  onDeactivate?: () => void;
  onRefresh?: () => void;
}

export function MonitoringJobCard({
  job,
  trends,
  schedulerMode,
  intervalMinutes,
  onDeactivate,
  onRefresh,
}: MonitoringJobCardProps) {
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to stop monitoring this route?')) {
      return;
    }

    setIsDeactivating(true);
    try {
      await deactivateMonitoringJob(job.id);
      if (onDeactivate) {
        onDeactivate();
      }
    } catch (error) {
      console.error('Failed to deactivate job:', error);
      alert('Failed to deactivate monitoring job');
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      await triggerPriceCheck(job.id);
      alert('Price check triggered! Results will appear shortly.');
      if (onRefresh) {
        setTimeout(onRefresh, 3000);
      }
    } catch (error) {
      console.error('Failed to trigger price check:', error);
      alert('Failed to trigger price check');
    } finally {
      setIsChecking(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Test mode: show time with minute granularity
    // Production mode: show date
    if (schedulerMode === 'test') {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const lastChecked = job.lastCheckedAt
    ? new Date(job.lastCheckedAt).toLocaleString()
    : 'Never';

  // Transform trends data to chart format
  // Each trend point has up to 3 flights, we'll create data points with all 3 flight prices
  const chartData = trends.map((trend) => {
    const dataPoint: any = {
      timestamp: formatDate(trend.timestamp),
    };

    // Add each flight's price as a separate data key
    trend.flights.forEach((flight, index) => {
      dataPoint[`flight${index + 1}`] = flight.price;
      dataPoint[`flight${index + 1}Label`] = `${flight.airline} ${flight.flightNumber}`;
    });

    return dataPoint;
  });

  // Get unique flight labels for the legend (from the first data point)
  const flightLabels = trends.length > 0 && trends[0].flights.length > 0
    ? trends[0].flights.map((flight, index) => ({
        key: `flight${index + 1}`,
        label: `${flight.airline} ${flight.flightNumber}`,
      }))
    : [];

  return (
    <div className="border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow bg-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            {job.origin} → {job.destination}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {new Date(job.departureDate).toLocaleDateString()}
            {job.returnDate && (
              <> - {new Date(job.returnDate).toLocaleDateString()}</>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {job.adults} adult{job.adults > 1 ? 's' : ''} • {job.travelClass}
            {job.airlines && job.airlines.length > 0 && (
              <> • Airlines: {job.airlines.join(', ')}</>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 text-xs font-semibold rounded ${
              job.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {job.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Status Info */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="bg-blue-50 rounded p-2">
          <div className="text-xs text-blue-600 mb-1">Last Checked</div>
          <div className="font-medium text-blue-900">{lastChecked}</div>
        </div>
        <div className="bg-purple-50 rounded p-2">
          <div className="text-xs text-purple-600 mb-1">Check Interval</div>
          <div className="font-medium text-purple-900">
            {schedulerMode === 'test'
              ? `Every ${intervalMinutes} min (testing)`
              : `Every ${intervalMinutes / 60} hours`}
          </div>
        </div>
      </div>

      {/* Price Chart */}
      {trends.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700">Price Trends</h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 10 }}
                stroke="#6b7280"
                angle={-45}
                textAnchor="end"
                height={60}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                formatter={(value: number | undefined) =>
                  value !== undefined ? `$${value.toFixed(2)}` : 'N/A'
                }
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              {flightLabels.map((flight, index) => (
                <Line
                  key={flight.key}
                  type="monotone"
                  dataKey={flight.key}
                  stroke={
                    index === 0 ? '#10b981' : index === 1 ? '#3b82f6' : '#f59e0b'
                  }
                  strokeWidth={2}
                  name={flight.label}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {trends.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4 text-sm text-yellow-800">
          No price data yet. The first check will run automatically within{' '}
          {schedulerMode === 'test' ? `${intervalMinutes} minute` : `${intervalMinutes / 60} hours`}
          , or you can trigger a manual check.
        </div>
      )}

      {/* Alerts */}
      {job.priceAlerts && job.priceAlerts.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Alerts</h4>
          <div className="space-y-2">
            {job.priceAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="text-xs bg-green-50 border border-green-200 rounded p-2"
              >
                <span className="font-semibold text-green-700">
                  {Math.abs(alert.percentageChange).toFixed(1)}% price drop
                </span>
                <span className="text-gray-600 ml-2">
                  ${alert.oldPrice} → ${alert.newPrice}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price History Details */}
      {showDetails && job.priceHistory && job.priceHistory.length > 0 && (
        <div className="mb-4 max-h-96 overflow-y-auto">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Price History</h4>
          <div className="space-y-2">
            {job.priceHistory.slice(0, 20).map((entry) => {
              const depTime = new Date(entry.departureTime);
              const arrTime = new Date(entry.arrivalTime);

              return (
                <div
                  key={entry.id}
                  className="text-xs bg-gray-50 rounded p-3 border border-gray-200"
                >
                  {/* Header: Recorded date and price */}
                  <div className="flex justify-between items-start mb-2 pb-2 border-b border-gray-200">
                    <div>
                      <div className="font-semibold text-gray-700">
                        Recorded: {new Date(entry.recordedAt).toLocaleString()}
                      </div>
                      <div className="text-gray-500 mt-0.5">
                        Travel Date: {new Date(entry.travelDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-700">${entry.price}</div>
                      <div className="text-gray-500">{entry.currency}</div>
                    </div>
                  </div>

                  {/* Flight Details */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-blue-700">
                        {entry.airline} ({entry.airlineCode}) {entry.flightNumber}
                      </span>
                      <span className="text-gray-600">
                        {entry.stops === 0 ? 'Non-stop' : `${entry.stops} stop${entry.stops > 1 ? 's' : ''}`}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-gray-700">
                      <span className="font-medium">{entry.departureTime.split('T')[0].slice(5)}</span>
                      <span>{depTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>→</span>
                      <span>{arrTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-gray-500">({entry.duration})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={handleManualCheck}
          disabled={isChecking || !job.isActive}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium
                     rounded hover:bg-blue-700 transition-colors disabled:opacity-50
                     disabled:cursor-not-allowed"
        >
          {isChecking ? 'Checking...' : 'Check Now'}
        </button>
        <button
          onClick={handleDeactivate}
          disabled={isDeactivating || !job.isActive}
          className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm font-medium
                     rounded hover:bg-gray-300 transition-colors disabled:opacity-50
                     disabled:cursor-not-allowed"
        >
          {isDeactivating ? 'Stopping...' : 'Stop Monitoring'}
        </button>
      </div>
    </div>
  );
}
