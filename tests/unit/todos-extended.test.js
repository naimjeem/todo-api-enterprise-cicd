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

describe('Todo API Extended Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /tasks - Extended scenarios', () => {
    it('should handle pagination with custom page and limit', async() => {
      const mockTasks = [
        { id: 1, title: 'Task 1' },
        { id: 2, title: 'Task 2' }
      ];
      const mockCount = [{ count: '2' }];

      mockPool.query
        .mockResolvedValueOnce({ rows: mockTasks })
        .mockResolvedValueOnce({ rows: mockCount });

      const response = await request(app)
        .get('/tasks?page=2&limit=5')
        .expect(200);

      expect(response.body.tasks).toHaveLength(2);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should handle completed filter', async() => {
      const mockTasks = [{ id: 1, title: 'Completed Task', completed: true }];
      const mockCount = [{ count: '1' }];

      mockPool.query
        .mockResolvedValueOnce({ rows: mockTasks })
        .mockResolvedValueOnce({ rows: mockCount });

      const response = await request(app)
        .get('/tasks?completed=true')
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].completed).toBe(true);
    });

    it('should handle multiple filters combined', async() => {
      const mockTasks = [{ id: 1, title: 'High Priority Task', priority: 'high', completed: false }];
      const mockCount = [{ count: '1' }];

      mockPool.query
        .mockResolvedValueOnce({ rows: mockTasks })
        .mockResolvedValueOnce({ rows: mockCount });

      const response = await request(app)
        .get('/tasks?priority=high&completed=false&search=priority')
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
    });

    it('should handle empty results', async() => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }] });

      const response = await request(app)
        .get('/tasks')
        .expect(200);

      expect(response.body.tasks).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should handle database query errors', async() => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/tasks')
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
    });
  });

  describe('POST /tasks - Extended scenarios', () => {
    it('should create task with all optional fields', async() => {
      const newTask = {
        title: 'Complete Task',
        description: 'Full description',
        priority: 'high',
        dueDate: '2024-12-31T23:59:59.000Z',
        completed: true
      };
      const createdTask = { id: 1, ...newTask, created_at: new Date() };

      mockPool.query.mockResolvedValue({ rows: [createdTask] });

      const response = await request(app)
        .post('/tasks')
        .send(newTask)
        .expect(201);

      expect(response.body.task.title).toBe(newTask.title);
      expect(response.body.task.description).toBe(newTask.description);
      expect(response.body.task.priority).toBe(newTask.priority);
      expect(response.body.task.completed).toBe(newTask.completed);
    });

    it('should handle task with minimal required fields', async() => {
      const newTask = { title: 'Minimal Task' };
      const createdTask = { 
        id: 1, 
        title: newTask.title, 
        description: null,
        priority: 'medium',
        completed: false,
        created_at: new Date() 
      };

      mockPool.query.mockResolvedValue({ rows: [createdTask] });

      const response = await request(app)
        .post('/tasks')
        .send(newTask)
        .expect(201);

      expect(response.body.task.title).toBe(newTask.title);
      expect(response.body.task.description).toBeNull();
      expect(response.body.task.priority).toBe('medium');
      expect(response.body.task.completed).toBe(false);
    });

    it('should validate title length', async() => {
      const longTitle = 'a'.repeat(256); // Exceeds 255 char limit

      const response = await request(app)
        .post('/tasks')
        .send({ title: longTitle })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should validate description length', async() => {
      const longDescription = 'a'.repeat(1001); // Exceeds 1000 char limit

      const response = await request(app)
        .post('/tasks')
        .send({ 
          title: 'Valid Title',
          description: longDescription 
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should validate invalid priority', async() => {
      const response = await request(app)
        .post('/tasks')
        .send({ 
          title: 'Valid Title',
          priority: 'invalid_priority' 
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should validate invalid due date format', async() => {
      const response = await request(app)
        .post('/tasks')
        .send({ 
          title: 'Valid Title',
          dueDate: 'invalid-date' 
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should handle database insertion errors', async() => {
      mockPool.query.mockRejectedValue(new Error('Insert failed'));

      const response = await request(app)
        .post('/tasks')
        .send({ title: 'Test Task' })
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
    });
  });

  describe('PUT /tasks/:id - Extended scenarios', () => {
    it('should update task with partial data', async() => {
      const updateData = { title: 'Updated Title' };
      const updatedTask = { id: 1, ...updateData, updated_at: new Date() };

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check if exists
        .mockResolvedValueOnce({ rows: [updatedTask] }); // Update

      const response = await request(app)
        .put('/tasks/1')
        .send(updateData)
        .expect(200);

      expect(response.body.task.title).toBe(updateData.title);
    });

    it('should update task with all fields', async() => {
      const updateData = {
        title: 'Fully Updated Task',
        description: 'Updated description',
        priority: 'low',
        dueDate: '2024-12-31T23:59:59.000Z',
        completed: true
      };
      const updatedTask = { id: 1, ...updateData, updated_at: new Date() };

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check if exists
        .mockResolvedValueOnce({ rows: [updatedTask] }); // Update

      const response = await request(app)
        .put('/tasks/1')
        .send(updateData)
        .expect(200);

      expect(response.body.task.title).toBe(updateData.title);
      expect(response.body.task.description).toBe(updateData.description);
      expect(response.body.task.priority).toBe(updateData.priority);
      expect(response.body.task.completed).toBe(updateData.completed);
    });

    it('should handle update with empty body', async() => {
      const response = await request(app)
        .put('/tasks/1')
        .send({})
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
    });

    it('should handle database update errors', async() => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check if exists
        .mockRejectedValueOnce(new Error('Update failed')); // Update fails

      const response = await request(app)
        .put('/tasks/1')
        .send({ title: 'Updated Task' })
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
    });
  });

  describe('PATCH /tasks/:id/complete - Extended scenarios', () => {
    it('should mark task as incomplete', async() => {
      const incompleteTask = { id: 1, title: 'Task', completed: false };
      mockPool.query.mockResolvedValue({ rows: [incompleteTask] });

      const response = await request(app)
        .patch('/tasks/1/complete')
        .send({ completed: false })
        .expect(200);

      expect(response.body.task.completed).toBe(false);
    });

    it('should handle missing completed field', async() => {
      const response = await request(app)
        .patch('/tasks/1/complete')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should handle non-boolean completed value', async() => {
      const response = await request(app)
        .patch('/tasks/1/complete')
        .send({ completed: 'yes' })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should handle database update errors for completion', async() => {
      mockPool.query.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .patch('/tasks/1/complete')
        .send({ completed: true })
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
    });
  });

  describe('DELETE /tasks/:id - Extended scenarios', () => {
    it('should handle database deletion errors', async() => {
      mockPool.query.mockRejectedValue(new Error('Delete failed'));

      const response = await request(app)
        .delete('/tasks/1')
        .expect(500);

      expect(response.body.error).toBe('Internal Server Error');
    });

    it('should handle invalid task ID format for deletion', async() => {
      const response = await request(app)
        .delete('/tasks/invalid-id')
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });
});
