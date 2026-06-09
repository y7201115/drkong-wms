const ReturnService = require('../services/returnService');
const Response = require('../utils/response');

class ReturnController {
  /**
   * 创建退件
   * POST /api/returns/create
   */
  static async create(req, res) {
    try {
      const { barcode, article_no, size, quantity, reason, remark } = req.body;

      const result = await ReturnService.create({
        barcode,
        article_no,
        size,
        quantity: parseInt(quantity),
        reason,
        operator: req.user?.username,
        remark,
      });

      return Response.success(res, result, '退件创建成功');
    } catch (error) {
      console.error('创建退件错误:', error);
      if (error.message.includes('缺少必要参数') || error.message.includes('无法解析')) {
        return Response.badRequest(res, error.message);
      }
      return Response.error(res, '创建退件失败');
    }
  }

  /**
   * 获取退件列表
   * GET /api/returns/list
   */
  static async getList(req, res) {
    try {
      const { page = 1, limit = 20, status, article_no } = req.query;

      const result = await ReturnService.getList({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        article_no,
      });

      return Response.pagination(res, result.list, result.total, page, limit);
    } catch (error) {
      console.error('获取退件列表错误:', error);
      return Response.error(res, '获取退件列表失败');
    }
  }

  /**
   * 获取退件详情
   * GET /api/returns/:id
   */
  static async getDetail(req, res) {
    try {
      const { id } = req.params;

      const result = await ReturnService.getDetail(parseInt(id));

      if (!result) {
        return Response.notFound(res, '退件记录不存在');
      }

      return Response.success(res, result);
    } catch (error) {
      console.error('获取退件详情错误:', error);
      return Response.error(res, '获取退件详情失败');
    }
  }

  /**
   * 更新退件状态
   * PUT /api/returns/:id/status
   */
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return Response.badRequest(res, '请提供状态值');
      }

      const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return Response.badRequest(res, '无效的状态值');
      }

      const result = await ReturnService.updateStatus(parseInt(id), status, req.user?.username);

      return Response.success(res, result, '状态更新成功');
    } catch (error) {
      console.error('更新退件状态错误:', error);
      if (error.message.includes('不存在')) {
        return Response.notFound(res, error.message);
      }
      return Response.error(res, '更新状态失败');
    }
  }
}

module.exports = ReturnController;
