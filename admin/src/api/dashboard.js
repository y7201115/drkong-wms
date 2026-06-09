import request from './request'

/**
 * 获取仪表盘统计数据
 */
export function getDashboardStats() {
  return request({ url: '/dashboard/stats', method: 'get' })
}

/**
 * 获取退件趋势数据
 */
export function getReturnsTrend(params) {
  return request({ url: '/dashboard/returns-trend', method: 'get', params, skipError: true })
}

/**
 * 获取最近出入库记录
 */
export function getRecentStockRecords(params) {
  return request({ url: '/dashboard/recent-records', method: 'get', params, skipError: true })
}

/**
 * 获取库存预警数量
 */
export function getWarningCount() {
  return request({ url: '/dashboard/warning-count', method: 'get', skipError: true })
}
