import request from './request'

/**
 * 获取库存列表（分页）
 */
export function getInventoryList(params) {
  return request({
    url: '/inventory/list',
    method: 'get',
    params
  })
}

/**
 * 获取库存详情
 */
export function getInventoryDetail(id) {
  return request({
    url: `/inventory/${id}`,
    method: 'get'
  })
}

/**
 * 调整库存
 */
export function adjustInventory(data) {
  return request({
    url: '/inventory/adjust',
    method: 'post',
    data
  })
}

/**
 * 按货号分组获取库存
 */
export function getInventoryByArticle(params) {
  return request({
    url: '/inventory/group-by-article',
    method: 'get',
    params
  })
}

/**
 * 获取库存预警列表（数量<10）
 */
export function getInventoryWarning() {
  return request({
    url: '/inventory/warning',
    method: 'get'
  })
}

/**
 * 解析条形码
 */
export function parseBarcode(barcode) {
  return request({
    url: '/barcode/parse',
    method: 'post',
    data: { barcode }
  })
}

/**
 * 批量入库
 */
export function batchInbound(data) {
  return request({
    url: '/inventory/batch-inbound',
    method: 'post',
    data
  })
}

/**
 * 批量出库
 */
export function batchOutbound(data) {
  return request({
    url: '/inventory/batch-outbound',
    method: 'post',
    data
  })
}
