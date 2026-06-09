const InventoryService = require('../services/inventoryService');
const BarcodeService = require('../services/barcodeService');
const Response = require('../utils/response');

class InventoryController {
  /**
   * 获取库存列表
   * GET /api/inventory/list
   */
  static async getList(req, res) {
    try {
      const { page = 1, limit = 20, keyword = '', group_by = 'article' } = req.query;

      const result = await InventoryService.getList({
        page: parseInt(page),
        limit: parseInt(limit),
        keyword,
        group_by,
      });

      return Response.pagination(res, result.list, result.total, page, limit);
    } catch (error) {
      console.error('获取库存列表错误:', error);
      return Response.error(res, '获取库存列表失败');
    }
  }

  /**
   * 入库
   * POST /api/inventory/inbound
   */
  static async inbound(req, res) {
    try {
      const { barcode, article_no, size, quantity, warehouse, remark } = req.body;

      const result = await InventoryService.inbound({
        barcode,
        article_no,
        size,
        quantity: parseInt(quantity),
        warehouse,
        operator: req.user?.username,
        remark,
      });

      return Response.success(res, result, '入库成功');
    } catch (error) {
      console.error('入库错误:', error);
      if (error.message.includes('缺少必要参数') || error.message.includes('无法解析')) {
        return Response.badRequest(res, error.message);
      }
      return Response.error(res, '入库失败');
    }
  }

  /**
   * 出库
   * POST /api/inventory/outbound
   */
  static async outbound(req, res) {
    try {
      const { barcode, article_no, size, quantity, warehouse, remark } = req.body;

      const result = await InventoryService.outbound({
        barcode,
        article_no,
        size,
        quantity: parseInt(quantity),
        warehouse,
        operator: req.user?.username,
        remark,
      });

      return Response.success(res, result, '出库成功');
    } catch (error) {
      console.error('出库错误:', error);
      if (error.message.includes('缺少必要参数') ||
          error.message.includes('无法解析') ||
          error.message.includes('库存不存在') ||
          error.message.includes('库存不足')) {
        return Response.badRequest(res, error.message);
      }
      return Response.error(res, '出库失败');
    }
  }

  /**
   * 搜索库存
   * GET /api/inventory/search
   */
  static async search(req, res) {
    try {
      const { keyword = '', page = 1, limit = 20 } = req.query;

      if (!keyword) {
        return Response.badRequest(res, '请输入搜索关键词');
      }

      const result = await InventoryService.search(keyword, parseInt(page), parseInt(limit));

      return Response.pagination(res, result.list, result.total, page, limit);
    } catch (error) {
      console.error('搜索库存错误:', error);
      return Response.error(res, '搜索失败');
    }
  }

  /**
   * 解析条形码
   * POST /api/inventory/parse-barcode
   */
  static async parseBarcode(req, res) {
    try {
      const { barcode } = req.body;

      if (!barcode) {
        return Response.badRequest(res, '请提供条形码');
      }

      const result = BarcodeService.parse(barcode);

      if (!result) {
        return Response.badRequest(res, `无法解析条形码: ${barcode}`);
      }

      return Response.success(res, result, '条形码解析成功');
    } catch (error) {
      console.error('解析条形码错误:', error);
      return Response.error(res, '解析失败');
    }
  }

  /**
   * 获取出入库记录
   * GET /api/inventory/records
   */
  static async getRecords(req, res) {
    try {
      const { page = 1, limit = 20, type, article_no, start_date, end_date } = req.query;

      const StockRecord = require('../models/StockRecord');
      const result = await StockRecord.list(parseInt(page), parseInt(limit), {
        type,
        article_no,
        start_date,
        end_date,
      });

      return Response.pagination(res, result.list, result.total, page, limit);
    } catch (error) {
      console.error('获取出入库记录错误:', error);
      return Response.error(res, '获取记录失败');
    }
  }
}

module.exports = InventoryController;
