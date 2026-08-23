const jobRepo = require('../repositories/job.repository');
const profileRepo = require('../repositories/profile.repository');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

/**
 * List publicly visible jobs with optional keyword/location filters.
 * @param {object} query - req.query
 * @returns {Promise<{ data: Array, pagination: object }>}
 */
async function listPublicJobs(query) {
  const { page, limit, offset } = parsePagination(query);
  const { keyword, location } = query;

  const { rows, total } = await jobRepo.findPublicJobs({ keyword, location, limit, offset });
  return { data: rows, pagination: buildPaginationMeta(page, limit, total) };
}

/**
 * Get a single publicly visible job by ID.
 * @param {number} jobId
 * @returns {Promise<object>}
 */
async function getPublicJob(jobId) {
  const job = await jobRepo.findPublicJobById(jobId);
  if (!job) {
    const err = new Error('Job not found');
    err.statusCode = 404;
    throw err;
  }
  return job;
}

/**
 * List all jobs belonging to the authenticated employer.
 * @param {number} userId
 * @returns {Promise<Array>}
 */
async function listEmployerJobs(userId) {
  const profile = await profileRepo.findEmployerByUserId(userId);
  if (!profile) {
    const err = new Error('Employer profile not found');
    err.statusCode = 404;
    throw err;
  }
  return jobRepo.findJobsByEmployer(profile.id);
}

/**
 * Get a single employer-owned job.
 * @param {number} jobId
 * @param {number} userId
 * @returns {Promise<object>}
 */
async function getEmployerJob(jobId, userId) {
  const profile = await profileRepo.findEmployerByUserId(userId);
  if (!profile) {
    const err = new Error('Employer profile not found');
    err.statusCode = 404;
    throw err;
  }

  const job = await jobRepo.findJobByIdAndEmployer(jobId, profile.id);
  if (!job) {
    const err = new Error('Job not found');
    err.statusCode = 404;
    throw err;
  }
  return job;
}

/**
 * Create a new job for an employer.
 * Employer must have a company_id set before posting.
 * @param {number} userId
 * @param {object} body - Validated request body
 * @returns {Promise<object>}
 */
async function createJob(userId, body) {
  const profile = await profileRepo.findEmployerByUserId(userId);
  if (!profile) {
    const err = new Error('Employer profile not found');
    err.statusCode = 404;
    throw err;
  }
  if (!profile.company_id) {
    const err = new Error('You must complete your company profile before posting a job');
    err.statusCode = 422;
    throw err;
  }

  return jobRepo.createJob({
    employerProfileId: profile.id,
    companyId: profile.company_id,
    ...body,
  });
}

/**
 * Update an existing employer-owned job.
 * Does NOT reset approval_status (preserves PHP source behavior).
 * @param {number} jobId
 * @param {number} userId
 * @param {object} body - Validated request body
 * @returns {Promise<object>}
 */
async function updateJob(jobId, userId, body) {
  const profile = await profileRepo.findEmployerByUserId(userId);
  if (!profile) {
    const err = new Error('Employer profile not found');
    err.statusCode = 404;
    throw err;
  }

  const existing = await jobRepo.findJobByIdAndEmployer(jobId, profile.id);
  if (!existing) {
    const err = new Error('Job not found');
    err.statusCode = 404;
    throw err;
  }

  return jobRepo.updateJob(jobId, body);
}

/**
 * Approve or reject a job (admin).
 * @param {number} jobId
 * @param {string} status - 'approved' | 'rejected'
 * @returns {Promise<object>}
 */
async function updateJobApprovalStatus(jobId, status) {
  const job = await jobRepo.findJobById(jobId);
  if (!job) {
    const err = new Error('Job not found');
    err.statusCode = 404;
    throw err;
  }
  return jobRepo.updateJobApprovalStatus(jobId, status);
}

/**
 * List all jobs for the admin approval view.
 * @returns {Promise<Array>}
 */
async function listJobsForAdmin() {
  return jobRepo.findAllJobsForAdmin();
}

module.exports = {
  listPublicJobs,
  getPublicJob,
  listEmployerJobs,
  getEmployerJob,
  createJob,
  updateJob,
  updateJobApprovalStatus,
  listJobsForAdmin,
};
