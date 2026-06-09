import request from './request'

// 获取操作记录列表
export function getRecords(params = {}) {
  return request.get('/api/records/list', params)
}

// 获取操作记录详情
export function getRecordDetail(id) {
  return request.get(`/api/records/detail/${id}`)
}

// 导出操作记录
export function exportRecords(params = {}) {
  return request.get('/api/records/export', params)
}
