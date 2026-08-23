const { error } = require('../utils/response');

/**
 * Role-guard factory.
 * Usage in routes:
 *   router.get('/dashboard', authenticate, authorize('employer'), controller.dashboard);
 *
 * @param {...string} allowedRoles - One or more role strings to permit.
 * @returns {import('express').RequestHandler}
 */
function authorize(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return error(res, 'Authentication required', 401);
    }

    const { activeRole } = req.user;

    if (!allowedRoles.includes(activeRole)) {
      return error(res, 'You do not have permission to access this resource', 403);
    }

    next();
  };
}

module.exports = authorize;
