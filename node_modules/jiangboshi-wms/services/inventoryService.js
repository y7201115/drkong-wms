const db = require('../config/database');
const Inventory = require('../models/Inventory');
const StockRecord = require('../models/StockRecord');
const Product = require('../models/Product');
const BarcodeService = require('./barcodeService');
const redisClient = require('../config/redis');

class InventoryService {
  /**
   * 入库操作
   * @param {Object} data
   * @param {string} data.barcode - 条形码（可选，优先解析）
   * @param {string} data.article_no - 货号
   * @param {string} data.size - 尺码
   * @param {number} data.quantity - 数量
   * @param {string} [data.warehouse] - 仓库
   * @param {string} [data.operator] - 操作人
   * @param {string} [data.remark] - 备注
   */
  static async inbound(data) {
    const { barcode, article_no, size, quantity, warehouse = '默认仓库', operator, remark } = data;

    // 如果提供了条形码，优先解析
    let finalArticleNo = article_no;
    let finalSize = size;

    if (barcode) {
      const parsed = BarcodeService.parse(barcode);
      if (!parsed) {
        throw new Error(`无法解析条形码: ${barcode}`);
      }
      finalArticleNo = parsed.articleNo;
      finalSize = parsed.size;
    }

    if (!finalArticleNo || !finalSize || !quantity) {
      throw new Error('缺少必要参数: 货号/尺码/数量');
    }

    return await db.transaction(async (conn) => {
      // 查找或创建商品
      let product = await Product.findByArticleNo(finalArticleNo);
      if (!product) {
        const productId = await Product.create({
          article_no: finalArticleNo,
          name: finalArticleNo,
        });
        product = await Product.findByArticleNo(finalArticleNo);
      }

      // 查找或创建库存记录
      let inventory = await Inventory.findByArticleAndSize(finalArticleNo, finalSize, warehouse);

      let beforeQty = 0;
      let afterQty = 0;

      if (inventory) {
        beforeQty = inventory.quantity;
        afterQty = beforeQty + parseInt(quantity);
        await Inventory.incrementQuantity(inventory.id, parseInt(quantity));
      } else {
        const invId = await Inventory.create({
          product_id: product.id,
          article_no: finalArticleNo,
          size: finalSize,
          quantity: parseInt(quantity),
          warehouse,
        });
        inventory = { id: invId, quantity: 0 };
        beforeQty = 0;
        afterQty = parseInt(quantity);
      }

      // 创建出入库记录
      await StockRecord.create({
        inventory_id: inventory.id,
        article_no: finalArticleNo,
        size: finalSize,
        type: 'inbound',
        quantity: parseInt(quantity),
        before_quantity: beforeQty,
        after_quantity: afterQty,
        operator,
        remark,
      });

      // 清除相关缓存
      await this.invalidateCache(finalArticleNo);

      return {
        article_no: finalArticleNo,
        size: finalSize,
        before_quantity: beforeQty,
        quantity: parseInt(quantity),
        after_quantity: afterQty,
      };
    });
  }

