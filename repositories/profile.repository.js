const pool = require('../config/db');

// ---------------------------------------------------------------------------
// Job-seeker profile
// ---------------------------------------------------------------------------

/**
 * Find a job-seeker profile by user ID.
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
async function findJobSeekerByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT id, user_id, first_name, last_name, phone, resume_path, verification_status
     FROM job_seeker_profiles
     WHERE user_id = $1
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

/**
 * Find a job-seeker profile by its primary key.
 * @param {number} profileId
 * @returns {Promise<object|null>}
 */
async function findJobSeekerById(profileId) {
  const { rows } = await pool.query(
    `SELECT id, user_id, first_name, last_name, phone, resume_path, verification_status
     FROM job_seeker_profiles
     WHERE id = $1
     LIMIT 1`,
    [profileId]
  );
  return rows[0] || null;
}

/**
 * Create an empty job-seeker profile for a newly registered user.
 * @param {number} userId
 * @returns {Promise<object>}
 */
async function createJobSeekerProfile(userId) {
  const { rows } = await pool.query(
    `INSERT INTO job_seeker_profiles (user_id)
     VALUES ($1)
     RETURNING id, user_id, first_name, last_name, phone, resume_path, verification_status`,
    [userId]
  );
  return rows[0];
}

/**
 * Update first name, last name and phone for a job-seeker profile.
 * @param {number} userId
 * @param {object} params
 * @param {string} params.firstName
 * @param {string} params.lastName
 * @param {string} [params.phone]
 * @returns {Promise<object>}
 */
async function updateJobSeekerProfile(userId, { firstName, lastName, phone }) {
  const { rows } = await pool.query(
    `UPDATE job_seeker_profiles
     SET first_name = $1, last_name = $2, phone = $3
     WHERE user_id = $4
     RETURNING id, user_id, first_name, last_name, phone, resume_path, verification_status`,
    [firstName, lastName, phone || null, userId]
  );
  return rows[0];
}

/**
 * Update the resume_path column for a job-seeker profile.
 * @param {number} userId
 * @param {string} resumePath - Public Supabase Storage URL
 * @returns {Promise<object>}
 */
async function updateJobSeekerResume(userId, resumePath) {
  const { rows } = await pool.query(
    `UPDATE job_seeker_profiles
     SET resume_path = $1
     WHERE user_id = $2
     RETURNING id, user_id, resume_path`,
    [resumePath, userId]
  );
  return rows[0];
}

/**
 * Update the verification_status of a job-seeker profile (admin action).
 * @param {number} profileId
 * @param {string} status - 'verified' | 'rejected'
 * @returns {Promise<object>}
 */
async function updateJobSeekerVerification(profileId, status) {
  const { rows } = await pool.query(
    `UPDATE job_seeker_profiles
     SET verification_status = $1
     WHERE id = $2
     RETURNING id, user_id, verification_status`,
    [status, profileId]
  );
  return rows[0];
}

/**
 * List all job-seeker profiles for admin verification view.
 * Pending profiles appear first.
 * @returns {Promise<Array>}
 */
async function listJobSeekerProfilesForAdmin() {
  const { rows } = await pool.query(
    `SELECT jsp.id, jsp.user_id, jsp.first_name, jsp.last_name, jsp.phone,
            jsp.resume_path, jsp.verification_status,
            u.email, u.created_at AS joined_at
     FROM job_seeker_profiles jsp
     JOIN users u ON u.id = jsp.user_id
     ORDER BY
       CASE WHEN jsp.verification_status = 'pending' THEN 0 ELSE 1 END,
       jsp.id DESC`
  );
  return rows;
}

// ---------------------------------------------------------------------------
// Employer profile
// ---------------------------------------------------------------------------

/**
 * Find an employer profile by user ID (includes company data).
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
async function findEmployerByUserId(userId) {
  const { rows } = await pool.query(
    `SELECT ep.id, ep.user_id, ep.first_name, ep.last_name, ep.phone,
            ep.company_id, ep.verification_status,
            c.id AS company_id, c.name AS company_name, c.industry,
            c.description AS company_description, c.logo_path
     FROM employer_profiles ep
     LEFT JOIN companies c ON c.id = ep.company_id
     WHERE ep.user_id = $1
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

/**
 * Find an employer profile by its primary key.
 * @param {number} profileId
 * @returns {Promise<object|null>}
 */
async function findEmployerById(profileId) {
  const { rows } = await pool.query(
    `SELECT ep.id, ep.user_id, ep.first_name, ep.last_name, ep.phone,
            ep.company_id, ep.verification_status,
            c.id AS company_id, c.name AS company_name, c.industry,
            c.description AS company_description, c.logo_path
     FROM employer_profiles ep
     LEFT JOIN companies c ON c.id = ep.company_id
     WHERE ep.id = $1
     LIMIT 1`,
    [profileId]
  );
  return rows[0] || null;
}

