const pool = require('../config/db');
const appRepo = require('../repositories/application.repository');
const assignRepo = require('../repositories/assignment.repository');
const profileRepo = require('../repositories/profile.repository');
const { auditLog } = require('./audit.service');
const { DEFAULTS, AUDIT_ACTIONS } = require('../utils/constants');

/**
 * Assign a candidate to a job.
 * Runs in a single DB transaction:
 *   1. Mark application as hired + assigned
 *   2. Insert assignment row
 *   3. Insert audit log
 *
 * @param {number} applicationId
 * @param {number} adminUserId
 * @returns {Promise<object>}
 */
async function assignCandidate(applicationId, adminUserId) {
  const application = await appRepo.findById(applicationId);
  if (!application) {
    const err = new Error('Application not found');
    err.statusCode = 404;
    throw err;
  }

  // Check for existing active assignment for same job + employee
  const duplicate = await assignRepo.findActiveByJobAndEmployee(
    application.job_id,
    application.user_id
  );
  if (duplicate) {
    const err = new Error('An active assignment already exists for this candidate and job');
    err.statusCode = 409;
    throw err;
  }

  // Fetch job to get employer_id and salary_min
  const { rows: jobRows } = await pool.query(
    'SELECT employer_id, salary_min FROM jobs WHERE id = $1 LIMIT 1',
    [application.job_id]
  );
  const job = jobRows[0];
  if (!job) {
    const err = new Error('Job not found');
    err.statusCode = 404;
    throw err;
  }

  const monthlySalary = job.salary_min || DEFAULTS.FALLBACK_SALARY;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Step 1 — update application
    await appRepo.markAsAssigned(client, applicationId);

    // Step 2 — insert assignment
    const assignment = await assignRepo.createAssignment(client, {
      jobId: application.job_id,
      employerProfileId: job.employer_id,
      employeeUserId: application.user_id,
      assignedByAdminId: adminUserId,
      monthlySalary,
    });

    // Step 3 — audit log
    await auditLog({
      adminId: adminUserId,
      action: AUDIT_ACTIONS.CANDIDATE_ASSIGNED,
      targetType: 'assignment',
      targetId: assignment.id,
      details: `Assigned user ${application.user_id} to job ${application.job_id}`,
      client,
    });

    await client.query('COMMIT');
    return assignment;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * List all assignments for a job seeker.
 * @param {number} userId
 * @returns {Promise<Array>}
 */
async function listMyAssignments(userId) {
  return assignRepo.findByEmployee(userId);
}

/**
 * List assignments for an employer.
 * @param {number} userId
 * @returns {Promise<Array>}
 */
async function listEmployerAssignments(userId) {
  const profile = await profileRepo.findEmployerByUserId(userId);
  if (!profile) {
    const err = new Error('Employer profile not found');
    err.statusCode = 404;
    throw err;
  }
  return assignRepo.findByEmployer(profile.id);
}

/**
 * List all assignments for admin view.
 * @returns {Promise<Array>}
 */
async function listAllAssignments() {
  return assignRepo.findAllForAdmin();
}

module.exports = {
  assignCandidate,
  listMyAssignments,
  listEmployerAssignments,
  listAllAssignments,
};
