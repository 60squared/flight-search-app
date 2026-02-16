import axios, { AxiosError } from 'axios';
import type { FlightSearchParams, FlightSearchResponse, ApiError } from '../types/flight';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError<ApiError>) => {
    console.error('API Error:', error.response?.data || error.message);

    // Enhance error with user-friendly message
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error.message);
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    } else if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }
);

/**
 * Search for flights
 */
export async function searchFlights(params: FlightSearchParams): Promise<FlightSearchResponse> {
  const response = await apiClient.post<FlightSearchResponse>('/flights/search', params);
  return response.data;
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.get('/flights/health');
  return response.data;
}

/**
 * Get cache stats (for debugging)
 */
export async function getCacheStats(): Promise<any> {
  const response = await apiClient.get('/flights/cache/stats');
  return response.data;
}

/**
 * Clear cache (for debugging)
 */
export async function clearCache(): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post('/flights/cache/clear');
  return response.data;
}

export default apiClient;
