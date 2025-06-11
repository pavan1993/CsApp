import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from '../middleware/errorHandler';
import healthRoutes from '../routes/health';

// Create test app without starting server
const createTestApp = () => {
  const app = express();

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
  });

  // Middleware
  app.use(helmet());
  app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }));
  app.use(morgan('dev'));
  app.use(limiter);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/api/health', healthRoutes);

  // Error handling middleware
  app.use(errorHandler);

  // 404 handler
  app.use('*', (req: express.Request, res: express.Response) => {
    res.status(404).json({ message: 'Route not found' });
  });

  return app;
};

describe('Server', () => {
  const app = createTestApp();

  describe('Server functionality', () => {
    it('should respond to requests', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBeDefined();
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Route not found');
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app).get('/api/health');
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Security headers', () => {
    it('should include security headers from helmet', async () => {
      const response = await request(app).get('/api/health');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });
});
