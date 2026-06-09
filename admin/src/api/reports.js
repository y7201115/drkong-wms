import request from './request'

/**
 * 获取库存报表数据
 */
export function getInventoryReport(params) {
  return request({
    url: '/reports/inventory',
    method: 'get',
    params,
    skipError: true  // 有模拟数据降级，静默处理错误
  })
}

/**
 * 获取出入库趋势报表
 */
export function getStockTrendReport(params) {
  return request({
    url: '/reports/stock-trend',
    method: 'get',
    params,
    skipError: true  // 有模拟数据降级，静默处理错误
  })
}

/**
 * 获取退件报表数据
 */
export function getReturnsReport(params) {
  return request({
    url: '/reports/returns',
    method: 'get',
    params,
    skipError: true  // 有模拟数据降级，静默处理错误
  })
}

/**
 * 获取退件原因分析
 */
export function getReturnsReasonAnalysis(params) {
  return request({
    url: '/reports/returns-reason',
    method: 'get',
    params,
    skipError: true  // 有模拟数据降级，静默处理错误
  })
}

/**
 * 获取高频退件排行
 */
export function getTopReturnArticles(params) {
  return request({
    url: '/reports/top-return-articles',
    method: 'get',
    params,
    skipError: true  // 有模拟数据降级，静默处理错误
  })
}
