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

describe('Health Check Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return healthy status when database is connected', async() => {
      mockPool.query.mockResolvedValue({ rows: [{ health_check: 1 }] });

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services.database).toBe('connected');
      expect(response.body.services.api).toBe('running');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(response.body.memory).toBeDefined();
    });

    it('should return unhealthy status when database is disconnected', async() => {
      mockPool.query.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/health')
        .expect(503);

      expect(response.body.status).toBe('unhealthy');
      expect(response.body.services.database).toBe('disconnected');
      expect(response.body.services.api).toBe('running');
      expect(response.body.error).toBe('Database connection failed');
    });
  });

  describe('GET /health/ready', () => {
    it('should return ready status when database is ready', async() => {
      mockPool.query.mockResolvedValue({ rows: [{ ready_check: 1 }] });

      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body.status).toBe('ready');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return not ready status when database is not ready', async() => {
      mockPool.query.mockRejectedValue(new Error('Database not ready'));

      const response = await request(app)
        .get('/health/ready')
        .expect(503);

      expect(response.body.status).toBe('not ready');
      expect(response.body.reason).toBe('Database connection failed');
    });
  });

  describe('GET /health/live', () => {
    it('should return alive status', async() => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body.status).toBe('alive');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });
});

