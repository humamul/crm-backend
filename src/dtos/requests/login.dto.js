const Joi = require('joi');
const { BadRequestError } = require('../../utils/errors');

class LoginRequestDTO {
  constructor({ email, password }) {
    this.email = email ? email.trim().toLowerCase() : '';
    this.password = password;
  }

  static schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'A valid email is required',
      'string.empty': 'Email is required',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required',
    }),
  });

  static validate(data) {
    const { error, value } = LoginRequestDTO.schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      throw new BadRequestError('Validation failed for login request', details);
    }

    return new LoginRequestDTO(value);
  }
}

module.exports = LoginRequestDTO;
