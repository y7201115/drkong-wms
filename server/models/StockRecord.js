const db = require('../config/database');

class StockRecord {
  static async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS stock_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inventory_id INT NOT NULL COMMENT '库存ID',
        article_no VARCHAR(50) NOT NULL COMMENT '货号',
        size VARCHAR(10) NOT NULL COMMENT '尺码',
        type ENUM('inbound', 'outbound') NOT NULL COMMENT '类型: inbound-入库, outbound-出库',
        quantity INT NOT NULL COMMENT '数量',
        before_quantity INT NOT NULL COMMENT '操作前数量',
        after_quantity INT NOT NULL COMMENT '操作后数量',
        operator VARCHAR(100) COMMENT '操作人',
        remark VARCHAR(500) COMMENT '备注',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_article_no (article_no),
        INDEX idx_type (type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='出入库记录表'
    `;
    await db.execute(sql);
  }

  static async create(data) {
    const { inventory_id, article_no, size, type, quantity, before_quantity, after_quantity, operator, remark } = data;
    const [result] = await db.execute(
      `INSERT INTO stock_records
       (inventory_id, article_no, size, type, quantity, before_quantity, after_quantity, operator, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [inventory_id, article_no, size, type, quantity, before_quantity, after_quantity, operator, remark]
    );
    return result.insertId;
  }

  static async list(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    let sql = 'SELECT * FROM stock_records';
    let countSql = 'SELECT COUNT(*) as total FROM stock_records';
    const conditions = [];
    const params = [];

    if (filters.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }
    if (filters.article_no) {
      conditions.push('article_no LIKE ?');
      params.push(`%${filters.article_no}%`);
    }
    if (filters.start_date) {
      conditions.push('created_at >= ?');
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      conditions.push('created_at <= ?');
      params.push(filters.end_date);
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
}

module.exports = StockRecord;
