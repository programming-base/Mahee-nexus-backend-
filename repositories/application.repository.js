const pool = require('../config/db');

/**
 * Find an application by its primary key.
 * @param {number} applicationId
 * @returns {Promise<object|null>}
 */
async function findById(applicationId) {
  const { rows } = await pool.query(
    'SELECT * FROM applications WHERE id = $1 LIMIT 1',
    [applicationId]
  );
  return rows[0] || null;
}

/**
 * Find an application by user + job (used for duplicate-check).
 * @param {number} userId
 * @param {number} jobId
 * @returns {Promise<object|null>}
 */
async function findByUserAndJob(userId, jobId) {
  const { rows } = await pool.query(
    `SELECT id FROM applications
     WHERE user_id = $1 AND job_id = $2
     LIMIT 1`,
    [userId, jobId]
  );
  return rows[0] || null;
}

/**
 * List all applications submitted by a job seeker.
 * @param {number} userId
 * @returns {Promise<Array>}
 */
async function findByUser(userId) {
  const { rows } = await pool.query(
    `SELECT a.id, a.job_id, a.status, a.admin_review_status, a.created_at AS applied_at,
            j.title AS job_title, j.location,
            c.name AS company_name
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     WHERE a.user_id = $1
     ORDER BY a.created_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * List all applications for a specific job (admin/employer view).
 * @param {number} jobId
 * @returns {Promise<Array>}
 */
async function findByJob(jobId) {
  const { rows } = await pool.query(
    `SELECT a.id, a.user_id, a.status, a.admin_review_status, a.created_at AS applied_at,
            jsp.first_name, jsp.last_name, jsp.phone, jsp.resume_path,
            u.email
     FROM applications a
     JOIN job_seeker_profiles jsp ON jsp.user_id = a.user_id
     JOIN users u ON u.id = a.user_id
     WHERE a.job_id = $1
     ORDER BY a.created_at DESC`,
    [jobId]
  );
  return rows;
}

/**
 * List all applications for admin review.
 * Pending admin_review_status appears first.
 * @returns {Promise<Array>}
 */
async function findAllForAdmin() {
  const { rows } = await pool.query(
    `SELECT a.id, a.job_id, a.user_id, a.status, a.admin_review_status,
            a.created_at AS applied_at,
            j.title AS job_title, c.name AS company_name,
            jsp.first_name, jsp.last_name, jsp.phone, jsp.resume_path,
            u.email
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     JOIN job_seeker_profiles jsp ON jsp.user_id = a.user_id
     JOIN users u ON u.id = a.user_id
     ORDER BY
       CASE WHEN a.admin_review_status = 'pending' THEN 0 ELSE 1 END,
       a.created_at DESC`
  );
  return rows;
}

/**
 * Create a new application.
 * @param {number} userId
 * @param {number} jobId
 * @returns {Promise<object>}
 */
async function createApplication(userId, jobId) {
  const { rows } = await pool.query(
    `INSERT INTO applications (user_id, job_id, status, admin_review_status)
     VALUES ($1, $2, 'pending', 'pending')
     RETURNING id, user_id, job_id, status, admin_review_status, created_at`,
    [userId, jobId]
  );
  return rows[0];
}

/**
 * Update admin_review_status on an application (shortlist / reject).
 * @param {number} applicationId
 * @param {string} adminReviewStatus - 'shortlisted' | 'rejected'
 * @returns {Promise<object>}
 */
async function updateAdminReviewStatus(applicationId, adminReviewStatus) {
  const { rows } = await pool.query(
    `UPDATE applications
     SET admin_review_status = $1
     WHERE id = $2
     RETURNING id, status, admin_review_status`,
    [adminReviewStatus, applicationId]
  );
  return rows[0];
}

/**
 * Mark application as hired + assigned (called inside assign-candidate transaction).
 * Must be called with a pg client from an active transaction, not the pool directly.
 * @param {import('pg').PoolClient} client
 * @param {number} applicationId
 * @returns {Promise<object>}
 */
async function markAsAssigned(client, applicationId) {
  const { rows } = await client.query(
    `UPDATE applications
     SET status = 'hired', admin_review_status = 'assigned'
     WHERE id = $1
     RETURNING id, status, admin_review_status`,
    [applicationId]
  );
  return rows[0];
}

/**
 * Find or check saved job entry.
 * @param {number} userId
 * @param {number} jobId
 * @returns {Promise<object|null>}
 */
async function findSavedJob(userId, jobId) {
  const { rows } = await pool.query(
    'SELECT id FROM saved_jobs WHERE user_id = $1 AND job_id = $2 LIMIT 1',
    [userId, jobId]
  );
  return rows[0] || null;
}

/**
 * Save a job for a user.
 * @param {number} userId
 * @param {number} jobId
 * @returns {Promise<object>}
 */
async function saveJob(userId, jobId) {
  const { rows } = await pool.query(
    `INSERT INTO saved_jobs (user_id, job_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, job_id) DO NOTHING
     RETURNING id, user_id, job_id`,
    [userId, jobId]
  );
  return rows[0];
}

/**
 * Unsave a job for a user.
 * @param {number} userId
 * @param {number} jobId
 * @returns {Promise<void>}
 */
async function unsaveJob(userId, jobId) {
  await pool.query(
    'DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2',
    [userId, jobId]
  );
}

module.exports = {
  findById,
  findByUserAndJob,
  findByUser,
  findByJob,
  findAllForAdmin,
  createApplication,
  updateAdminReviewStatus,
  markAsAssigned,
  findSavedJob,
  saveJob,
  unsaveJob,
};
