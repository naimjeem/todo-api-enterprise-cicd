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

describe('Error Handler Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error handling middleware', () => {
    it('should handle ValidationError', async() => {
      const response = await request(app)
        .post('/tasks')
        .send({ title: '' }) // Empty title should trigger validation error
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should handle invalid task ID format', async() => {
      const response = await request(app)
        .get('/tasks/invalid-id')
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should handle database connection errors', async() => {
      mockPool.query.mockRejectedValue(new Error('ECONNREFUSED'));

      const response = await request(app)
        .get('/tasks')
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
    });

    it('should handle PostgreSQL unique violation', async() => {
      const error = new Error('Unique violation');
      error.code = '23505';
      mockPool.query.mockRejectedValue(error);

      const response = await request(app)
        .post('/tasks')
        .send({ title: 'Test Task' })
        .expect(409);

      expect(response.body.error).toBe('Resource already exists');
    });

    it('should handle PostgreSQL foreign key violation', async() => {
      const error = new Error('Foreign key violation');
      error.code = '23503';
      mockPool.query.mockRejectedValue(error);

      const response = await request(app)
        .post('/tasks')
        .send({ title: 'Test Task' })
        .expect(400);

      expect(response.body.error).toBe('Referenced resource does not exist');
    });

    it('should handle PostgreSQL not null violation', async() => {
      const error = new Error('Not null violation');
      error.code = '23502';
      mockPool.query.mockRejectedValue(error);

      const response = await request(app)
        .post('/tasks')
        .send({ title: 'Test Task' })
        .expect(400);

      expect(response.body.error).toBe('Required field is missing');
    });

    it('should handle PostgreSQL undefined table', async() => {
      const error = new Error('Table not found');
      error.code = '42P01';
      mockPool.query.mockRejectedValue(error);

      const response = await request(app)
        .get('/tasks')
        .expect(500);

      expect(response.body.error).toBe('Database table not found');
    });

    it('should handle custom error with statusCode', async() => {
      const error = new Error('Custom error');
      error.statusCode = 422;
      mockPool.query.mockRejectedValue(error);

      const response = await request(app)
        .get('/tasks')
        .expect(422);

      expect(response.body.error).toBe('Custom error');
    });
  });

  describe('Not Found Handler', () => {
    it('should return 404 for non-existent routes', async() => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });
});
