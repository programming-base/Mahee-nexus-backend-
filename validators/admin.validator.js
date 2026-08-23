const Joi = require('joi');

// PATCH /admin/employers/:profileId/status
// PATCH /admin/jobseekers/:profileId/status
const verificationStatusSchema = Joi.object({
  status: Joi.string().valid('verified', 'rejected').required().messages({
    'any.required': 'Status is required',
    'any.only': 'Status must be verified or rejected',
  }),
});

// PATCH /admin/jobs/:jobId/status
const jobApprovalStatusSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required().messages({
    'any.required': 'Status is required',
    'any.only': 'Status must be approved or rejected',
  }),
});

// PATCH /admin/applications/:applicationId/review
const applicationReviewSchema = Joi.object({
  status: Joi.string().valid('shortlisted', 'rejected').required().messages({
    'any.required': 'Status is required',
    'any.only': 'Status must be shortlisted or rejected',
  }),
});

module.exports = {
  verificationStatusSchema,
  jobApprovalStatusSchema,
  applicationReviewSchema,
};
