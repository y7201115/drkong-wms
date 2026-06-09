const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

/**
 * POST /api/auth/login - 用户登录
 */
router.post('/login', authController.login);

/**
 * GET /api/auth/me - 获取当前用户信息
 */
router.get('/me', authController.getMe);

/**
 * POST /api/auth/change-password - 修改密码
 */
router.post('/change-password', authController.changePassword);

module.exports = router;
