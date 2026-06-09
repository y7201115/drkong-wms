const db = require('../config/database');

class Product {
  /**
   * 创建 SQL 建表语句
   */
  static async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        article_no VARCHAR(50) NOT NULL UNIQUE COMMENT '货号',
        name VARCHAR(200) NOT NULL COMMENT '商品名称',
        category VARCHAR(100) COMMENT '分类',
        brand VARCHAR(100) DEFAULT '江博士' COMMENT '品牌',
        color VARCHAR(50) COMMENT '颜色',
        image_url VARCHAR(500) COMMENT '图片URL',
        status TINYINT DEFAULT 1 COMMENT '状态: 1-上架, 0-下架',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_article_no (article_no),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表'
    `;
    await db.execute(sql);
  }

  static async findByArticleNo(articleNo) {
    const [rows] = await db.execute(
      'SELECT * FROM products WHERE article_no = ?',
      [articleNo]
    );
    return rows[0] || null;
  }

  static async create(data) {
    const { article_no, name, category, brand, color, image_url } = data;
    const [result] = await db.execute(
      'INSERT INTO products (article_no, name, category, brand, color, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [article_no, name, category, brand || '江博士', color, image_url]
    );
    return result.insertId;
  }

  static async list(page = 1, limit = 20, keyword = '') {
    const offset = (page - 1) * limit;
    let sql = 'SELECT * FROM products';
    let countSql = 'SELECT COUNT(*) as total FROM products';
    const params = [];

    if (keyword) {
      sql += ' WHERE article_no LIKE ? OR name LIKE ?';
      countSql += ' WHERE article_no LIKE ? OR name LIKE ?';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.execute(sql, params);
    const [countResult] = await db.execute(countSql, params.slice(0, keyword ? 2 : 0));
    return { list: rows, total: countResult[0].total };
  }
}

module.exports = Product;
