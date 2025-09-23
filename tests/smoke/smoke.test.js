const request = require('supertest');
const app = require('../../src/app');

describe('Smoke Tests', () => {
  describe('Health Endpoints', () => {
    it('should return 200 OK for health check', async() => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return 200 OK for readiness check', async() => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body.status).toBeDefined();
    });

    it('should return 200 OK for liveness check', async() => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body.status).toBe('alive');
    });
  });

  describe('Tasks Endpoints', () => {
    it('should return successful response for GET /tasks', async() => {
      const response = await request(app)
        .get('/tasks')
        .expect(200);

      expect(response.body.tasks).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('should create a new task via POST /tasks', async() => {
      const newTask = {
        title: 'Smoke Test Task',
        description: 'This is a smoke test task',
        priority: 'medium',
        completed: false
      };

      const response = await request(app)
        .post('/tasks')
        .send(newTask)
        .expect(201);

      expect(response.body.task).toBeDefined();
      expect(response.body.task.title).toBe(newTask.title);
      expect(response.body.task.id).toBeDefined();
    });

    it('should handle invalid requests gracefully', async() => {
      const response = await request(app)
        .post('/tasks')
        .send({}) // Empty request body
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async() => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });

    it('should return 404 for non-existent task', async() => {
      const response = await request(app)
        .get('/tasks/999999')
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async() => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for security headers added by helmet
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('0');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting', async() => {
      // Make multiple requests to test rate limiting
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(request(app).get('/health'));
      }

      const responses = await Promise.all(requests);

      // All requests should succeed (within rate limit)
      responses.forEach(response => {
        expect(response.status).toBeLessThan(500);
      });
    });
  });
});

