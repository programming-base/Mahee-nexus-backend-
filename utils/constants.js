// ---------------------------------------------------------------------------
// User roles
// ---------------------------------------------------------------------------
const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  EMPLOYER: 'employer',
  JOB_SEEKER: 'job_seeker',
});

// ---------------------------------------------------------------------------
// Job status
// ---------------------------------------------------------------------------
const JOB_STATUS = Object.freeze({
  OPEN: 'open',
  CLOSED: 'closed',
});

const JOB_APPROVAL_STATUS = Object.freeze({
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

// ---------------------------------------------------------------------------
// Application status
// ---------------------------------------------------------------------------
const APPLICATION_STATUS = Object.freeze({
  PENDING: 'pending',
  SHORTLISTED: 'shortlisted',
  HIRED: 'hired',
  REJECTED: 'rejected',
});

const APPLICATION_ADMIN_REVIEW_STATUS = Object.freeze({
  PENDING: 'pending',
  SHORTLISTED: 'shortlisted',
  ASSIGNED: 'assigned',
  REJECTED: 'rejected',
});

// ---------------------------------------------------------------------------
// Verification status (employer profiles & job-seeker profiles)
// ---------------------------------------------------------------------------
const VERIFICATION_STATUS = Object.freeze({
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
});

// ---------------------------------------------------------------------------
// Assignment status
// ---------------------------------------------------------------------------
const ASSIGNMENT_STATUS = Object.freeze({
  ACTIVE: 'active',
});

// ---------------------------------------------------------------------------
// Attendance status
// ---------------------------------------------------------------------------
const ATTENDANCE_STATUS = Object.freeze({
  PRESENT: 'present',
  HALF_DAY: 'half_day',
  LEAVE: 'leave',
});

// ---------------------------------------------------------------------------
// Invoice status
// ---------------------------------------------------------------------------
const INVOICE_STATUS = Object.freeze({
  UNPAID: 'unpaid',
  PAID: 'paid',
});

// ---------------------------------------------------------------------------
// Payroll status
// ---------------------------------------------------------------------------
const PAYROLL_STATUS = Object.freeze({
  PENDING: 'pending',
  PROCESSED: 'processed',
});

// ---------------------------------------------------------------------------
// Audit log action labels
// ---------------------------------------------------------------------------
const AUDIT_ACTIONS = Object.freeze({
  EMPLOYER_VERIFIED: 'Employer Verified',
  EMPLOYER_REJECTED: 'Employer Rejected',
  EMPLOYEE_VERIFIED: 'Employee Verified',
  EMPLOYEE_REJECTED: 'Employee Rejected',
  JOB_APPROVED: 'Job Approved',
  JOB_REJECTED: 'Job Rejected',
  APPLICATION_SHORTLISTED: 'Application Shortlisted',
  APPLICATION_REJECTED: 'Application Rejected',
  CANDIDATE_ASSIGNED: 'Candidate Assigned',
  INVOICE_GENERATED: 'Invoice Generated',
  PAYROLL_PROCESSED: 'Payroll Processed',
});

// ---------------------------------------------------------------------------
// Business defaults (sourced from PHP logic)
// ---------------------------------------------------------------------------
const DEFAULTS = Object.freeze({
  FALLBACK_SALARY: 3500,          // Used when salary_min is absent/falsey
  INVOICE_MULTIPLIER: 1.25,       // Employer invoice = monthly_salary × 1.25
  ATTENDANCE_DEFAULT_HOURS: 8.0,  // Default hours_worked when omitted
  INVOICE_DUE_DAYS: 30,           // Due date = issue_date + 30 days
  PAYROLL_PERIOD_DAYS: 30,        // Pay period = today − 30 days → today
  JOBS_PER_PAGE: 20,
});

module.exports = {
  ROLES,
  JOB_STATUS,
  JOB_APPROVAL_STATUS,
  APPLICATION_STATUS,
  APPLICATION_ADMIN_REVIEW_STATUS,
  VERIFICATION_STATUS,
  ASSIGNMENT_STATUS,
  ATTENDANCE_STATUS,
  INVOICE_STATUS,
  PAYROLL_STATUS,
  AUDIT_ACTIONS,
  DEFAULTS,
};
