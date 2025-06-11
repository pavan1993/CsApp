import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { errorHandler, createError, asyncHandler } from '../middleware/errorHandler';

const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Test route that throws an error
  app.get('/test-error', (req, res, next) => {
    next(createError('Test error', 400));
  });

  // Test route with async error
  app.get('/test-async-error', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    throw new Error('Async test error');
  }));

  // Test route that works
  app.get('/test-success', (req, res) => {
    res.json({ message: 'Success' });
  });

  app.use(errorHandler);

  return app;
};

describe('Error Handling Middleware', () => {
  const app = createTestApp();

  describe('errorHandler', () => {
    it('should handle custom errors with status codes', async () => {
      const response = await request(app).get('/test-error');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Test error');
    });

    it('should handle async errors', async () => {
      const response = await request(app).get('/test-async-error');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Async test error');
    });

    it('should not affect successful requests', async () => {
      const response = await request(app).get('/test-success');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Success');
    });
  });

  describe('createError', () => {
    it('should create error with custom message and status code', () => {
      const error = createError('Custom error', 404);
      
      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('should default to status code 500', () => {
      const error = createError('Default error');
      
      expect(error.statusCode).toBe(500);
    });
  });
});
