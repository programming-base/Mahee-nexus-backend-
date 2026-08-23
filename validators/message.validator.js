const Joi = require('joi');

const sendMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).required().messages({
    'any.required': 'Message is required',
    'string.empty': 'Message cannot be empty',
    'string.min': 'Message cannot be empty',
  }),
});

module.exports = { sendMessageSchema };
