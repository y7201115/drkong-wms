import request from './request'

// 扫码入库
export function inbound(data) {
  return request.post('/api/inventory/inbound', data)
}

// 扫码出库
export function outbound(data) {
  return request.post('/api/inventory/outbound', data)
}

// 查询库存（按货号+尺码）
export function queryStock(articleNo, size) {
  return request.get(`/api/inventory/stock`, { articleNo, size })
}

// 搜索库存（按货号）
export function searchInventory(articleNo, params = {}) {
  return request.get(`/api/inventory/search/${articleNo}`, params)
}

// 获取库存列表（分页）
export function getInventoryList(params = {}) {
  return request.get('/api/inventory/list', params)
}

// 获取库存分组列表
export function getInventoryGroupList(params = {}) {
  return request.get('/api/inventory/group-list', params)
}

// 今日统计数据
export function getTodayStats() {
  return request.get('/api/inventory/today-stats')
}
