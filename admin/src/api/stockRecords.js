import request from './request'

/**
 * 获取出入库记录列表（分页）
 */
export function getStockRecordsList(params) {
  return request({
    url: '/stock-records/list',
    method: 'get',
    params,
    skipError: true  // 有模拟数据降级，静默处理错误
  })
}

/**
 * 获取出入库记录详情
 */
export function getStockRecordDetail(id) {
  return request({
    url: `/stock-records/${id}`,
    method: 'get'
  })
}

/**
 * 新增出入库记录
 */
export function createStockRecord(data) {
  return request({
    url: '/stock-records',
    method: 'post',
    data
  })
}
