const express = require('express');
const router = express.Router();

const controller = require('../controllers/employer.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { uploadLogo } = require('../middleware/upload');
const { updateEmployerProfileSchema } = require('../validators/profile.validator');
const { createJobSchema, updateJobSchema } = require('../validators/job.validator');
const { sendMessageSchema } = require('../validators/message.validator');

// All employer routes require authentication + employer active role
router.use(authenticate, authorize('employer'));

// GET  /api/employer/dashboard
router.get('/dashboard', controller.getDashboard);

// GET  /api/employer/profile
router.get('/profile', controller.getProfile);

// PUT  /api/employer/profile
router.put('/profile', validate(updateEmployerProfileSchema), controller.updateProfile);

// POST /api/employer/profile/logo
router.post('/profile/logo', uploadLogo, controller.uploadLogo);

// GET  /api/employer/jobs
router.get('/jobs', controller.listJobs);

// POST /api/employer/jobs
router.post('/jobs', validate(createJobSchema), controller.createJob);

// GET  /api/employer/jobs/:jobId
router.get('/jobs/:jobId', controller.getJob);

// PUT  /api/employer/jobs/:jobId
router.put('/jobs/:jobId', validate(updateJobSchema), controller.updateJob);

// GET  /api/employer/assignments
router.get('/assignments', controller.listAssignments);

// GET  /api/employer/invoices
router.get('/invoices', controller.listInvoices);

// POST /api/employer/invoices/:invoiceId/pay
router.post('/invoices/:invoiceId/pay', controller.payInvoice);

// GET  /api/employer/messages
router.get('/messages', controller.getMessages);

// POST /api/employer/messages
router.post('/messages', validate(sendMessageSchema), controller.sendMessage);

module.exports = router;
