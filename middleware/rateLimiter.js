const rateLimit = require('express-rate-limit');

/**
 * Strict rate limiter for authentication endpoints.
 * Allows 10 attempts per IP per 15 minutes.
 * Applied to POST /auth/login and POST /auth/register.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

/**
 * General API rate limiter.
 * Allows 100 requests per IP per minute.
 * Can be applied globally in app.js.
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please slow down',
  },
});

module.exports = { authLimiter, generalLimiter };
