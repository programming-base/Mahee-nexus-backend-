const express = require('express');
const router = express.Router();

const controller = require('../controllers/admin.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { sendMessageSchema } = require('../validators/message.validator');
const {
  verificationStatusSchema,
  jobApprovalStatusSchema,
  applicationReviewSchema,
} = require('../validators/admin.validator');

// All admin routes require authentication + super_admin active role
router.use(authenticate, authorize('super_admin'));

// GET  /api/admin/dashboard
router.get('/dashboard', controller.getDashboard);

// --- Employers ---
// GET   /api/admin/employers
router.get('/employers', controller.listEmployers);
// PATCH /api/admin/employers/:profileId/status
router.patch('/employers/:profileId/status', validate(verificationStatusSchema), controller.updateEmployerStatus);

// --- Job seekers ---
// GET   /api/admin/jobseekers
router.get('/jobseekers', controller.listJobseekers);
// PATCH /api/admin/jobseekers/:profileId/status
router.patch('/jobseekers/:profileId/status', validate(verificationStatusSchema), controller.updateJobseekerStatus);

// --- Jobs ---
// GET   /api/admin/jobs
router.get('/jobs', controller.listJobs);
// PATCH /api/admin/jobs/:jobId/status
router.patch('/jobs/:jobId/status', validate(jobApprovalStatusSchema), controller.updateJobStatus);

// --- Applications ---
// GET   /api/admin/applications
router.get('/applications', controller.listApplications);
// PATCH /api/admin/applications/:applicationId/review
router.patch('/applications/:applicationId/review', validate(applicationReviewSchema), controller.reviewApplication);
// POST  /api/admin/applications/:applicationId/assign
router.post('/applications/:applicationId/assign', controller.assignCandidate);

// --- Assignments ---
// GET  /api/admin/assignments
router.get('/assignments', controller.listAssignments);
// POST /api/admin/assignments/:assignmentId/invoice
router.post('/assignments/:assignmentId/invoice', controller.generateInvoice);
// POST /api/admin/assignments/:assignmentId/payroll
router.post('/assignments/:assignmentId/payroll', controller.processPayroll);

// --- Messages ---
// GET  /api/admin/messages/conversations
router.get('/messages/conversations', controller.listConversations);
// GET  /api/admin/messages/:userId
router.get('/messages/:userId', controller.getConversation);
// POST /api/admin/messages/:userId
router.post('/messages/:userId', validate(sendMessageSchema), controller.replyToUser);

module.exports = router;
