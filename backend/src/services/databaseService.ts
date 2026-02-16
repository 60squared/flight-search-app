import { PrismaClient } from '@prisma/client';

/**
 * Database service - Singleton wrapper around Prisma Client
 * Provides centralized database access with health checking
 */
class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }

  /**
   * Get the Prisma Client instance
   * @returns PrismaClient
   */
  getClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Check if database connection is healthy
   * @returns Promise<boolean>
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Disconnect from database
   * Should be called on graceful shutdown
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    console.log('Database connection closed');
  }
}

// Export singleton instance
export default new DatabaseService();