  /**
   * 出库操作
   * @param {Object} data
   * @param {string} data.barcode - 条形码（可选）
   * @param {string} data.article_no - 货号
   * @param {string} data.size - 尺码
   * @param {number} data.quantity - 数量
   * @param {string} [data.warehouse] - 仓库
   * @param {string} [data.operator] - 操作人
   * @param {string} [data.remark] - 备注
   */
  static async outbound(data) {
    const { barcode, article_no, size, quantity, warehouse = '默认仓库', operator, remark } = data;

    let finalArticleNo = article_no;
    let finalSize = size;

    if (barcode) {
      const parsed = BarcodeService.parse(barcode);
      if (!parsed) {
        throw new Error(`无法解析条形码: ${barcode}`);
      }
      finalArticleNo = parsed.articleNo;
      finalSize = parsed.size;
    }

    if (!finalArticleNo || !finalSize || !quantity) {
      throw new Error('缺少必要参数: 货号/尺码/数量');
    }

    return await db.transaction(async (conn) => {
      // 查找库存
      const inventory = await Inventory.findByArticleAndSize(finalArticleNo, finalSize, warehouse);
      if (!inventory) {
        throw new Error(`库存不存在: ${finalArticleNo} 尺码 ${finalSize}`);
      }

      if (inventory.quantity < parseInt(quantity)) {
        throw new Error(`库存不足: 当前 ${inventory.quantity}, 需要 ${quantity}`);
      }

      const beforeQty = inventory.quantity;
      const afterQty = beforeQty - parseInt(quantity);

      // 扣减库存
      await Inventory.decrementQuantity(inventory.id, parseInt(quantity));

      // 创建出入库记录
      await StockRecord.create({
        inventory_id: inventory.id,
        article_no: finalArticleNo,
        size: finalSize,
        type: 'outbound',
        quantity: parseInt(quantity),
        before_quantity: beforeQty,
        after_quantity: afterQty,
        operator,
        remark,
      });

      // 清除缓存
      await this.invalidateCache(finalArticleNo);

      return {
        article_no: finalArticleNo,
        size: finalSize,
        before_quantity: beforeQty,
        quantity: parseInt(quantity),
        after_quantity: afterQty,
      };
    });
  }

  /**
   * 获取库存列表（按货号分组）
   * @param {Object} params
   * @param {number} params.page
   * @param {number} params.limit
   * @param {string} params.keyword
   * @param {string} params.group_by - 'article' 或 'sku'
   */
  static async getList(params = {}) {
    const { page = 1, limit = 20, keyword = '', group_by = 'article' } = params;

    if (group_by === 'article') {
      return this.getListGroupedByArticle(page, limit, keyword);
    }

    return Inventory.list(page, limit, keyword);
  }

  /**
   * 按货号分组的库存列表
   */
  static async getListGroupedByArticle(page = 1, limit = 20, keyword = '') {
    const offset = (page - 1) * limit;

    let sql = `
      SELECT
        i.article_no,
        p.name as product_name,
        p.category,
        p.image_url,
        GROUP_CONCAT(CONCAT(i.size, ':', i.quantity) ORDER BY i.size ASC SEPARATOR ',') as size_stock,
        SUM(i.quantity) as total_quantity,
        COUNT(DISTINCT i.size) as size_count
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
    `;

    let countSql = 'SELECT COUNT(DISTINCT article_no) as total FROM inventory';
    const params = [];

    if (keyword) {
      sql += ' WHERE i.article_no LIKE ?';
      countSql += ' WHERE article_no LIKE ?';
      params.push(`%${keyword}%`);
    }

    sql += ' GROUP BY i.article_no, p.name, p.category, p.image_url';
    sql += ' ORDER BY i.article_no ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await db.execute(sql, params);

    // 解析 size_stock 字段
    const list = rows.map((row) => ({
      article_no: row.article_no,
      product_name: row.product_name,
      category: row.category,
      image_url: row.image_url,
      total_quantity: row.total_quantity,
      size_count: row.size_count,
      sizes: row.size_stock
        ? row.size_stock.split(',').map((item) => {
            const [size, stock] = item.split(':');
            return { size, stock: parseInt(stock) };
          })
        : [],
    }));

    const [countResult] = await db.execute(countSql, params.slice(0, keyword ? 1 : 0));

    return { list, total: countResult[0].total };
  }

  /**
   * 搜索库存
   */
  static async search(keyword, page = 1, limit = 20) {
    return this.getList({ page, limit, keyword });
  }

  /**
   * 清除缓存
   */
  static async invalidateCache(articleNo) {
    if (articleNo) {
      await redisClient.del(`inventory:${articleNo}`).catch(() => {});
    }
    await redisClient.del('inventory:list').catch(() => {});
    await redisClient.del('dashboard:stats').catch(() => {});
  }
}

module.exports = InventoryService;
