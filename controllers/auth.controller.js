const authService = require('../services/auth.service');
const userRepo = require('../repositories/user.repository');
const { success, error } = require('../utils/response');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
};

async function register(req, res, next) {
  try {
    const data = await authService.register(req.body);
    return success(res, data, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);

    if (result.requiresRoleSelection) {
      // Set a partial token so the role-select endpoint can identify the user
      res.cookie('token', result.token, COOKIE_OPTIONS);
      return success(res, {
        requiresRoleSelection: true,
        roles: result.roles,
      }, 'Role selection required');
    }

    res.cookie('token', result.token, COOKIE_OPTIONS);
    return success(res, { user: result.user }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    res.clearCookie('token');
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await userRepo.findById(req.user.id);
    if (!user) return error(res, 'User not found', 404);

    return success(res, {
      id: user.id,
      email: user.email,
      roles: req.user.roles,
      activeRole: req.user.activeRole,
    });
  } catch (err) {
    next(err);
  }
}

async function selectRole(req, res, next) {
  try {
    const { token, activeRole } = await authService.selectRole(req.user, req.body.role);
    res.cookie('token', token, COOKIE_OPTIONS);
    return success(res, { activeRole }, 'Active role updated');
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me, selectRole };
