const appRepo = require('../repositories/application.repository');
const jobRepo = require('../repositories/job.repository');
const profileRepo = require('../repositories/profile.repository');

/**
 * Apply to a job.
 * Validates: job visible, job seeker has resume, no duplicate application.
 * @param {number} userId
 * @param {number} jobId
 * @returns {Promise<object>}
 */
async function applyToJob(userId, jobId) {
  const job = await jobRepo.findPublicJobById(jobId);
  if (!job) {
    const err = new Error('Job not found or no longer available');
    err.statusCode = 404;
    throw err;
  }

  const profile = await profileRepo.findJobSeekerByUserId(userId);
  if (!profile || !profile.resume_path) {
    const err = new Error('You must upload a resume before applying');
    err.statusCode = 422;
    throw err;
  }

  const existing = await appRepo.findByUserAndJob(userId, jobId);
  if (existing) {
    const err = new Error('You have already applied for this job');
    err.statusCode = 409;
    throw err;
  }

  return appRepo.createApplication(userId, jobId);
}

/**
 * List all applications for the authenticated job seeker.
 * @param {number} userId
 * @returns {Promise<Array>}
 */
async function listMyApplications(userId) {
  return appRepo.findByUser(userId);
}

/**
 * List all applications for admin review.
 * @returns {Promise<Array>}
 */
async function listApplicationsForAdmin() {
  return appRepo.findAllForAdmin();
}

/**
 * Shortlist or reject an application (admin).
 * @param {number} applicationId
 * @param {string} status - 'shortlisted' | 'rejected'
 * @returns {Promise<object>}
 */
async function reviewApplication(applicationId, status) {
  const application = await appRepo.findById(applicationId);
  if (!application) {
    const err = new Error('Application not found');
    err.statusCode = 404;
    throw err;
  }
  return appRepo.updateAdminReviewStatus(applicationId, status);
}

/**
 * Save a job for a job seeker.
 * @param {number} userId
 * @param {number} jobId
 * @returns {Promise<object>}
 */
async function saveJob(userId, jobId) {
  const job = await jobRepo.findPublicJobById(jobId);
  if (!job) {
    const err = new Error('Job not found');
    err.statusCode = 404;
    throw err;
  }
  await appRepo.saveJob(userId, jobId);
  return { jobId, saved: true };
}

/**
 * Unsave a job for a job seeker.
 * @param {number} userId
 * @param {number} jobId
 * @returns {Promise<object>}
 */
async function unsaveJob(userId, jobId) {
  await appRepo.unsaveJob(userId, jobId);
  return { jobId, saved: false };
}

module.exports = {
  applyToJob,
  listMyApplications,
  listApplicationsForAdmin,
  reviewApplication,
  saveJob,
  unsaveJob,
};
