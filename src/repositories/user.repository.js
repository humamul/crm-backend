const { getPool } = require('../config/database');

class UserRepository {
  constructor() {
    this.pool = getPool();
  }

  /**
   * Find user by email
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    const [rows] = await this.pool.execute(query, [email.toLowerCase()]);
    return rows.length ? rows[0] : null;
  }

  /**
   * Find user by ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const query = 'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1';
    const [rows] = await this.pool.execute(query, [id]);
    return rows.length ? rows[0] : null;
  }

  /**
   * Create a new user / counselor
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  async create({ name, email, password, role = 'COUNSELOR' }) {
    const query = `
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await this.pool.execute(query, [
      name,
      email.toLowerCase(),
      password,
      role,
    ]);

    return {
      id: result.insertId,
      name,
      email: email.toLowerCase(),
      role,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  /**
   * Check if user exists by email
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  async existsByEmail(email) {
    const query = 'SELECT 1 FROM users WHERE email = ? LIMIT 1';
    const [rows] = await this.pool.execute(query, [email.toLowerCase()]);
    return rows.length > 0;
  }
}

module.exports = new UserRepository();
