import request from './request'

/**
 * 获取退件列表（分页）
 */
export function getReturnsList(params) {
  return request({
    url: '/returns/list',
    method: 'get',
    params
  })
}

/**
 * 获取退件详情
 */
export function getReturnDetail(id) {
  return request({
    url: `/returns/${id}`,
    method: 'get'
  })
}

/**
 * 更新退件状态
 */
export function updateReturnStatus(data) {
  return request({
    url: '/returns/status',
    method: 'put',
    data
  })
}

/**
 * 获取退件统计
 */
export function getReturnsStats(params) {
  return request({
    url: '/returns/stats',
    method: 'get',
    params,
    skipError: true
  })
}

/**
 * 创建退件（含快递单号）
 */
export function createReturn(data) {
  return request({
    url: '/returns/create',
    method: 'post',
    data
  })
}

/**
 * 更新退件详情（编辑）
 */
export function updateReturnDetail(id, data) {
  return request({
    url: `/returns/${id}`,
    method: 'put',
    data
  })
}

/**
 * 解析快递单号，识别快递公司
 */
export function detectExpressCompany(data) {
  return request({
    url: '/returns/detect-express',
    method: 'post',
    data
  })
}
