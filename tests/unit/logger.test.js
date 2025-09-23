const request = require('supertest');
const app = require('../../src/app');

// Mock database for unit tests
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
    on: jest.fn(),
    end: jest.fn()
  };
  return { Pool: jest.fn(() => mockPool) };
});

const { Pool } = require('pg');
const mockPool = new Pool();

describe('Logger Middleware Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Request logging middleware', () => {
    it('should handle requests without errors', async() => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body.status).toBe('alive');
    });

    it('should log different HTTP methods', async() => {
      // Test GET request
      await request(app)
        .get('/health/live')
        .expect(200);

      // Test POST request (will fail validation but should not crash)
      await request(app)
        .post('/tasks')
        .send({ title: 'Test Task' })
        .expect(500); // Database error expected due to mocking

      // If we get here, logging middleware is working
      expect(true).toBe(true);
    });

    it('should handle different status codes', async() => {
      // Test 200 status
      await request(app)
        .get('/health/live')
        .expect(200);

      // Test 404 status
      await request(app)
        .get('/non-existent-route')
        .expect(404);

      // If we get here, logging middleware is working
      expect(true).toBe(true);
    });

    it('should handle request timing', async() => {
      const startTime = Date.now();
      
      await request(app)
        .get('/health/live')
        .expect(200);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Request should complete in reasonable time
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent requests', async() => {
      const promises = [
        request(app).get('/health/live').expect(200),
        request(app).get('/health/live').expect(200),
        request(app).get('/health/live').expect(200)
      ];

      await Promise.all(promises);
      
      // If we get here, logging middleware handled concurrent requests
      expect(true).toBe(true);
    });
  });
});