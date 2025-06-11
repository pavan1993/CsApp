import request from 'supertest';
import { app, server } from '../server';

describe('Server', () => {
  afterAll((done) => {
    server.close(done);
  });

  describe('Server startup', () => {
    it('should start the server successfully', () => {
      expect(server.listening).toBe(true);
    });

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
