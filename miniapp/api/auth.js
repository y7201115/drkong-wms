import request from './request'

// 登录
export function login(data) {
  return request.post('/api/auth/login', data, { needToken: false })
}

// 获取用户信息
export function getUserInfo() {
  return request.get('/api/auth/userinfo')
}

// 退出登录
export function logout() {
  return request.post('/api/auth/logout')
}

// 刷新 token
export function refreshToken() {
  return request.post('/api/auth/refresh', {}, { needToken: false })
}
