const enquiryRepository = require('../repositories/enquiry.repository');
const { NotFoundError, ConflictError } = require('../utils/errors');

class EnquiryService {
  /**
   * Create a new public enquiry (unclaimed lead)
   * @param {Object} enquiryData
   * @returns {Promise<Object>}
   */
  async createEnquiry({ name, email, phone, courseInterest }) {
    return enquiryRepository.create({
      name,
      email,
      phone,
      courseInterest,
    });
  }

  /**
   * Fetch all unclaimed public enquiries
   * @param {Object} options
   * @returns {Promise<{ data: Array, total: number, page: number, limit: number, totalPages: number }>}
   */
  async getUnclaimedEnquiries(options) {
    return enquiryRepository.findAllUnclaimed(options);
  }

  /**
   * Atomically claim an enquiry for the logged-in counselor
   * @param {number} enquiryId
   * @param {number} counselorId
   * @returns {Promise<Object>}
   */
  async claimEnquiry(enquiryId, counselorId) {
    // 1. Check if enquiry exists
    const existingEnquiry = await enquiryRepository.findById(enquiryId);
    if (!existingEnquiry) {
      throw new NotFoundError(`Enquiry with ID ${enquiryId} not found`);
    }

    // 2. Check if already claimed
    if (existingEnquiry.status === 'CLAIMED') {
      if (existingEnquiry.claimed_by === counselorId) {
        throw new ConflictError('You have already claimed this lead');
      }
      throw new ConflictError(
        `This enquiry has already been claimed by counselor (${existingEnquiry.counselor_name || 'Another Counselor'})`
      );
    }

    // 3. Perform atomic status transition
    const updateResult = await enquiryRepository.claimLeadAtomic(enquiryId, counselorId);
    if (!updateResult.success) {
      throw new ConflictError('This enquiry was claimed concurrently by another counselor');
    }

    // 4. Return updated enquiry with counselor details
    return enquiryRepository.findById(enquiryId);
  }

  /**
   * Fetch enquiries claimed by a specific counselor
   * @param {number} counselorId
   * @param {Object} options
   * @returns {Promise<{ data: Array, total: number, page: number, limit: number, totalPages: number }>}
   */
  async getClaimedEnquiriesByCounselor(counselorId, options) {
    return enquiryRepository.findClaimedByCounselor(counselorId, options);
  }

  /**
   * Get enquiry by ID
   * @param {number} enquiryId
   * @returns {Promise<Object>}
   */
  async getEnquiryById(enquiryId) {
    const enquiry = await enquiryRepository.findById(enquiryId);
    if (!enquiry) {
      throw new NotFoundError(`Enquiry with ID ${enquiryId} not found`);
    }
    return enquiry;
  }
}

module.exports = new EnquiryService();