/**
 * Create an empty employer profile for a newly registered user.
 * @param {number} userId
 * @returns {Promise<object>}
 */
async function createEmployerProfile(userId) {
  const { rows } = await pool.query(
    `INSERT INTO employer_profiles (user_id)
     VALUES ($1)
     RETURNING id, user_id, first_name, last_name, phone, company_id, verification_status`,
    [userId]
  );
  return rows[0];
}

/**
 * Update personal fields on an employer profile.
 * @param {number} userId
 * @param {object} params
 * @param {string} params.firstName
 * @param {string} params.lastName
 * @param {string} [params.phone]
 * @param {number} params.companyId
 * @returns {Promise<object>}
 */
async function updateEmployerProfile(userId, { firstName, lastName, phone, companyId }) {
  const { rows } = await pool.query(
    `UPDATE employer_profiles
     SET first_name = $1, last_name = $2, phone = $3, company_id = $4
     WHERE user_id = $5
     RETURNING id, user_id, first_name, last_name, phone, company_id, verification_status`,
    [firstName, lastName, phone || null, companyId, userId]
  );
  return rows[0];
}

/**
 * Update the verification_status of an employer profile (admin action).
 * @param {number} profileId
 * @param {string} status - 'verified' | 'rejected'
 * @returns {Promise<object>}
 */
async function updateEmployerVerification(profileId, status) {
  const { rows } = await pool.query(
    `UPDATE employer_profiles
     SET verification_status = $1
     WHERE id = $2
     RETURNING id, user_id, verification_status`,
    [status, profileId]
  );
  return rows[0];
}

/**
 * List all employer profiles for admin verification view.
 * Pending profiles appear first.
 * @returns {Promise<Array>}
 */
async function listEmployerProfilesForAdmin() {
  const { rows } = await pool.query(
    `SELECT ep.id, ep.user_id, ep.first_name, ep.last_name, ep.phone,
            ep.verification_status,
            c.name AS company_name, c.industry,
            u.email, u.created_at AS joined_at
     FROM employer_profiles ep
     LEFT JOIN companies c ON c.id = ep.company_id
     JOIN users u ON u.id = ep.user_id
     ORDER BY
       CASE WHEN ep.verification_status = 'pending' THEN 0 ELSE 1 END,
       ep.id DESC`
  );
  return rows;
}

// ---------------------------------------------------------------------------
// Company
// ---------------------------------------------------------------------------

/**
 * Find a company by its primary key.
 * @param {number} companyId
 * @returns {Promise<object|null>}
 */
async function findCompanyById(companyId) {
  const { rows } = await pool.query(
    'SELECT id, name, industry, description, logo_path FROM companies WHERE id = $1 LIMIT 1',
    [companyId]
  );
  return rows[0] || null;
}

/**
 * Insert a new company row.
 * @param {object} params
 * @param {string} params.name
 * @param {string} [params.industry]
 * @param {string} [params.description]
 * @returns {Promise<object>}
 */
async function createCompany({ name, industry, description }) {
  const { rows } = await pool.query(
    `INSERT INTO companies (name, industry, description)
     VALUES ($1, $2, $3)
     RETURNING id, name, industry, description, logo_path`,
    [name, industry || null, description || null]
  );
  return rows[0];
}

/**
 * Update an existing company row.
 * @param {number} companyId
 * @param {object} params
 * @param {string} params.name
 * @param {string} [params.industry]
 * @param {string} [params.description]
 * @returns {Promise<object>}
 */
async function updateCompany(companyId, { name, industry, description }) {
  const { rows } = await pool.query(
    `UPDATE companies
     SET name = $1, industry = $2, description = $3
     WHERE id = $4
     RETURNING id, name, industry, description, logo_path`,
    [name, industry || null, description || null, companyId]
  );
  return rows[0];
}

/**
 * Update the logo_path column for a company.
 * @param {number} companyId
 * @param {string} logoPath - Public Supabase Storage URL
 * @returns {Promise<object>}
 */
async function updateCompanyLogo(companyId, logoPath) {
  const { rows } = await pool.query(
    `UPDATE companies
     SET logo_path = $1
     WHERE id = $2
     RETURNING id, logo_path`,
    [logoPath, companyId]
  );
  return rows[0];
}

module.exports = {
  // Job seeker
  findJobSeekerByUserId,
  findJobSeekerById,
  createJobSeekerProfile,
  updateJobSeekerProfile,
  updateJobSeekerResume,
  updateJobSeekerVerification,
  listJobSeekerProfilesForAdmin,
  // Employer
  findEmployerByUserId,
  findEmployerById,
  createEmployerProfile,
  updateEmployerProfile,
  updateEmployerVerification,
  listEmployerProfilesForAdmin,
  // Company
  findCompanyById,
  createCompany,
  updateCompany,
  updateCompanyLogo,
};
