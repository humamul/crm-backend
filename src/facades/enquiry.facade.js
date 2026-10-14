const enquiryService = require('../services/enquiry.service');
const EnquiryResponseDTO = require('../dtos/responses/enquiry.response.dto');

/**
 * EnquiryFacade (Assembler Layer)
 * Coordinates enquiry business workflows and assembles DTOs for client responses.
 */
class EnquiryFacade {
  /**
   * Assembles creation of public enquiry
   * @param {Object} createEnquiryRequestDTO
   * @returns {Promise<EnquiryResponseDTO>}
   */
  async createEnquiry(createEnquiryRequestDTO) {
    const { name, email, phone, courseInterest } = createEnquiryRequestDTO;

    const newEnquiry = await enquiryService.createEnquiry({
      name,
      email,
      phone,
      courseInterest,
    });

    return EnquiryResponseDTO.fromEntity(newEnquiry);
  }

  /**
   * Assembles unclaimed public enquiries with pagination metadata
   * @param {Object} queryParams
   * @returns {Promise<{ items: Array<EnquiryResponseDTO>, meta: Object }>}
   */
  async getUnclaimedEnquiries(queryParams = {}) {
    const page = Math.max(1, parseInt(queryParams.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit || '20', 10)));
    const search = queryParams.search || '';

    const result = await enquiryService.getUnclaimedEnquiries({
      page,
      limit,
      search,
    });

    return {
      items: EnquiryResponseDTO.fromEntities(result.data),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Orchestrates lead claiming and maps result to EnquiryResponseDTO
   * @param {Object} claimEnquiryRequestDTO
   * @param {number} counselorId
   * @returns {Promise<EnquiryResponseDTO>}
   */
  async claimEnquiry(claimEnquiryRequestDTO, counselorId) {
    const { enquiryId } = claimEnquiryRequestDTO;

    const claimedEntity = await enquiryService.claimEnquiry(enquiryId, counselorId);

    return EnquiryResponseDTO.fromEntity(claimedEntity);
  }

  /**
   * Assembles counselor's claimed enquiries with pagination metadata
   * @param {number} counselorId
   * @param {Object} queryParams
   * @returns {Promise<{ items: Array<EnquiryResponseDTO>, meta: Object }>}
   */
  async getMyClaimedEnquiries(counselorId, queryParams = {}) {
    const page = Math.max(1, parseInt(queryParams.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(queryParams.limit || '20', 10)));
    const search = queryParams.search || '';

    const result = await enquiryService.getClaimedEnquiriesByCounselor(counselorId, {
      page,
      limit,
      search,
    });

    return {
      items: EnquiryResponseDTO.fromEntities(result.data),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }
}

module.exports = new EnquiryFacade();
