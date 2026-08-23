const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password.
 * @param {string} plainPassword
 * @returns {Promise<string>} Bcrypt hash
 */
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a stored hash.
 * @param {string} plainPassword
 * @param {string} hash - Stored bcrypt hash
 * @returns {Promise<boolean>}
 */
async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

module.exports = { hashPassword, comparePassword };
