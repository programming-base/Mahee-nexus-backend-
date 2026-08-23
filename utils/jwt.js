const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Sign a JWT token with the given payload.
 * @param {object} payload - Data to encode (e.g. { id, email, roles, activeRole })
 * @returns {string} Signed JWT string
 */
function signToken(payload) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT token and return the decoded payload.
 * Throws if the token is invalid or expired.
 * @param {string} token
 * @returns {object} Decoded payload
 */
function verifyToken(token) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };
