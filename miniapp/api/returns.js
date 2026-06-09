import request from './request'

// 提交退件
export function submitReturn(data) {
  return request.post('/api/returns/submit', data)
}

// 扫码查询退件信息
export function queryReturnInfo(barcode) {
  return request.get('/api/returns/info', { barcode })
}

// 获取退件记录列表
export function getReturnList(params = {}) {
  return request.get('/api/returns/list', params)
}

// 获取退件原因字典
export function getReturnReasons() {
  return request.get('/api/returns/reasons', { needToken: false })
}
