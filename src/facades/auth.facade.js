const authService = require('../services/auth.service');
const AuthResponseDTO = require('../dtos/responses/auth.response.dto');

/**
 * AuthFacade (Assembler Layer)
 * Bridges the Controller and Service layer, assembling domain data into response DTOs.
 */
class AuthFacade {
  /**
   * Orchestrates counselor registration and assembles response DTO
   * @param {Object} registerRequestDTO
   * @returns {Promise<AuthResponseDTO>}
   */
  async register(registerRequestDTO) {
    const { name, email, password, role } = registerRequestDTO;

    const authResult = await authService.register({
      name,
      email,
      password,
      role,
    });

    // Assemble and return response DTO
    return AuthResponseDTO.create(
      authResult.user,
      authResult.token,
      authResult.expiresIn
    );
  }

  /**
   * Orchestrates counselor login and assembles response DTO
   * @param {Object} loginRequestDTO
   * @returns {Promise<AuthResponseDTO>}
   */
  async login(loginRequestDTO) {
    const { email, password } = loginRequestDTO;

    const authResult = await authService.login({
      email,
      password,
    });

    // Assemble and return response DTO
    return AuthResponseDTO.create(
      authResult.user,
      authResult.token,
      authResult.expiresIn
    );
  }
}

module.exports = new AuthFacade();
