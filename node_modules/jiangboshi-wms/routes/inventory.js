const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * GET /api/inventory/list - 库存列表（支持按货号分组）
 */
router.get('/list', inventoryController.getList);

/**
 * GET /api/inventory/search - 搜索库存
 */
router.get('/search', inventoryController.search);

/**
 * POST /api/inventory/inbound - 入库
 */
router.post('/inbound', inventoryController.inbound);

/**
 * POST /api/inventory/outbound - 出库
 */
router.post('/outbound', inventoryController.outbound);

/**
 * POST /api/inventory/parse-barcode - 解析条形码
 */
router.post('/parse-barcode', inventoryController.parseBarcode);

/**
 * GET /api/inventory/records - 出入库记录
 */
router.get('/records', inventoryController.getRecords);

module.exports = router;
