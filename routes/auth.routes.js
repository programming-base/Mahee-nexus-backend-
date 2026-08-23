const express = require('express');
const router = express.Router();

const controller = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerSchema, loginSchema, roleSelectSchema } = require('../validators/auth.validator');

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), controller.register);

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), controller.login);

// POST /api/auth/logout
router.post('/logout', authenticate, controller.logout);

// GET /api/auth/me
router.get('/me', authenticate, controller.me);

// POST /api/auth/role  — dual-role users select their active role after login
router.post('/role', authenticate, validate(roleSelectSchema), controller.selectRole);

module.exports = router;
