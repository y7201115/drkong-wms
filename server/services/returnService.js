const db = require('../config/database');
const Return = require('../models/Return');
const Inventory = require('../models/Inventory');
const StockRecord = require('../models/StockRecord');
const BarcodeService = require('./barcodeService');
const InventoryService = require('./inventoryService');

class ReturnService {
  /**
   * 创建退件记录
   * @param {Object} data
   * @param {string} data.barcode - 条形码（可选）
   * @param {string} data.article_no - 货号
   * @param {string} data.size - 尺码
   * @param {number} data.quantity - 数量
   * @param {string} [data.reason] - 退件原因
   * @param {string} [data.operator] - 操作人
   * @param {string} [data.remark] - 备注
   */
  static async create(data) {
    const { barcode, article_no, size, quantity, reason, operator, remark } = data;

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

    const result = await Return.create({
      article_no: finalArticleNo,
      size: finalSize,
      quantity: parseInt(quantity),
      reason,
      operator,
      remark,
    });

    return {
      ...result,
      article_no: finalArticleNo,
      size: finalSize,
      quantity: parseInt(quantity),
    };
  }

  /**
   * 更新退件状态
   * 当状态变为 completed 时，自动执行入库操作
   * @param {number} id - 退件ID
   * @param {string} status - 新状态
   * @param {string} operator - 操作人
   */
  static async updateStatus(id, status, operator) {
    const returnRecord = await Return.findById(id);
    if (!returnRecord) {
      throw new Error('退件记录不存在');
    }

    await Return.updateStatus(id, status, operator);

    // 如果状态变为 completed，自动入库
    if (status === 'completed') {
      await InventoryService.inbound({
        article_no: returnRecord.article_no,
        size: returnRecord.size,
        quantity: returnRecord.quantity,
        operator,
        remark: `退件入库 - 退件单号: ${returnRecord.return_no}`,
      });
    }

    return await Return.findById(id);
  }

  /**
   * 获取退件列表
   */
  static async getList(params = {}) {
    const { page = 1, limit = 20, status, article_no } = params;
    return Return.list(page, limit, { status, article_no });
  }

  /**
   * 获取退件详情
   */
  static async getDetail(id) {
    return Return.findById(id);
  }

  /**
   * 获取退件统计
   */
  static async getStats() {
    return Return.getStats();
  }
}

module.exports = ReturnService;
