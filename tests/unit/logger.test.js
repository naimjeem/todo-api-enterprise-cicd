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
    it('should log incoming requests', async() => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await request(app)
        .get('/health/live')
        .expect(200);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('info: Incoming request')
      );

      consoleSpy.mockRestore();
    });

    it('should log request completion', async() => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await request(app)
        .get('/health/live')
        .expect(200);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('info: Request completed')
      );

      consoleSpy.mockRestore();
    });

    it('should log request duration', async() => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await request(app)
        .get('/health/live')
        .expect(200);

      const logCalls = consoleSpy.mock.calls;
      const completionLog = logCalls.find(call => 
        call[0].includes('Request completed')
      );
      
      expect(completionLog[0]).toMatch(/duration.*ms/);

      consoleSpy.mockRestore();
    });

    it('should log different HTTP methods', async() => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Test GET request
      await request(app)
        .get('/health/live')
        .expect(200);

      // Test POST request
      await request(app)
        .post('/tasks')
        .send({ title: 'Test Task' })
        .expect(400); // Will fail validation but should log

      const logCalls = consoleSpy.mock.calls;
      const incomingLogs = logCalls.filter(call => 
        call[0].includes('Incoming request')
      );

      expect(incomingLogs).toHaveLength(2);
      expect(incomingLogs[0][0]).toContain('"method":"GET"');
      expect(incomingLogs[1][0]).toContain('"method":"POST"');

      consoleSpy.mockRestore();
    });

    it('should log different status codes', async() => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Test 200 status
      await request(app)
        .get('/health/live')
        .expect(200);

      // Test 404 status
      await request(app)
        .get('/non-existent-route')
        .expect(404);

      const logCalls = consoleSpy.mock.calls;
      const completionLogs = logCalls.filter(call => 
        call[0].includes('Request completed')
      );

      expect(completionLogs).toHaveLength(2);
      expect(completionLogs[0][0]).toContain('"statusCode":200');
      expect(completionLogs[1][0]).toContain('"statusCode":404');

      consoleSpy.mockRestore();
    });

    it('should log request IP address', async() => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await request(app)
        .get('/health/live')
        .expect(200);

      const logCalls = consoleSpy.mock.calls;
      const incomingLog = logCalls.find(call => 
        call[0].includes('Incoming request')
      );

      expect(incomingLog[0]).toMatch(/ip.*127\.0\.0\.1/);

      consoleSpy.mockRestore();
    });

    it('should log request URL', async() => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await request(app)
        .get('/health/live')
        .expect(200);

      const logCalls = consoleSpy.mock.calls;
      const incomingLog = logCalls.find(call => 
        call[0].includes('Incoming request')
      );

      expect(incomingLog[0]).toContain('"url":"/health/live"');

      consoleSpy.mockRestore();
    });

    it('should log timestamp', async() => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await request(app)
        .get('/health/live')
        .expect(200);

      const logCalls = consoleSpy.mock.calls;
      const incomingLog = logCalls.find(call => 
        call[0].includes('Incoming request')
      );

      expect(incomingLog[0]).toMatch(/timestamp.*\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      consoleSpy.mockRestore();
    });
  });
});
