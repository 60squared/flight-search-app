import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createMonitoringJob, getSchedulerStatus } from '../services/monitoringApi';
import type { CreateMonitoringJobRequest } from '../types/monitoring';

interface MonitorPriceButtonProps {
  searchParams: CreateMonitoringJobRequest;
  onSuccess?: () => void;
}

export function MonitorPriceButton({ searchParams, onSuccess }: MonitorPriceButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch scheduler status to display correct interval
  const { data: schedulerStatus } = useQuery({
    queryKey: ['scheduler-status'],
    queryFn: getSchedulerStatus,
  });

  const handleCreateMonitoring = async () => {
    setIsCreating(true);
    setError(null);

    try {
      await createMonitoringJob(searchParams);
      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create monitoring job');
    } finally {
      setIsCreating(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <svg
          className="w-6 h-6 text-green-600 mx-auto mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <p className="text-sm text-green-800 font-medium">
          Price monitoring activated!
        </p>
        <p className="text-xs text-green-600 mt-1">
          We'll check prices{' '}
          {schedulerStatus?.mode === 'test'
            ? `every ${schedulerStatus.intervalMinutes} minute (testing mode)`
            : `every ${(schedulerStatus?.intervalMinutes || 360) / 60} hours`}{' '}
          and alert you to any drops
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleCreateMonitoring}
        disabled={isCreating}
        className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600
                   text-white font-medium rounded-lg hover:from-purple-700
                   hover:to-indigo-700 transition-all shadow-md hover:shadow-lg
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreating ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 mr-2"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Creating monitoring job...
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            Monitor Prices for This Route
          </span>
        )}
      </button>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>How it works:</strong> We'll automatically search for flights on this route{' '}
          {schedulerStatus?.mode === 'test'
            ? `every ${schedulerStatus.intervalMinutes} minute (testing mode)`
            : `every ${(schedulerStatus?.intervalMinutes || 360) / 60} hours`}{' '}
          and notify you when prices drop by 10% or more.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
