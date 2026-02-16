import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMonitoringJobs,
  getMonitoringJobById,
  getAlerts,
  getPriceTrends,
  getSchedulerStatus,
  setSchedulerMode,
} from '../services/monitoringApi';
import { MonitoringJobCard } from './MonitoringJobCard';
import { PriceAlertCard } from './PriceAlertCard';
import type { MonitoringJobWithHistory, PriceTrendPoint } from '../types/monitoring';

export function PriceMonitoringDashboard() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'jobs' | 'alerts'>('jobs');
  const [jobsWithDetails, setJobsWithDetails] = useState<
    Array<{ job: MonitoringJobWithHistory; trends: PriceTrendPoint[] }>
  >([]);

  // Fetch all monitoring jobs
  const {
    data: jobs,
    isLoading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ['monitoring-jobs'],
    queryFn: getMonitoringJobs,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch all alerts
  const {
    data: alerts,
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
  } = useQuery({
    queryKey: ['monitoring-alerts'],
    queryFn: () => getAlerts(false),
    refetchInterval: 30000,
  });

  // Fetch scheduler status
  const { data: schedulerStatus } = useQuery({
    queryKey: ['scheduler-status'],
    queryFn: getSchedulerStatus,
    refetchInterval: 60000, // Refetch every minute
  });

  // Mutation for changing scheduler mode
  const { mutate: changeSchedulerMode, isPending: isChangingMode } = useMutation({
    mutationFn: setSchedulerMode,
    onSuccess: () => {
      // Invalidate and refetch scheduler status
      queryClient.invalidateQueries({ queryKey: ['scheduler-status'] });
    },
    onError: (error) => {
      console.error('Failed to change scheduler mode:', error);
      alert('Failed to change scheduler mode. Please try again.');
    },
  });

  // Fetch detailed data for each job
  useEffect(() => {
    if (!jobs || jobs.length === 0) {
      setJobsWithDetails([]);
      return;
    }

    const fetchJobDetails = async () => {
      const detailsPromises = jobs.map(async (job) => {
        try {
          const [jobWithHistory, trends] = await Promise.all([
            getMonitoringJobById(job.id),
            getPriceTrends(job.id),
          ]);
          return { job: jobWithHistory, trends };
        } catch (error) {
          console.error(`Failed to fetch details for job ${job.id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(detailsPromises);
      setJobsWithDetails(results.filter((r) => r !== null) as typeof jobsWithDetails);
    };

    fetchJobDetails();
  }, [jobs]);

  const handleRefresh = () => {
    refetchJobs();
    refetchAlerts();
  };

  const unreadAlerts = alerts?.filter((a) => !a.isRead) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Price Monitoring</h1>
            <p className="text-gray-600 mt-2">
              Monitor flight prices and get alerts when prices drop
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Scheduler Mode Toggle */}
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Scheduler Mode
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => changeSchedulerMode('test')}
                  disabled={isChangingMode || schedulerStatus?.mode === 'test'}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    schedulerStatus?.mode === 'test'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${isChangingMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Test (1 min)
                </button>
                <button
                  onClick={() => changeSchedulerMode('production')}
                  disabled={isChangingMode || schedulerStatus?.mode === 'production'}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    schedulerStatus?.mode === 'production'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${isChangingMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Production (6 hrs)
                </button>
              </div>
            </div>
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200
                         transition-colors text-sm font-medium"
            >
              <svg
                className="w-4 h-4 inline-block mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setSelectedTab('jobs')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            selectedTab === 'jobs'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Monitoring Jobs ({jobs?.length || 0})
        </button>
        <button
          onClick={() => setSelectedTab('alerts')}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            selectedTab === 'alerts'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Alerts ({alerts?.length || 0})
          {unreadAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadAlerts.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {selectedTab === 'jobs' && (
        <div>
          {jobsLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-gray-600 mt-2">Loading monitoring jobs...</p>
            </div>
          )}

          {jobsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-700">Failed to load monitoring jobs</p>
              <p className="text-sm text-red-600 mt-1">
                {jobsError instanceof Error ? jobsError.message : 'Unknown error'}
              </p>
            </div>
          )}

          {!jobsLoading && !jobsError && jobsWithDetails.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No monitoring jobs yet
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Search for flights and click "Monitor Prices" to start tracking price changes
                for your routes
              </p>
            </div>
          )}

          {!jobsLoading && !jobsError && jobsWithDetails.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {jobsWithDetails.map(({ job, trends }) => (
                <MonitoringJobCard
                  key={job.id}
                  job={job}
                  trends={trends}
                  schedulerMode={schedulerStatus?.mode || 'test'}
                  intervalMinutes={schedulerStatus?.intervalMinutes || 1}
                  onDeactivate={handleRefresh}
                  onDelete={handleRefresh}
                  onRefresh={handleRefresh}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'alerts' && (
        <div>
          {alertsLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-gray-600 mt-2">Loading alerts...</p>
            </div>
          )}

          {alertsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-700">Failed to load alerts</p>
              <p className="text-sm text-red-600 mt-1">
                {alertsError instanceof Error ? alertsError.message : 'Unknown error'}
              </p>
            </div>
          )}

          {!alertsLoading && !alertsError && (!alerts || alerts.length === 0) && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No alerts yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                When prices drop by 10% or more on your monitored routes, you'll see alerts here
              </p>
            </div>
          )}

          {!alertsLoading && !alertsError && alerts && alerts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.map((alert) => (
                <PriceAlertCard
                  key={alert.id}
                  alert={alert}
                  onMarkRead={refetchAlerts}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
