class UserResponseDTO {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.createdAt = user.created_at || user.createdAt;
  }

  static fromEntity(user) {
    if (!user) return null;
    return new UserResponseDTO(user);
  }

  static fromEntities(users = []) {
    return users.map((u) => UserResponseDTO.fromEntity(u));
  }
}

module.exports = UserResponseDTO;
