const authFacade = require('../facades/auth.facade');
const ApiResponse = require('../dtos/responses/api.response');

class AuthController {
  /**
   * POST /api/v1/auth/register
   * Registers a new employee/counselor
   */
  async register(req, res, next) {
    try {
      const authResponse = await authFacade.register(req.dto);
      return res
        .status(201)
        .json(ApiResponse.success('Employee registered successfully', authResponse));
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   * Authenticates employee and issues JWT
   */
  async login(req, res, next) {
    try {
      const authResponse = await authFacade.login(req.dto);
      return res
        .status(200)
        .json(ApiResponse.success('Login successful', authResponse));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   * Fetches profile of currently logged-in counselor
   */
  async getProfile(req, res, next) {
    try {
      return res
        .status(200)
        .json(ApiResponse.success('User profile retrieved', req.user));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
