const profileRepo = require('../repositories/profile.repository');
const jobService = require('../services/job.service');
const appService = require('../services/application.service');
const assignService = require('../services/assignment.service');
const invoiceService = require('../services/invoice.service');
const payrollService = require('../services/payroll.service');
const messagingService = require('../services/messaging.service');
const { auditLog, getRecentAuditLogs } = require('../services/audit.service');
const { AUDIT_ACTIONS } = require('../utils/constants');
const { success } = require('../utils/response');
const pool = require('../config/db');

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

async function getDashboard(req, res, next) {
  try {
    const [
      { rows: pendingEmployers },
      { rows: pendingEmployees },
      { rows: pendingJobs },
      { rows: pendingApps },
      { rows: activeAssignments },
      { rows: unpaidInvoices },
      { rows: totalUsers },
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM employer_profiles WHERE verification_status = 'pending'`),
      pool.query(`SELECT COUNT(*) FROM job_seeker_profiles WHERE verification_status = 'pending'`),
      pool.query(`SELECT COUNT(*) FROM jobs WHERE approval_status = 'pending_approval'`),
      pool.query(`SELECT COUNT(*) FROM applications WHERE admin_review_status = 'pending'`),
      pool.query(`SELECT COUNT(*) FROM assignments WHERE status = 'active'`),
      pool.query(`SELECT COUNT(*) FROM invoices WHERE status = 'unpaid'`),
      pool.query(`SELECT COUNT(*) FROM users`),
    ]);

    const recentAuditLogs = await getRecentAuditLogs(10);

    return success(res, {
      stats: {
        pendingEmployers: parseInt(pendingEmployers[0].count, 10),
        pendingEmployees: parseInt(pendingEmployees[0].count, 10),
        pendingJobs: parseInt(pendingJobs[0].count, 10),
        pendingApplications: parseInt(pendingApps[0].count, 10),
        activeAssignments: parseInt(activeAssignments[0].count, 10),
        unpaidInvoices: parseInt(unpaidInvoices[0].count, 10),
        totalUsers: parseInt(totalUsers[0].count, 10),
      },
      recentAuditLogs,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Employers
// ---------------------------------------------------------------------------

async function listEmployers(req, res, next) {
  try {
    const data = await profileRepo.listEmployerProfilesForAdmin();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function updateEmployerStatus(req, res, next) {
  try {
    const profileId = Number(req.params.profileId);
    const { status } = req.body;

    const updated = await profileRepo.updateEmployerVerification(profileId, status);
    if (!updated) return res.status(404).json({ success: false, message: 'Employer profile not found' });

    await auditLog({
      adminId: req.user.id,
      action: status === 'verified' ? AUDIT_ACTIONS.EMPLOYER_VERIFIED : AUDIT_ACTIONS.EMPLOYER_REJECTED,
      targetType: 'employer_profile',
      targetId: profileId,
      details: `Employer profile ${profileId} set to ${status}`,
    });

    return success(res, updated, `Employer ${status}`);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Job seekers
// ---------------------------------------------------------------------------

async function listJobseekers(req, res, next) {
  try {
    const data = await profileRepo.listJobSeekerProfilesForAdmin();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function updateJobseekerStatus(req, res, next) {
  try {
    const profileId = Number(req.params.profileId);
    const { status } = req.body;

    const updated = await profileRepo.updateJobSeekerVerification(profileId, status);
    if (!updated) return res.status(404).json({ success: false, message: 'Job seeker profile not found' });

    await auditLog({
      adminId: req.user.id,
      action: status === 'verified' ? AUDIT_ACTIONS.EMPLOYEE_VERIFIED : AUDIT_ACTIONS.EMPLOYEE_REJECTED,
      targetType: 'employee_profile',
      targetId: profileId,
      details: `Job seeker profile ${profileId} set to ${status}`,
    });

    return success(res, updated, `Job seeker ${status}`);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

async function listJobs(req, res, next) {
  try {
    const data = await jobService.listJobsForAdmin();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function updateJobStatus(req, res, next) {
  try {
    const jobId = Number(req.params.jobId);
    const { status } = req.body;

    const updated = await jobService.updateJobApprovalStatus(jobId, status);

    await auditLog({
      adminId: req.user.id,
      action: status === 'approved' ? AUDIT_ACTIONS.JOB_APPROVED : AUDIT_ACTIONS.JOB_REJECTED,
      targetType: 'job',
      targetId: jobId,
      details: `Job ${jobId} approval status set to ${status}`,
    });

    return success(res, updated, `Job ${status}`);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

async function listApplications(req, res, next) {
  try {
    const data = await appService.listApplicationsForAdmin();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function reviewApplication(req, res, next) {
  try {
    const applicationId = Number(req.params.applicationId);
    const { status } = req.body;

    const updated = await appService.reviewApplication(applicationId, status);

    await auditLog({
      adminId: req.user.id,
      action: status === 'shortlisted'
        ? AUDIT_ACTIONS.APPLICATION_SHORTLISTED
        : AUDIT_ACTIONS.APPLICATION_REJECTED,
      targetType: 'application',
      targetId: applicationId,
      details: `Application ${applicationId} set to ${status}`,
    });

    return success(res, updated, `Application ${status}`);
  } catch (err) {
    next(err);
  }
}

async function assignCandidate(req, res, next) {
  try {
    const applicationId = Number(req.params.applicationId);
    const assignment = await assignService.assignCandidate(applicationId, req.user.id);
    return success(res, assignment, 'Candidate assigned successfully', 201);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Assignments
// ---------------------------------------------------------------------------

async function listAssignments(req, res, next) {
  try {
    const data = await assignService.listAllAssignments();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Invoice & payroll
// ---------------------------------------------------------------------------

async function generateInvoice(req, res, next) {
  try {
    const assignmentId = Number(req.params.assignmentId);
    const invoice = await invoiceService.generateInvoice(assignmentId, req.user.id);
    return success(res, invoice, 'Invoice generated successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function processPayroll(req, res, next) {
  try {
    const assignmentId = Number(req.params.assignmentId);
    const payroll = await payrollService.processPayroll(assignmentId, req.user.id);
    return success(res, payroll, 'Payroll processed successfully', 201);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

async function listConversations(req, res, next) {
  try {
    const data = await messagingService.listConversations();
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function getConversation(req, res, next) {
  try {
    const data = await messagingService.getConversation(Number(req.params.userId));
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

async function replyToUser(req, res, next) {
  try {
    const message = await messagingService.replyToUser(
      req.user.id,
      Number(req.params.userId),
      req.body.message
    );
    return success(res, message, 'Reply sent', 201);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  listEmployers,
  updateEmployerStatus,
  listJobseekers,
  updateJobseekerStatus,
  listJobs,
  updateJobStatus,
  listApplications,
  reviewApplication,
  assignCandidate,
  listAssignments,
  generateInvoice,
  processPayroll,
  listConversations,
  getConversation,
  replyToUser,
};
