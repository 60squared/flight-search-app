import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import flightRoutes from './routes/flights';
import monitoringRoutes from './routes/monitoring';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import databaseService from './services/databaseService';
import schedulerService from './services/schedulerService';

// Load environment variables - explicitly specify path
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Verify credentials are loaded
console.log('Environment check:', {
  hasApiKey: !!process.env.AMADEUS_API_KEY,
  hasApiSecret: !!process.env.AMADEUS_API_SECRET,
  apiKeyPrefix: process.env.AMADEUS_API_KEY?.substring(0, 8) || 'NOT SET',
  baseUrl: process.env.AMADEUS_BASE_URL,
});

// Create Express application
const app: Application = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (simple)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/flights', flightRoutes);
app.use('/api/monitoring', monitoringRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize database connection
(async () => {
  const dbHealthy = await databaseService.healthCheck();
  if (dbHealthy) {
    console.log('✅ Database connected successfully');

    // Start the price monitoring scheduler
    schedulerService.start();
  } else {
    console.error('❌ Database connection failed');
  }
})();

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Flight Search API Server`);
  console.log('='.repeat(50));
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Flight search: http://localhost:${PORT}/api/flights/search`);
  console.log(`CORS enabled for: ${FRONTEND_URL}`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  schedulerService.stop();
  await databaseService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  schedulerService.stop();
  await databaseService.disconnect();
  process.exit(0);
});

export default app;
