const db = require('../config/database');

class Return {
  static async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS returns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        return_no VARCHAR(50) NOT NULL UNIQUE COMMENT '退件单号',
        article_no VARCHAR(50) NOT NULL COMMENT '货号',
        size VARCHAR(10) NOT NULL COMMENT '尺码',
        quantity INT NOT NULL COMMENT '退件数量',
        reason VARCHAR(500) COMMENT '退件原因',
        status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '状态',
        operator VARCHAR(100) COMMENT '操作人',
        remark VARCHAR(500) COMMENT '备注',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_return_no (return_no),
        INDEX idx_article_no (article_no),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='退件记录表'
    `;
    await db.execute(sql);
  }

  static generateReturnNo() {
    const date = new Date();
    const prefix = 'RT' + date.getFullYear().toString().slice(-2) +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return prefix + random;
  }

  static async create(data) {
    const returnNo = Return.generateReturnNo();
    const { article_no, size, quantity, reason, operator, remark } = data;
    const [result] = await db.execute(
      `INSERT INTO returns (return_no, article_no, size, quantity, reason, operator, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [returnNo, article_no, size, quantity, reason, operator, remark]
    );
    return { id: result.insertId, return_no: returnNo };
  }

  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM returns WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findByReturnNo(returnNo) {
    const [rows] = await db.execute('SELECT * FROM returns WHERE return_no = ?', [returnNo]);
    return rows[0] || null;
  }

  static async updateStatus(id, status, operator) {
    await db.execute(
      'UPDATE returns SET status = ?, operator = ? WHERE id = ?',
      [status, operator, id]
    );
  }

  static async list(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    let sql = 'SELECT * FROM returns';
    let countSql = 'SELECT COUNT(*) as total FROM returns';
    const conditions = [];
    const params = [];

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }
    if (filters.article_no) {
      conditions.push('article_no LIKE ?');
      params.push(`%${filters.article_no}%`);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      sql += whereClause;
      countSql += whereClause;
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.execute(sql, params);
    const [countResult] = await db.execute(countSql, params.slice(0, -2));
    return { list: rows, total: countResult[0].total };
  }

  static async getStats() {
    const [rows] = await db.execute(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM returns
    `);
    return rows[0];
  }
}

module.exports = Return;
