const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Joi = require('joi');
const router = express.Router();

// Validation schemas
const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  dueDate: Joi.date().iso().optional(),
  completed: Joi.boolean().default(false)
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(1000).optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  dueDate: Joi.date().iso().optional(),
  completed: Joi.boolean().optional()
});

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// GET /tasks - Get all tasks with pagination and filtering
router.get('/', async(req, res, next) => {
  try {
    const { page = 1, limit = 10, priority, completed, search } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM tasks WHERE 1=1';
    const queryParams = [];
    let paramCount = 0;

    if (priority) {
      query += ` AND priority = $${++paramCount}`;
      queryParams.push(priority);
    }

    if (completed !== undefined) {
      query += ` AND completed = $${++paramCount}`;
      queryParams.push(completed === 'true');
    }

    if (search) {
      query += ` AND (title ILIKE $${++paramCount} OR description ILIKE $${++paramCount})`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    queryParams.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await req.db.query(query, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM tasks WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (priority) {
      countQuery += ` AND priority = $${++countParamCount}`;
      countParams.push(priority);
    }

    if (completed !== undefined) {
      countQuery += ` AND completed = $${++countParamCount}`;
      countParams.push(completed === 'true');
    }

    if (search) {
      countQuery += ` AND (title ILIKE $${++countParamCount} OR description ILIKE $${++countParamCount})`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await req.db.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    res.json({
      tasks: result.rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit, 10))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /tasks/:id - Get a specific task
router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Task ID must be a positive integer')
], async(req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array().map(err => err.msg)
      });
    }

    const { id } = req.params;
    const result = await req.db.query('SELECT * FROM tasks WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// POST /tasks - Create a new task
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required and must be between 1-255 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid ISO 8601 date'),
  body('completed').optional().isBoolean().withMessage('Completed must be a boolean')
], validateRequest(createTaskSchema), async(req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array().map(err => err.msg)
      });
    }

    const { title, description, priority, dueDate, completed } = req.body;

    const result = await req.db.query(
      'INSERT INTO tasks (title, description, priority, due_date, completed) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description || null, priority || 'medium', dueDate || null, completed || false]
    );

    res.status(201).json({ task: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// PUT /tasks/:id - Update a task
router.put('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Task ID must be a positive integer'),
  body('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Title must be between 1-255 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid ISO 8601 date'),
  body('completed').optional().isBoolean().withMessage('Completed must be a boolean')
], validateRequest(updateTaskSchema), async(req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array().map(err => err.msg)
      });
    }

    const { id } = req.params;
    const { title, description, priority, dueDate, completed } = req.body;

    // Check if task exists
    const existingTask = await req.db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (existingTask.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    if (title !== undefined) {
      updateFields.push(`title = $${++paramCount}`);
      values.push(title);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${++paramCount}`);
      values.push(description);
    }
    if (priority !== undefined) {
      updateFields.push(`priority = $${++paramCount}`);
      values.push(priority);
    }
    if (dueDate !== undefined) {
      updateFields.push(`due_date = $${++paramCount}`);
      values.push(dueDate);
    }
    if (completed !== undefined) {
      updateFields.push(`completed = $${++paramCount}`);
      values.push(completed);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push('updated_at = NOW()');
    values.push(id);

    const result = await req.db.query(
      `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = $${++paramCount} RETURNING *`,
      values
    );

    res.json({ task: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// DELETE /tasks/:id - Delete a task
router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('Task ID must be a positive integer')
], async(req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array().map(err => err.msg)
      });
    }

    const { id } = req.params;

    const result = await req.db.query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// PATCH /tasks/:id/complete - Mark task as complete/incomplete
router.patch('/:id/complete', [
  param('id').isInt({ min: 1 }).withMessage('Task ID must be a positive integer'),
  body('completed').isBoolean().withMessage('Completed status is required and must be a boolean')
], async(req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array().map(err => err.msg)
      });
    }

    const { id } = req.params;
    const { completed } = req.body;

    const result = await req.db.query(
      'UPDATE tasks SET completed = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [completed, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
