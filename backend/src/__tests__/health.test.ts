import request from 'supertest';
import { app, server } from '../server';

describe('Health Check Endpoints', () => {
  afterAll((done) => {
    server.close(done);
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('version');
    });

    it('should have correct response structure', async () => {
      const response = await request(app).get('/api/health');
      
      expect(typeof response.body.status).toBe('string');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.uptime).toBe('number');
      expect(typeof response.body.database).toBe('string');
    });
  });

  describe('GET /api/health/detailed', () => {
    it('should return detailed health information', async () => {
      const response = await request(app).get('/api/health/detailed');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('database');
    });

    it('should include memory usage information', async () => {
      const response = await request(app).get('/api/health/detailed');
      
      expect(response.body.memory).toHaveProperty('rss');
      expect(response.body.memory).toHaveProperty('heapTotal');
      expect(response.body.memory).toHaveProperty('heapUsed');
      expect(response.body.memory).toHaveProperty('external');
    });
  });
});
