const enquiryFacade = require('../facades/enquiry.facade');
const ApiResponse = require('../dtos/responses/api.response');

class EnquiryController {
  /**
   * POST /api/v1/public/enquiries
   * Public enquiry form submission (No authentication required)
   */
  async createPublicEnquiry(req, res, next) {
    try {
      const enquiryResponse = await enquiryFacade.createEnquiry(req.dto);
      return res
        .status(201)
        .json(ApiResponse.success('Enquiry submitted successfully', enquiryResponse));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/enquiries/unclaimed
   * Fetches all public/unclaimed enquiries (Protected: counselors only)
   */
  async getUnclaimedEnquiries(req, res, next) {
    try {
      const { items, meta } = await enquiryFacade.getUnclaimedEnquiries(req.query);
      return res
        .status(200)
        .json(ApiResponse.success('Unclaimed enquiries fetched successfully', items, meta));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/enquiries/:enquiryId/claim
   * Claim an enquiry for the logged-in counselor (Protected)
   */
  async claimEnquiry(req, res, next) {
    try {
      const counselorId = req.user.id;
      const claimedEnquiry = await enquiryFacade.claimEnquiry(req.paramsDto, counselorId);
      return res
        .status(200)
        .json(ApiResponse.success('Enquiry claimed successfully', claimedEnquiry));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/enquiries/my-claimed
   * Fetches enquiries claimed by the logged-in counselor (Protected)
   */
  async getMyClaimedEnquiries(req, res, next) {
    try {
      const counselorId = req.user.id;
      const { items, meta } = await enquiryFacade.getMyClaimedEnquiries(counselorId, req.query);
      return res
        .status(200)
        .json(ApiResponse.success('Claimed enquiries fetched successfully', items, meta));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EnquiryController();
