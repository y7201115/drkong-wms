const express = require('express');
const returnController = require('../controllers/returnController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * POST /api/returns/create - 创建退件
 */
router.post('/create', returnController.create);

/**
 * GET /api/returns/list - 退件列表
 */
router.get('/list', returnController.getList);

/**
 * GET /api/returns/:id - 退件详情
 */
router.get('/:id', returnController.getDetail);

/**
 * PUT /api/returns/:id/status - 更新退件状态
 */
router.put('/:id/status', returnController.updateStatus);

module.exports = router;
