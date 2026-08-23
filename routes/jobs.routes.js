const express = require('express');
const router = express.Router();

const controller = require('../controllers/jobs.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { jobQuerySchema } = require('../validators/job.validator');

// GET /api/jobs  — public, optional filters
router.get('/', validate(jobQuerySchema, 'query'), controller.listJobs);

// GET /api/jobs/:jobId  — public
router.get('/:jobId', controller.getJob);

// POST /api/jobs/:jobId/applications  — job_seeker only
router.post('/:jobId/applications', authenticate, authorize('job_seeker'), controller.applyToJob);

// POST /api/jobs/:jobId/save  — job_seeker only
router.post('/:jobId/save', authenticate, authorize('job_seeker'), controller.saveJob);

// DELETE /api/jobs/:jobId/save  — job_seeker only
router.delete('/:jobId/save', authenticate, authorize('job_seeker'), controller.unsaveJob);

module.exports = router;
