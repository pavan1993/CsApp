import express from 'express';
import { connectDatabase } from '../config/database';

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Check database connection
    const prisma = connectDatabase();
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Detailed health check endpoint
router.get('/detailed', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    database: 'disconnected',
  };

  try {
    // Check database connection
    const prisma = connectDatabase();
    await prisma.$queryRaw`SELECT 1`;
    healthCheck.database = 'connected';
    
    res.json(healthCheck);
  } catch (error) {
    healthCheck.status = 'unhealthy';
    res.status(503).json({
      ...healthCheck,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
