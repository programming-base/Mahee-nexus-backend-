const pool = require('../config/db');

/**
 * Find a user by their email address.
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function findByEmail(email) {
  const { rows } = await pool.query(
    `SELECT id, email, password_hash, is_job_seeker, is_employer, is_super_admin, created_at
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

/**
 * Find a user by their primary key.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const { rows } = await pool.query(
    `SELECT id, email, is_job_seeker, is_employer, is_super_admin, created_at
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Insert a new user row.
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.passwordHash
 * @param {boolean} params.isJobSeeker
 * @param {boolean} params.isEmployer
 * @returns {Promise<object>} Newly created user row
 */
async function createUser({ email, passwordHash, isJobSeeker, isEmployer }) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, is_job_seeker, is_employer, is_super_admin)
     VALUES ($1, $2, $3, $4, false)
     RETURNING id, email, is_job_seeker, is_employer, is_super_admin, created_at`,
    [email, passwordHash, isJobSeeker, isEmployer]
  );
  return rows[0];
}

/**
 * Check whether an email is already registered.
 * @param {string} email
 * @returns {Promise<boolean>}
 */
async function emailExists(email) {
  const { rows } = await pool.query(
    'SELECT 1 FROM users WHERE email = $1 LIMIT 1',
    [email]
  );
  return rows.length > 0;
}

module.exports = { findByEmail, findById, createUser, emailExists };
