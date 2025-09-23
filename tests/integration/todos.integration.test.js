const request = require('supertest');
const { Pool } = require('pg');
const app = require('../../src/app');

describe('Todo API Integration Tests', () => {
  let pool;
  let testDb;

  beforeAll(async() => {
    // Create a test database connection
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/todo_test_db'
    });

    // Create test database if it doesn't exist
    try {
      await pool.query('CREATE DATABASE todo_test_db');
    } catch (error) {
      // Database might already exist, ignore error
    }

    testDb = new Pool({
      connectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/todo_test_db'
    });

    // Create tables
    await testDb.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        due_date TIMESTAMP WITH TIME ZONE,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Mock the database pool in the app
    app.use((req, res, next) => {
      req.db = testDb;
      next();
    });
  });

  afterAll(async() => {
    await testDb.end();
    await pool.end();
  });

  beforeEach(async() => {
    // Clean up test data before each test
    await testDb.query('DELETE FROM tasks');
  });

  describe('Full CRUD Operations', () => {
    it('should perform complete CRUD operations on tasks', async() => {
      // Create a task
      const newTask = {
        title: 'Integration Test Task',
        description: 'This is a test task for integration testing',
        priority: 'high',
        completed: false
      };

      const createResponse = await request(app)
        .post('/tasks')
        .send(newTask)
        .expect(201);

      const taskId = createResponse.body.task.id;
      expect(createResponse.body.task.title).toBe(newTask.title);
      expect(createResponse.body.task.priority).toBe(newTask.priority);

      // Read the task
      const getResponse = await request(app)
        .get(`/tasks/${taskId}`)
        .expect(200);

      expect(getResponse.body.task.id).toBe(taskId);
      expect(getResponse.body.task.title).toBe(newTask.title);

      // Update the task
      const updateData = {
        title: 'Updated Integration Test Task',
        completed: true
      };

      const updateResponse = await request(app)
        .put(`/tasks/${taskId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.task.title).toBe(updateData.title);
      expect(updateResponse.body.task.completed).toBe(updateData.completed);

      // Mark as complete using PATCH
      const completeResponse = await request(app)
        .patch(`/tasks/${taskId}/complete`)
        .send({ completed: false })
        .expect(200);

      expect(completeResponse.body.task.completed).toBe(false);

      // Delete the task
      await request(app)
        .delete(`/tasks/${taskId}`)
        .expect(204);

      // Verify task is deleted
      await request(app)
        .get(`/tasks/${taskId}`)
        .expect(404);
    });
  });

  describe('Pagination and Filtering', () => {
    beforeEach(async() => {
      // Insert test data
      const tasks = [
        { title: 'High Priority Task', priority: 'high', completed: false },
        { title: 'Medium Priority Task', priority: 'medium', completed: true },
        { title: 'Low Priority Task', priority: 'low', completed: false },
        { title: 'Another High Priority Task', priority: 'high', completed: true },
        { title: 'Completed Task', priority: 'medium', completed: true }
      ];

      for (const task of tasks) {
        await testDb.query(
          'INSERT INTO tasks (title, priority, completed) VALUES ($1, $2, $3)',
          [task.title, task.priority, task.completed]
        );
      }
    });

    it('should return paginated results', async() => {
      const response = await request(app)
        .get('/tasks?page=1&limit=2')
        .expect(200);

      expect(response.body.tasks).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.total).toBe(5);
      expect(response.body.pagination.pages).toBe(3);
    });

    it('should filter by priority', async() => {
      const response = await request(app)
        .get('/tasks?priority=high')
        .expect(200);

      expect(response.body.tasks).toHaveLength(2);
      response.body.tasks.forEach(task => {
        expect(task.priority).toBe('high');
      });
    });

    it('should filter by completion status', async() => {
      const response = await request(app)
        .get('/tasks?completed=true')
        .expect(200);

      expect(response.body.tasks).toHaveLength(3);
      response.body.tasks.forEach(task => {
        expect(task.completed).toBe(true);
      });
    });

    it('should search tasks by title', async() => {
      const response = await request(app)
        .get('/tasks?search=High')
        .expect(200);

      expect(response.body.tasks).toHaveLength(2);
      response.body.tasks.forEach(task => {
        expect(task.title.toLowerCase()).toContain('high');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async() => {
      // Temporarily break the database connection
      const originalQuery = testDb.query;
      testDb.query = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/tasks')
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');

      // Restore the original query method
      testDb.query = originalQuery;
    });

    it('should handle invalid JSON in request body', async() => {
      await request(app)
        .post('/tasks')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should handle SQL injection attempts', async() => {
      const maliciousTask = {
        title: '\'; DROP TABLE tasks; --',
        description: 'Malicious input'
      };

      await request(app)
        .post('/tasks')
        .send(maliciousTask)
        .expect(201); // Should be handled safely by parameterized queries

      // Verify the table still exists
      const result = await testDb.query('SELECT COUNT(*) FROM tasks');
      expect(result.rows[0].count).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple concurrent requests', async() => {
      const requests = [];
      const numRequests = 10;

      for (let i = 0; i < numRequests; i++) {
        requests.push(
          request(app)
            .get('/tasks')
            .expect(200)
        );
      }

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should respond within acceptable time limits', async() => {
      const startTime = Date.now();

      await request(app)
        .get('/tasks')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});
