import { useState } from 'react';
import { markAlertAsRead } from '../services/monitoringApi';
import type { PriceAlert } from '../types/monitoring';

interface PriceAlertCardProps {
  alert: PriceAlert;
  onMarkRead?: () => void;
}

export function PriceAlertCard({ alert, onMarkRead }: PriceAlertCardProps) {
  const [isMarking, setIsMarking] = useState(false);

  const handleMarkRead = async () => {
    setIsMarking(true);
    try {
      await markAlertAsRead(alert.id);
      if (onMarkRead) {
        onMarkRead();
      }
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    } finally {
      setIsMarking(false);
    }
  };

  const flightDetails = JSON.parse(alert.flightDetails);
  const percentSavings = Math.abs(alert.percentageChange).toFixed(1);

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        alert.isRead
          ? 'bg-gray-50 border-gray-200 opacity-75'
          : 'bg-green-50 border-green-300 shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              alert.isRead ? 'bg-gray-400' : 'bg-green-500 animate-pulse'
            }`}
          />
          <span
            className={`text-xs font-semibold uppercase tracking-wide ${
              alert.isRead ? 'text-gray-500' : 'text-green-700'
            }`}
          >
            Price Drop Alert
          </span>
        </div>
        {!alert.isRead && (
          <button
            onClick={handleMarkRead}
            disabled={isMarking}
            className="text-xs text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
          >
            {isMarking ? 'Marking...' : 'Mark Read'}
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-green-600">
            {percentSavings}% OFF
          </span>
          <span className="text-sm text-gray-500">
            {new Date(alert.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-sm">
            <span className="text-gray-500 line-through">
              ${alert.oldPrice.toFixed(2)}
            </span>
          </div>
          <svg
            className="w-4 h-4 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          <div className="text-lg font-semibold text-green-700">
            ${alert.newPrice.toFixed(2)}
          </div>
        </div>

        <div className="pt-2 mt-2 border-t border-gray-200 text-xs text-gray-600 space-y-1">
          <div>
            <strong>{flightDetails.airline}</strong> - Flight {flightDetails.flightNumber}
          </div>
          <div>
            {flightDetails.origin} → {flightDetails.destination}
          </div>
          <div className="text-gray-500">
            {new Date(flightDetails.departureTime).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
