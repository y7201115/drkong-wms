const express = require('express');
const authRoutes = require('./auth');
const inventoryRoutes = require('./inventory');
const returnRoutes = require('./returns');
const DashboardController = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 公开路由（无需认证）
router.use('/auth', authRoutes);

// 需要认证的路由
router.use('/inventory', inventoryRoutes);
router.use('/returns', returnRoutes);

/**
 * GET /api/dashboard/stats - 仪表盘统计
 */
router.get('/dashboard/stats', authMiddleware, DashboardController.getStats);

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
