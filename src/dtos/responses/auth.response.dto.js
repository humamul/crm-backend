const UserResponseDTO = require('./user.response.dto');

class AuthResponseDTO {
  constructor(user, token, expiresIn = '24h') {
    this.user = UserResponseDTO.fromEntity(user);
    this.token = token;
    this.tokenType = 'Bearer';
    this.expiresIn = expiresIn;
  }

  static create(user, token, expiresIn) {
    return new AuthResponseDTO(user, token, expiresIn);
  }
}

module.exports = AuthResponseDTO;
