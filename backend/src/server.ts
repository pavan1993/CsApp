import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';

// Import routes
import customerRoutes from './routes/customers';
import analyticsRoutes from './routes/analytics';
import healthRoutes from './routes/health';
import ticketRoutes from './routes/tickets';
import usageRoutes from './routes/usage';
import configRoutes from './routes/config';
import dataRoutes from './routes/data';

// Initialize Express app
const app = express();
const PORT = process.env.NODE_ENV === 'test' ? 0 : parseInt(process.env.PORT || '3001', 10);

// Initialize database connection
export const prisma = connectDatabase();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/config', configRoutes);
app.use('/api/data', dataRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server only if not in test environment
let server: any = null;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Customer Success Analytics API`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API URL: http://localhost:${PORT}`);
  });
  
  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Please kill the process using this port or use a different port.`);
      process.exit(1);
    } else {
      console.error('❌ Server error:', error);
    }
  });
} else {
  // Create a mock server object for tests
  server = {
    close: () => {
      // Mock close function for tests
    }
  };
}

// Export app for testing
export { app, server };

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  if (server) {
    server.close();
  }
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  if (server) {
    server.close();
  }
  await prisma.$disconnect();
  process.exit(0);
});
