/**
 * Centralized error handler.
 * Must be the LAST middleware registered in app.js:
 *   app.use(errorHandler);
 *
 * Catches errors thrown by controllers/services via next(err).
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(`[ERROR] ${req.method} ${req.originalUrl} —`, err.message);

  // Postgres unique-constraint violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
    });
  }

  // Postgres foreign-key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource does not exist',
    });
  }

  // JWT errors forwarded as errors (shouldn't normally reach here,
  // but acts as a safety net)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }

  // Known operational error with an explicit status
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Fallback — 500
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred. Please try again later.',
  });
}

module.exports = errorHandler;
