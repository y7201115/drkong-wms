const db = require('../config/database');

class Inventory {
  static async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL COMMENT '商品ID',
        article_no VARCHAR(50) NOT NULL COMMENT '货号',
        size VARCHAR(10) NOT NULL COMMENT '尺码',
        quantity INT NOT NULL DEFAULT 0 COMMENT '库存数量',
        warehouse VARCHAR(100) DEFAULT '默认仓库' COMMENT '仓库位置',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_article_size (article_no, size, warehouse),
        INDEX idx_article_no (article_no),
        INDEX idx_size (size)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='库存表'
    `;
    await db.execute(sql);
  }

  static async findByArticleAndSize(articleNo, size, warehouse = '默认仓库') {
    const [rows] = await db.execute(
      'SELECT * FROM inventory WHERE article_no = ? AND size = ? AND warehouse = ?',
      [articleNo, size, warehouse]
    );
    return rows[0] || null;
  }

  static async updateQuantity(id, quantity) {
    await db.execute(
      'UPDATE inventory SET quantity = ? WHERE id = ?',
      [quantity, id]
    );
  }

  static async incrementQuantity(id, amount) {
    await db.execute(
      'UPDATE inventory SET quantity = quantity + ? WHERE id = ?',
      [amount, id]
    );
  }

  static async decrementQuantity(id, amount) {
    await db.execute(
      'UPDATE inventory SET quantity = quantity - ? WHERE id = ? AND quantity >= ?',
      [amount, id, amount]
    );
  }

  static async create(data) {
    const { product_id, article_no, size, quantity, warehouse } = data;
    const [result] = await db.execute(
      'INSERT INTO inventory (product_id, article_no, size, quantity, warehouse) VALUES (?, ?, ?, ?, ?)',
      [product_id, article_no, size, quantity, warehouse || '默认仓库']
    );
    return result.insertId;
  }

  static async listByArticleNo(articleNo, warehouse = '默认仓库') {
    const [rows] = await db.execute(
      'SELECT * FROM inventory WHERE article_no = ? AND warehouse = ? ORDER BY size ASC',
      [articleNo, warehouse]
    );
    return rows;
  }

  static async list(page = 1, limit = 20, keyword = '') {
    const offset = (page - 1) * limit;
    let sql = `
      SELECT i.*, p.name as product_name, p.category
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
    `;
    let countSql = 'SELECT COUNT(*) as total FROM inventory i';
    const params = [];

    if (keyword) {
      sql += ' WHERE i.article_no LIKE ? OR i.size LIKE ?';
      countSql += ' WHERE i.article_no LIKE ? OR i.size LIKE ?';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY i.updated_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.execute(sql, params);
    const [countResult] = await db.execute(countSql, params.slice(0, keyword ? 2 : 0));
    return { list: rows, total: countResult[0].total };
  }

  static async getStats() {
    const [rows] = await db.execute(`
      SELECT
        COUNT(*) as total_skus,
        SUM(quantity) as total_quantity,
        COUNT(DISTINCT article_no) as total_articles
      FROM inventory
    `);
    return rows[0];
  }
}

module.exports = Inventory;
