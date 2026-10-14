const Joi = require('joi');
const { BadRequestError } = require('../../utils/errors');

class ClaimEnquiryRequestDTO {
  constructor({ enquiryId }) {
    this.enquiryId = parseInt(enquiryId, 10);
  }

  static schema = Joi.object({
    enquiryId: Joi.number().integer().positive().required().messages({
      'number.base': 'Enquiry ID must be a number',
      'number.integer': 'Enquiry ID must be an integer',
      'number.positive': 'Enquiry ID must be positive',
      'any.required': 'Enquiry ID is required',
    }),
  });

  static validate(data) {
    const { error, value } = ClaimEnquiryRequestDTO.schema.validate(data, {
      abortEarly: false,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      throw new BadRequestError('Validation failed for claim enquiry request', details);
    }

    return new ClaimEnquiryRequestDTO(value);
  }
}

module.exports = ClaimEnquiryRequestDTO;
