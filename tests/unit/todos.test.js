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

describe('Todo API Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /tasks', () => {
    it('should return all tasks with pagination', async() => {
      const mockTasks = [
        { id: 1, title: 'Test Task 1', completed: false },
        { id: 2, title: 'Test Task 2', completed: true }
      ];
      const mockCount = [{ count: '2' }];

      mockPool.query
        .mockResolvedValueOnce({ rows: mockTasks })
        .mockResolvedValueOnce({ rows: mockCount });

      const response = await request(app)
        .get('/tasks')
        .expect(200);

      expect(response.body.tasks).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should filter tasks by priority', async() => {
      const mockTasks = [{ id: 1, title: 'High Priority Task', priority: 'high' }];
      const mockCount = [{ count: '1' }];

      mockPool.query
        .mockResolvedValueOnce({ rows: mockTasks })
        .mockResolvedValueOnce({ rows: mockCount });

      const response = await request(app)
        .get('/tasks?priority=high')
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].priority).toBe('high');
    });

    it('should search tasks by title and description', async() => {
      const mockTasks = [{ id: 1, title: 'Important Task', description: 'Very important' }];
      const mockCount = [{ count: '1' }];

      mockPool.query
        .mockResolvedValueOnce({ rows: mockTasks })
        .mockResolvedValueOnce({ rows: mockCount });

      const response = await request(app)
        .get('/tasks?search=important')
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
    });
  });

  describe('GET /tasks/:id', () => {
    it('should return a specific task', async() => {
      const mockTask = { id: 1, title: 'Test Task', completed: false };
      mockPool.query.mockResolvedValue({ rows: [mockTask] });

      const response = await request(app)
        .get('/tasks/1')
        .expect(200);

      expect(response.body.task).toEqual(mockTask);
    });

    it('should return 404 for non-existent task', async() => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/tasks/999')
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });

    it('should return 400 for invalid task ID', async() => {
      const response = await request(app)
        .get('/tasks/invalid')
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('POST /tasks', () => {
    it('should create a new task', async() => {
      const newTask = {
        title: 'New Task',
        description: 'Task description',
        priority: 'medium',
        completed: false
      };
      const createdTask = { id: 1, ...newTask, created_at: new Date() };

      mockPool.query.mockResolvedValue({ rows: [createdTask] });

      const response = await request(app)
        .post('/tasks')
        .send(newTask)
        .expect(201);

      expect(response.body.task.title).toBe(newTask.title);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tasks'),
        expect.arrayContaining([newTask.title, newTask.description, newTask.priority, null, false])
      );
    });

    it('should return 400 for invalid task data', async() => {
      const invalidTask = { title: '' }; // Empty title

      const response = await request(app)
        .post('/tasks')
        .send(invalidTask)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should return 400 for invalid priority', async() => {
      const invalidTask = {
        title: 'Test Task',
        priority: 'invalid'
      };

      const response = await request(app)
        .post('/tasks')
        .send(invalidTask)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update an existing task', async() => {
      const updateData = { title: 'Updated Task', completed: true };
      const updatedTask = { id: 1, ...updateData, updated_at: new Date() };

      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Check if exists
        .mockResolvedValueOnce({ rows: [updatedTask] }); // Update

      const response = await request(app)
        .put('/tasks/1')
        .send(updateData)
        .expect(200);

      expect(response.body.task.title).toBe(updateData.title);
      expect(response.body.task.completed).toBe(updateData.completed);
    });

    it('should return 404 for non-existent task', async() => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .put('/tasks/999')
        .send({ title: 'Updated Task' })
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete an existing task', async() => {
      const deletedTask = { id: 1, title: 'Deleted Task' };
      mockPool.query.mockResolvedValue({ rows: [deletedTask] });

      await request(app)
        .delete('/tasks/1')
        .expect(204);

      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM tasks WHERE id = $1 RETURNING *',
        ['1']
      );
    });

    it('should return 404 for non-existent task', async() => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .delete('/tasks/999')
        .expect(404);

      expect(response.body.error).toBe('Task not found');
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    it('should mark task as complete', async() => {
      const completedTask = { id: 1, title: 'Task', completed: true };
      mockPool.query.mockResolvedValue({ rows: [completedTask] });

      const response = await request(app)
        .patch('/tasks/1/complete')
        .send({ completed: true })
        .expect(200);

      expect(response.body.task.completed).toBe(true);
    });

    it('should return 400 for invalid completed status', async() => {
      const response = await request(app)
        .patch('/tasks/1/complete')
        .send({ completed: 'invalid' })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });
});
