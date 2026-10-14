const { getPool } = require('../config/database');

class EnquiryRepository {
  constructor() {
    this.pool = getPool();
  }

  /**
   * Create a new public enquiry
   * @param {Object} enquiryData
   * @returns {Promise<Object>}
   */
  async create({ name, email, phone, courseInterest }) {
    const query = `
      INSERT INTO enquiries (name, email, phone, course_interest, status)
      VALUES (?, ?, ?, ?, 'UNCLAIMED')
    `;
    const [result] = await this.pool.execute(query, [
      name,
      email.toLowerCase(),
      phone,
      courseInterest,
    ]);

    return this.findById(result.insertId);
  }

  /**
   * Find an enquiry by ID with claimed counselor info
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const query = `
      SELECT 
        e.id,
        e.name,
        e.email,
        e.phone,
        e.course_interest,
        e.status,
        e.claimed_by,
        e.claimed_at,
        e.created_at,
        e.updated_at,
        u.name AS counselor_name,
        u.email AS counselor_email
      FROM enquiries e
      LEFT JOIN users u ON e.claimed_by = u.id
      WHERE e.id = ?
      LIMIT 1
    `;
    const [rows] = await this.pool.execute(query, [id]);
    return rows.length ? rows[0] : null;
  }

  /**
   * Find all unclaimed (public) enquiries
   * @param {Object} options
   * @returns {Promise<{ data: Array, total: number, page: number, limit: number, totalPages: number }>}
   */
  async findAllUnclaimed({ page = 1, limit = 20, search = '' } = {}) {
    const offset = (page - 1) * limit;
    let whereClause = "WHERE e.status = 'UNCLAIMED'";
    const queryParams = [];

    if (search && search.trim() !== '') {
      whereClause += ` AND (
        e.name LIKE ? OR 
        e.email LIKE ? OR 
        e.phone LIKE ? OR 
        e.course_interest LIKE ?
      )`;
      const searchWildcard = `%${search.trim()}%`;
      queryParams.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }

    // Count total records matching criteria
    const countQuery = `SELECT COUNT(*) AS total FROM enquiries e ${whereClause}`;
    const [countRows] = await this.pool.execute(countQuery, queryParams);
    const total = countRows[0].total;

    // Fetch paginated records
    const dataQuery = `
      SELECT 
        e.id,
        e.name,
        e.email,
        e.phone,
        e.course_interest,
        e.status,
        e.claimed_by,
        e.claimed_at,
        e.created_at,
        e.updated_at
      FROM enquiries e
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?
    `;

    // mysql2 requires numbers for LIMIT and OFFSET
    const [rows] = await this.pool.query(dataQuery, [...queryParams, limit, offset]);

    return {
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Find enquiries claimed by a specific counselor
   * @param {number} counselorId
   * @param {Object} options
   * @returns {Promise<{ data: Array, total: number, page: number, limit: number, totalPages: number }>}
   */
  async findClaimedByCounselor(counselorId, { page = 1, limit = 20, search = '' } = {}) {
    const offset = (page - 1) * limit;
    let whereClause = "WHERE e.claimed_by = ? AND e.status = 'CLAIMED'";
    const queryParams = [counselorId];

    if (search && search.trim() !== '') {
      whereClause += ` AND (
        e.name LIKE ? OR 
        e.email LIKE ? OR 
        e.phone LIKE ? OR 
        e.course_interest LIKE ?
      )`;
      const searchWildcard = `%${search.trim()}%`;
      queryParams.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }

    // Count total records
    const countQuery = `SELECT COUNT(*) AS total FROM enquiries e ${whereClause}`;
    const [countRows] = await this.pool.execute(countQuery, queryParams);
    const total = countRows[0].total;

    // Fetch paginated records
    const dataQuery = `
      SELECT 
        e.id,
        e.name,
        e.email,
        e.phone,
        e.course_interest,
        e.status,
        e.claimed_by,
        e.claimed_at,
        e.created_at,
        e.updated_at,
        u.name AS counselor_name,
        u.email AS counselor_email
      FROM enquiries e
      LEFT JOIN users u ON e.claimed_by = u.id
      ${whereClause}
      ORDER BY e.claimed_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await this.pool.query(dataQuery, [...queryParams, limit, offset]);

    return {
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Atomically claim an enquiry by ID for a counselor.
   * Concurrency-safe: only updates if current status is 'UNCLAIMED'.
   * @param {number} enquiryId
   * @param {number} counselorId
   * @returns {Promise<{ success: boolean, affectedRows: number }>}
   */
  async claimLeadAtomic(enquiryId, counselorId) {
    const updateQuery = `
      UPDATE enquiries
      SET 
        status = 'CLAIMED',
        claimed_by = ?,
        claimed_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'UNCLAIMED'
    `;

    const [result] = await this.pool.execute(updateQuery, [counselorId, enquiryId]);

    return {
      success: result.affectedRows > 0,
      affectedRows: result.affectedRows,
    };
  }
}

module.exports = new EnquiryRepository();
