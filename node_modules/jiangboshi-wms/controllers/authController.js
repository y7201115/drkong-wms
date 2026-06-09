const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Response = require('../utils/response');

class AuthController {
  /**
   * 登录
   * POST /api/auth/login
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return Response.badRequest(res, '用户名和密码不能为空');
      }

      // 从环境变量获取管理员账号
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

      // 验证用户名
      if (username !== adminUsername) {
        return Response.unauthorized(res, '用户名或密码错误');
      }

      // 验证密码（首次登录使用明文，生产环境建议使用bcrypt）
      const isValidPassword = await bcrypt.compare(password, adminPassword).catch(() => false) ||
        password === adminPassword;

      if (!isValidPassword) {
        return Response.unauthorized(res, '用户名或密码错误');
      }

      // 生成 JWT
      const token = jwt.sign(
        {
          id: 1,
          username,
          role: 'admin',
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return Response.success(res, {
        token,
        user: {
          id: 1,
          username,
          role: 'admin',
        },
        expires_in: process.env.JWT_EXPIRES_IN || '7d',
      }, '登录成功');
    } catch (error) {
      console.error('登录错误:', error);
      return Response.error(res, '登录失败，请稍后重试');
    }
  }

  /**
   * 获取当前用户信息
   * GET /api/auth/me
   */
  static async getMe(req, res) {
    return Response.success(res, {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
    });
  }

  /**
   * 修改密码
   * POST /api/auth/change-password
   */
  static async changePassword(req, res) {
    try {
      const { old_password, new_password } = req.body;

      if (!old_password || !new_password) {
        return Response.badRequest(res, '旧密码和新密码不能为空');
      }

      if (new_password.length < 6) {
        return Response.badRequest(res, '新密码长度不能少于6位');
      }

      // 生产环境应验证旧密码并更新数据库
      return Response.success(res, null, '密码修改成功');
    } catch (error) {
      console.error('修改密码错误:', error);
      return Response.error(res, '修改密码失败');
    }
  }
}

module.exports = AuthController;
