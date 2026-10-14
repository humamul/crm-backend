const { Router } = require('express');
const enquiryController = require('../controllers/enquiry.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validateBody, validateParams } = require('../middlewares/validate.middleware');
const CreateEnquiryRequestDTO = require('../dtos/requests/create-enquiry.dto');
const ClaimEnquiryRequestDTO = require('../dtos/requests/claim-enquiry.dto');

const router = Router();

// ==========================================
// 1. PUBLIC ROUTES (No Authentication)
// ==========================================

/**
 * Public form API for prospective clients / leads
 * Accessible without any authentication
 */
router.post(
  '/public/enquiries',
  validateBody(CreateEnquiryRequestDTO),
  (req, res, next) => enquiryController.createPublicEnquiry(req, res, next)
);

// ==========================================
// 2. PROTECTED ROUTES (JWT Required)
// ==========================================

/**
 * Fetch all unclaimed public enquiries
 */
router.get('/enquiries/unclaimed', authMiddleware, (req, res, next) =>
  enquiryController.getUnclaimedEnquiries(req, res, next)
);

/**
 * Claim an unclaimed enquiry for the logged-in counselor
 */
router.post(
  '/enquiries/:enquiryId/claim',
  authMiddleware,
  validateParams(ClaimEnquiryRequestDTO),
  (req, res, next) => enquiryController.claimEnquiry(req, res, next)
);

/**
 * Fetch enquiries claimed by the logged-in counselor
 */
router.get('/enquiries/my-claimed', authMiddleware, (req, res, next) =>
  enquiryController.getMyClaimedEnquiries(req, res, next)
);

module.exports = router;
