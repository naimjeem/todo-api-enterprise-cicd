const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/', async(req, res) => {
  try {
    // Check database connection
    const dbCheck = await req.db.query('SELECT 1 as health_check');

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbCheck.rows[0] ? 'connected' : 'disconnected',
        api: 'running'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      }
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      services: {
        database: 'disconnected',
        api: 'running'
      }
    });
  }
});

// Readiness probe endpoint
router.get('/ready', async(req, res) => {
  try {
    // Check if the application is ready to serve traffic
    const dbCheck = await req.db.query('SELECT 1 as ready_check');

    if (dbCheck.rows[0]) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        reason: 'Database not ready'
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      reason: 'Database connection failed'
    });
  }
});

// Liveness probe endpoint
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;

