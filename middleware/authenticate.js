const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');

/**
 * Authenticate middleware.
 * Reads a JWT from the HTTP-only cookie "token" or the Authorization header.
 * Populates req.user = { id, email, roles, activeRole } on success.
 */
function authenticate(req, res, next) {
  try {
    let token = null;

    // 1. Prefer HTTP-only cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // 2. Fall back to Bearer header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return error(res, 'Authentication required', 401);
    }

    const payload = verifyToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      roles: payload.roles,
      activeRole: payload.activeRole,
    };

    next();
  } catch (err) {
    return error(res, 'Invalid or expired token', 401);
  }
}

module.exports = authenticate;
