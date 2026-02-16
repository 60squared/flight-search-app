import NodeCache from 'node-cache';
import { Flight } from '../types/flight';

class CacheService {
  private cache: NodeCache;
  private readonly defaultTTL: number;

  constructor() {
    // TTL in seconds (15 minutes = 900 seconds)
    this.defaultTTL = 900;

    this.cache = new NodeCache({
      stdTTL: this.defaultTTL,
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: true, // Clone objects to prevent mutations
    });

    console.log('Cache service initialized with TTL:', this.defaultTTL, 'seconds');
  }

  /**
   * Generate a cache key from search parameters
   */
  generateKey(params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    adults: number;
    travelClass?: string;
  }): string {
    const { origin, destination, departureDate, returnDate, adults, travelClass = 'ECONOMY' } = params;
    const returnPart = returnDate ? `:${returnDate}` : ':oneway';
    return `flight:${origin}:${destination}:${departureDate}${returnPart}:${adults}:${travelClass}`.toLowerCase();
  }

  /**
   * Get a value from the cache
   */
  get(key: string): Flight[] | undefined {
    const value = this.cache.get<Flight[]>(key);
    if (value) {
      console.log(`Cache HIT for key: ${key}`);
    } else {
      console.log(`Cache MISS for key: ${key}`);
    }
    return value;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: Flight[], ttl?: number): boolean {
    const success = this.cache.set(key, value, ttl || this.defaultTTL);
    if (success) {
      console.log(`Cache SET for key: ${key}, TTL: ${ttl || this.defaultTTL}s`);
    }
    return success;
  }

  /**
   * Delete a specific key from the cache
   */
  del(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Flush all keys from the cache
   */
  flush(): void {
    this.cache.flushAll();
    console.log('Cache flushed');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return this.cache.keys();
  }
}

// Export a singleton instance
export default new CacheService();
