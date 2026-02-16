/**
 * API client for monitoring endpoints
 */

import type {
  MonitoringJob,
  MonitoringJobWithHistory,
  PriceAlert,
  PriceTrendPoint,
  CreateMonitoringJobRequest,
} from '../types/monitoring';

// Use base URL without /api since endpoints include /api/monitoring
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace('/api', '');

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { message: string };
}

/**
 * Create a new monitoring job
 */
export async function createMonitoringJob(
  request: CreateMonitoringJobRequest
): Promise<MonitoringJob> {
  const response = await fetch(`${API_BASE_URL}/api/monitoring/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to create monitoring job: ${response.statusText}`);
  }

  const result: ApiResponse<MonitoringJob> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to create monitoring job');
  }

  return result.data;
}

/**
 * Get all monitoring jobs
 */
export async function getMonitoringJobs(): Promise<MonitoringJob[]> {
  const response = await fetch(`${API_BASE_URL}/api/monitoring/jobs`);

  if (!response.ok) {
    throw new Error(`Failed to fetch monitoring jobs: ${response.statusText}`);
  }

  const result: ApiResponse<MonitoringJob[]> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to fetch monitoring jobs');
  }

  return result.data;
}

/**
 * Get a specific monitoring job by ID with history
 */
export async function getMonitoringJobById(
  jobId: string
): Promise<MonitoringJobWithHistory> {
  const response = await fetch(`${API_BASE_URL}/api/monitoring/jobs/${jobId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch monitoring job: ${response.statusText}`);
  }

  const result: ApiResponse<MonitoringJobWithHistory> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to fetch monitoring job');
  }

  return result.data;
}

/**
 * Deactivate a monitoring job
 */
export async function deactivateMonitoringJob(jobId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/monitoring/jobs/${jobId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to deactivate monitoring job: ${response.statusText}`);
  }

  const result: ApiResponse<void> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to deactivate monitoring job');
  }
}

/**
 * Get all alerts (optionally filter by unread)
 */
export async function getAlerts(unreadOnly: boolean = false): Promise<PriceAlert[]> {
  const url = new URL(`${API_BASE_URL}/api/monitoring/alerts`);
  if (unreadOnly) {
    url.searchParams.append('unread', 'true');
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch alerts: ${response.statusText}`);
  }

  const result: ApiResponse<PriceAlert[]> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to fetch alerts');
  }

  return result.data;
}

/**
 * Mark an alert as read
 */
export async function markAlertAsRead(alertId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/monitoring/alerts/${alertId}/read`, {
    method: 'PATCH',
  });

  if (!response.ok) {
    throw new Error(`Failed to mark alert as read: ${response.statusText}`);
  }

  const result: ApiResponse<void> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to mark alert as read');
  }
}

/**
 * Get price trends for a monitoring job
 */
export async function getPriceTrends(jobId: string): Promise<PriceTrendPoint[]> {
  const response = await fetch(`${API_BASE_URL}/api/monitoring/jobs/${jobId}/trends`);

  if (!response.ok) {
    throw new Error(`Failed to fetch price trends: ${response.statusText}`);
  }

  const result: ApiResponse<PriceTrendPoint[]> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to fetch price trends');
  }

  return result.data;
}

/**
 * Manually trigger a price check for a job (for testing)
 */
export async function triggerPriceCheck(jobId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/monitoring/jobs/${jobId}/check`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to trigger price check: ${response.statusText}`);
  }

  const result: ApiResponse<void> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to trigger price check');
  }
}

/**
 * Get scheduler configuration and status
 */
export async function getSchedulerStatus(): Promise<{
  isScheduled: boolean;
  isRunning: boolean;
  mode: 'test' | 'production';
  schedule: string;
  intervalMinutes: number;
}> {
  const response = await fetch(`${API_BASE_URL}/api/monitoring/scheduler/status`);

  if (!response.ok) {
    throw new Error(`Failed to fetch scheduler status: ${response.statusText}`);
  }

  const result: ApiResponse<{
    isScheduled: boolean;
    isRunning: boolean;
    mode: 'test' | 'production';
    schedule: string;
    intervalMinutes: number;
  }> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to fetch scheduler status');
  }

  return result.data;
}
