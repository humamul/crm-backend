const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const { ConflictError, UnauthorizedError } = require('../utils/errors');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'crm_jwt_super_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthService {
  /**
   * Register a new counselor/employee
   * @param {Object} userData
   * @returns {Promise<{ user: Object, token: string, expiresIn: string }>}
   */
  async register({ name, email, password, role = 'COUNSELOR' }) {
    // 1. Check duplicate user
    const exists = await userRepository.existsByEmail(email);
    if (exists) {
      throw new ConflictError(`An employee account with email '${email}' already exists`);
    }

    // 2. Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Persist user
    const newUser = await userRepository.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // 4. Generate JWT
    const token = this.generateToken(newUser);

    return {
      user: newUser,
      token,
      expiresIn: JWT_EXPIRES_IN,
    };
  }

  /**
   * Authenticate employee and issue JWT
   * @param {Object} credentials
   * @returns {Promise<{ user: Object, token: string, expiresIn: string }>}
   */
  async login({ email, password }) {
    // 1. Fetch user by email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password credentials');
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password credentials');
    }

    // 3. Generate JWT
    const token = this.generateToken(user);

    return {
      user,
      token,
      expiresIn: JWT_EXPIRES_IN,
    };
  }

  /**
   * Sign a JWT token for a given user payload
   * @param {Object} user
   * @returns {string}
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  /**
   * Verify JWT token
   * @param {string} token
   * @returns {Object}
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }
  }
}

module.exports = new AuthService();
