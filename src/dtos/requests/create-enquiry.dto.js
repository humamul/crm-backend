const Joi = require('joi');
const { BadRequestError } = require('../../utils/errors');

class CreateEnquiryRequestDTO {
  constructor({ name, email, phone, courseInterest }) {
    this.name = name ? name.trim() : '';
    this.email = email ? email.trim().toLowerCase() : '';
    this.phone = phone ? phone.trim() : '';
    this.courseInterest = courseInterest ? courseInterest.trim() : '';
  }

  static schema = Joi.object({
    name: Joi.string().min(2).max(100).required().messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'any.required': 'Name is required',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'A valid email is required',
      'string.empty': 'Email is required',
      'any.required': 'Email is required',
    }),
    phone: Joi.string()
      .pattern(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/)
      .required()
      .messages({
        'string.pattern.base': 'A valid phone number is required (min 7 digits, digits/symbols only)',
        'string.empty': 'Phone number is required',
        'any.required': 'Phone number is required',
      }),
    courseInterest: Joi.string().min(2).max(100).required().messages({
      'string.empty': 'Course interest is required',
      'string.min': 'Course interest must be at least 2 characters long',
      'any.required': 'Course interest is required',
    }),
  });

  static validate(data) {
    const { error, value } = CreateEnquiryRequestDTO.schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      throw new BadRequestError('Validation failed for enquiry submission', details);
    }

    return new CreateEnquiryRequestDTO(value);
  }
}

module.exports = CreateEnquiryRequestDTO;
