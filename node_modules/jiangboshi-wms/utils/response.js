class Response {
  static success(res, data = null, message = 'success', code = 200) {
    return res.status(code).json({
      code,
      message,
      data,
    });
  }

  static error(res, message = '服务器内部错误', code = 500, data = null) {
    return res.status(code).json({
      code,
      message,
      data,
    });
  }

  static badRequest(res, message = '请求参数错误', data = null) {
    return this.error(res, message, 400, data);
  }

  static unauthorized(res, message = '未授权', data = null) {
    return this.error(res, message, 401, data);
  }

  static forbidden(res, message = '禁止访问', data = null) {
    return this.error(res, message, 403, data);
  }

  static notFound(res, message = '资源不存在', data = null) {
    return this.error(res, message, 404, data);
  }

  static pagination(res, list, total, page = 1, limit = 20, message = 'success') {
    return this.success(res, {
      list,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(total / limit),
    }, message);
  }
}

module.exports = Response;
