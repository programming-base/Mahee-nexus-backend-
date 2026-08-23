const pool = require('../config/db');

/**
 * List publicly visible jobs (approved + open) with optional filters.
 * @param {object} params
 * @param {string} [params.keyword]
 * @param {string} [params.location]
 * @param {number} params.limit
 * @param {number} params.offset
 * @returns {Promise<{ rows: Array, total: number }>}
 */
async function findPublicJobs({ keyword, location, limit, offset }) {
  const conditions = [`j.status = 'open'`, `j.approval_status = 'approved'`];
  const values = [];

  if (keyword) {
    values.push(`%${keyword}%`);
    conditions.push(`(j.title ILIKE $${values.length} OR c.name ILIKE $${values.length})`);
  }
  if (location) {
    values.push(`%${location}%`);
    conditions.push(`j.location ILIKE $${values.length}`);
  }

  const where = conditions.join(' AND ');

  // Total count
  const countResult = await pool.query(
    `SELECT COUNT(*) AS total
     FROM jobs j
     JOIN companies c ON c.id = j.company_id
     WHERE ${where}`,
    values
  );

  // Paginated rows
  values.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT j.id, j.title, j.location, j.salary_min, j.salary_max,
            j.employment_type, j.experience_level, j.deadline, j.status,
            j.approval_status, j.created_at,
            c.id AS company_id, c.name AS company_name, c.logo_path AS company_logo
     FROM jobs j
     JOIN companies c ON c.id = j.company_id
     WHERE ${where}
     ORDER BY j.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  return { rows, total: parseInt(countResult.rows[0].total, 10) };
}

/**
 * Find a single publicly visible job by ID.
 * @param {number} jobId
 * @returns {Promise<object|null>}
 */
async function findPublicJobById(jobId) {
  const { rows } = await pool.query(
    `SELECT j.id, j.title, j.description, j.location, j.salary_min, j.salary_max,
            j.employment_type, j.experience_level, j.status, j.approval_status,
            j.deadline, j.created_at,
            c.id AS company_id, c.name AS company_name,
            c.logo_path AS company_logo, c.description AS company_description
     FROM jobs j
     JOIN companies c ON c.id = j.company_id
     WHERE j.id = $1
       AND j.status = 'open'
       AND j.approval_status = 'approved'
     LIMIT 1`,
    [jobId]
  );
  return rows[0] || null;
}

/**
 * Find any job by ID regardless of status (used internally by employer/admin).
 * @param {number} jobId
 * @returns {Promise<object|null>}
 */
async function findJobById(jobId) {
  const { rows } = await pool.query(
    `SELECT j.*, c.name AS company_name, c.logo_path AS company_logo
     FROM jobs j
     JOIN companies c ON c.id = j.company_id
     WHERE j.id = $1
     LIMIT 1`,
    [jobId]
  );
  return rows[0] || null;
}

/**
 * Find a job by ID scoped to a specific employer profile.
 * @param {number} jobId
 * @param {number} employerProfileId
 * @returns {Promise<object|null>}
 */
async function findJobByIdAndEmployer(jobId, employerProfileId) {
  const { rows } = await pool.query(
    `SELECT * FROM jobs
     WHERE id = $1 AND employer_id = $2
     LIMIT 1`,
    [jobId, employerProfileId]
  );
  return rows[0] || null;
}

/**
 * List all jobs belonging to an employer.
 * @param {number} employerProfileId
 * @returns {Promise<Array>}
 */
async function findJobsByEmployer(employerProfileId) {
  const { rows } = await pool.query(
    `SELECT id, title, location, salary_min, salary_max, employment_type,
            experience_level, status, approval_status, deadline, created_at, updated_at
     FROM jobs
     WHERE employer_id = $1
     ORDER BY created_at DESC`,
    [employerProfileId]
  );
  return rows;
}

/**
 * Create a new job. approval_status is always forced to 'pending_approval'.
 * @param {object} params
 * @param {number} params.employerProfileId
 * @param {number} params.companyId
 * @param {string} params.title
 * @param {string} params.description
 * @param {string} [params.location]
 * @param {string} [params.employmentType]
 * @param {string} [params.experienceLevel]
 * @param {number} [params.salaryMin]
 * @param {number} [params.salaryMax]
 * @param {string} [params.status]
 * @param {string} [params.deadline]
 * @returns {Promise<object>}
 */
async function createJob({
  employerProfileId,
  companyId,
  title,
  description,
  location,
  employmentType,
  experienceLevel,
  salaryMin,
  salaryMax,
  status,
  deadline,
}) {
  const { rows } = await pool.query(
    `INSERT INTO jobs
       (employer_id, company_id, title, description, location, employment_type,
        experience_level, salary_min, salary_max, status, approval_status, deadline)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending_approval', $11)
     RETURNING *`,
    [
      employerProfileId,
      companyId,
      title,
      description,
      location || null,
      employmentType || null,
      experienceLevel || null,
      salaryMin || 0,
      salaryMax || 0,
      status || 'open',
      deadline || null,
    ]
  );
  return rows[0];
}

/**
 * Update an existing job (employer). Does NOT reset approval_status.
 * @param {number} jobId
 * @param {object} params
 * @returns {Promise<object>}
 */
async function updateJob(
  jobId,
  { title, description, location, employmentType, experienceLevel, salaryMin, salaryMax, status, deadline }
) {
  const { rows } = await pool.query(
    `UPDATE jobs
     SET title = $1, description = $2, location = $3, employment_type = $4,
         experience_level = $5, salary_min = $6, salary_max = $7,
         status = $8, deadline = $9, updated_at = NOW()
     WHERE id = $10
     RETURNING *`,
    [
      title,
      description,
      location || null,
      employmentType || null,
      experienceLevel || null,
      salaryMin || 0,
      salaryMax || 0,
      status || 'open',
      deadline || null,
      jobId,
    ]
  );
  return rows[0];
}

/**
 * Update the approval_status of a job (admin action).
 * @param {number} jobId
 * @param {string} approvalStatus - 'approved' | 'rejected'
 * @returns {Promise<object>}
 */
async function updateJobApprovalStatus(jobId, approvalStatus) {
  const { rows } = await pool.query(
    `UPDATE jobs
     SET approval_status = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, title, approval_status`,
    [approvalStatus, jobId]
  );
  return rows[0];
}

/**
 * List all jobs for admin approval view.
 * Pending approval jobs appear first.
 * @returns {Promise<Array>}
 */
async function findAllJobsForAdmin() {
  const { rows } = await pool.query(
    `SELECT j.id, j.title, j.location, j.status, j.approval_status,
            j.deadline, j.created_at,
            c.name AS company_name,
            ep.first_name AS employer_first_name, ep.last_name AS employer_last_name,
            u.email AS employer_email
     FROM jobs j
     JOIN companies c ON c.id = j.company_id
     JOIN employer_profiles ep ON ep.id = j.employer_id
     JOIN users u ON u.id = ep.user_id
     ORDER BY
       CASE WHEN j.approval_status = 'pending_approval' THEN 0 ELSE 1 END,
       j.created_at DESC`
  );
  return rows;
}

module.exports = {
  findPublicJobs,
  findPublicJobById,
  findJobById,
  findJobByIdAndEmployer,
  findJobsByEmployer,
  createJob,
  updateJob,
  updateJobApprovalStatus,
  findAllJobsForAdmin,
};
