const Joi = require('joi');

// Job-seeker profile update
const updateJobSeekerProfileSchema = Joi.object({
  firstName: Joi.string().trim().required().messages({
    'any.required': 'First name is required',
    'string.empty': 'First name cannot be empty',
  }),
  lastName: Joi.string().trim().required().messages({
    'any.required': 'Last name is required',
    'string.empty': 'Last name cannot be empty',
  }),
  phone: Joi.string().trim().allow('', null).optional(),
});

// Employer profile + company update
const updateEmployerProfileSchema = Joi.object({
  firstName: Joi.string().trim().required().messages({
    'any.required': 'First name is required',
    'string.empty': 'First name cannot be empty',
  }),
  lastName: Joi.string().trim().required().messages({
    'any.required': 'Last name is required',
    'string.empty': 'Last name cannot be empty',
  }),
  phone: Joi.string().trim().allow('', null).optional(),
  companyName: Joi.string().trim().required().messages({
    'any.required': 'Company name is required',
    'string.empty': 'Company name cannot be empty',
  }),
  industry: Joi.string().trim().allow('', null).optional(),
  description: Joi.string().trim().allow('', null).optional(),
});

module.exports = { updateJobSeekerProfileSchema, updateEmployerProfileSchema };
