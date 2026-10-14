const Joi = require('joi');
const { BadRequestError } = require('../../utils/errors');

class RegisterRequestDTO {
  constructor({ name, email, password, role = 'COUNSELOR' }) {
    this.name = name ? name.trim() : '';
    this.email = email ? email.trim().toLowerCase() : '';
    this.password = password;
    this.role = role;
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
    password: Joi.string().min(6).max(50).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.empty': 'Password is required',
      'any.required': 'Password is required',
    }),
    role: Joi.string().valid('COUNSELOR', 'ADMIN').default('COUNSELOR'),
  });

  static validate(data) {
    const { error, value } = RegisterRequestDTO.schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      throw new BadRequestError('Validation failed for registration request', details);
    }

    return new RegisterRequestDTO(value);
  }
}

module.exports = RegisterRequestDTO;
