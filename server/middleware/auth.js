const jwt = require('jsonwebtoken');
const Response = require('../utils/response');

/**
 * JWT 认证中间件
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.unauthorized(res, '请提供有效的认证令牌');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return Response.unauthorized(res, '认证令牌已过期，请重新登录');
    }
    if (error.name === 'JsonWebTokenError') {
      return Response.unauthorized(res, '无效的认证令牌');
    }
    return Response.error(res, '认证失败', 500);
  }
};

/**
 * 可选认证中间件（不强制要求登录）
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
    }
  } catch (error) {
    // 忽略错误，允许匿名访问
  }

  next();
};

module.exports = { authMiddleware, optionalAuth };
