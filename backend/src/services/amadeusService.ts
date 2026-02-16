import axios, { AxiosInstance, AxiosError } from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import {
  FlightSearchParams,
  AmadeusTokenResponse,
  AmadeusFlightOffersResponse,
  AmadeusErrorResponse,
} from '../types/flight';

// Load environment variables BEFORE the service is instantiated
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

class AmadeusService {
  private apiKey: string;
  private apiSecret: string;
  private baseURL: string;
  private accessToken: string | null;
  private tokenExpiry: number;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.apiKey = process.env.AMADEUS_API_KEY || '';
    this.apiSecret = process.env.AMADEUS_API_SECRET || '';
    this.baseURL = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';
    this.accessToken = null;
    this.tokenExpiry = 0;

    if (!this.apiKey || !this.apiSecret) {
      console.warn('WARNING: Amadeus API credentials not found in environment variables');
    }

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds
    });

    console.log('Amadeus service initialized with base URL:', this.baseURL);
  }

  /**
   * Get OAuth2 access token
   */
  private async getAccessToken(): Promise<string> {
    // If token exists and hasn't expired (with 60s buffer), return it
    const now = Date.now() / 1000;
    if (this.accessToken && this.tokenExpiry > now + 60) {
      return this.accessToken;
    }

    console.log('Fetching new Amadeus access token...');

    try {
      const response = await axios.post<AmadeusTokenResponse>(
        `${this.baseURL}/v1/security/oauth2/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.apiKey,
          client_secret: this.apiSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() / 1000 + response.data.expires_in;

      console.log('Access token obtained, expires in:', response.data.expires_in, 'seconds');

      return this.accessToken;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('Failed to obtain access token:', axiosError.response?.data || axiosError.message);
        throw new Error('Failed to authenticate with Amadeus API');
      }
      throw error;
    }
  }

  /**
   * Search for flights
   */
  async searchFlights(params: FlightSearchParams): Promise<AmadeusFlightOffersResponse> {
    const { origin, destination, departureDate, returnDate, adults, travelClass = 'ECONOMY', airlines } = params;

    // Get or refresh access token
    const token = await this.getAccessToken();

    const tripType = returnDate ? 'round-trip' : 'one-way';
    console.log(`Searching ${tripType} flights: ${origin} → ${destination} on ${departureDate}${returnDate ? ` (return: ${returnDate})` : ''}`);

    try {
      const apiParams: any = {
        originLocationCode: origin.toUpperCase(),
        destinationLocationCode: destination.toUpperCase(),
        departureDate,
        adults,
        travelClass,
        max: 50, // Limit to 50 results for performance
        currencyCode: 'USD',
        nonStop: false,
      };

      // Add return date for round-trip flights
      if (returnDate) {
        apiParams.returnDate = returnDate;
      }

      // Add airline filtering if specified
      if (airlines && airlines.length > 0) {
        apiParams.includedAirlineCodes = airlines.join(',');
        console.log('Filtering by airlines:', airlines.join(', '));
      }

      const response = await this.axiosInstance.get<AmadeusFlightOffersResponse>(
        '/v2/shopping/flight-offers',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: apiParams,
        }
      );

      console.log(`Found ${response.data.data.length} flight offers`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<AmadeusErrorResponse>;

        // Handle 401 - token might have expired, retry once
        if (axiosError.response?.status === 401) {
          console.log('Token expired, refreshing...');
          this.accessToken = null;
          this.tokenExpiry = 0;

          // Retry once with new token
          const newToken = await this.getAccessToken();
          const retryResponse = await this.axiosInstance.get<AmadeusFlightOffersResponse>(
            '/v2/shopping/flight-offers',
            {
              headers: {
                Authorization: `Bearer ${newToken}`,
              },
              params: {
                originLocationCode: origin.toUpperCase(),
                destinationLocationCode: destination.toUpperCase(),
                departureDate,
                adults,
                travelClass,
                max: 50,
                currencyCode: 'USD',
                nonStop: false,
              },
            }
          );

          return retryResponse.data;
        }

        // Handle 429 - rate limit
        if (axiosError.response?.status === 429) {
          console.error('Amadeus API rate limit exceeded');
          throw new Error('Flight search rate limit exceeded. Please try again later.');
        }

        // Handle other errors
        const errorData = axiosError.response?.data as AmadeusErrorResponse;
        if (errorData?.errors && errorData.errors.length > 0) {
          const firstError = errorData.errors[0];
          console.error('Amadeus API error:', firstError.title, '-', firstError.detail);
          throw new Error(firstError.detail || firstError.title || 'Failed to search flights');
        }

        console.error('Amadeus API request failed:', axiosError.message);
        throw new Error('Failed to search flights. Please try again.');
      }

      throw error;
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      console.error('Amadeus health check failed:', error);
      return false;
    }
  }
}

// Export a singleton instance
export default new AmadeusService();
