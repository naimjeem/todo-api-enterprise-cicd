const requestLogger = (logger) => {
  return (req, res, next) => {
    const start = Date.now();

    // Log request
    logger.info('Incoming request', {
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
      const duration = Date.now() - start;

      logger.info('Request completed', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

module.exports = {
  requestLogger
};

