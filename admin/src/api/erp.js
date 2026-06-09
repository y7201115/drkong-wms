import request from './request'

/**
 * 获取ERP仪表盘统计数据
 */
export function getERPStats() {
  return request({ url: '/erp/stats', method: 'get' })
}

/**
 * 获取订单列表
 */
export function getOrdersList(params) {
  return request({ url: '/erp/orders', method: 'get', params })
}

/**
 * 获取订单详情
 */
export function getOrderDetail(id) {
  return request({ url: `/erp/orders/${id}`, method: 'get' })
}

/**
 * 更新订单发货状态
 */
export function updateOrderShip(data) {
  return request({ url: '/erp/orders/ship', method: 'post', data })
}

/**
 * 导入快团团订单Excel
 */
export function importOrders(formData) {
  return request({
    url: '/erp/orders/import',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 获取商品列表
 */
export function getProductsList(params) {
  return request({ url: '/erp/products', method: 'get', params })
}

/**
 * 获取物流列表
 */
export function getLogisticsList(params) {
  return request({ url: '/erp/logistics', method: 'get', params })
}

/**
 * 快团团API授权状态
 */
export function getKTTAuthStatus() {
  return request({ url: '/erp/ktt/auth', method: 'get', skipError: true })
}

/**
 * 快团团API授权
 */
export function authorizeKTT(data) {
  return request({ url: '/erp/ktt/auth', method: 'post', data })
}

/**
 * 撤销快团团API授权
 */
export function revokeKTTAuth() {
  return request({ url: '/erp/ktt/auth', method: 'delete' })
}

/**
 * 保存快团团API配置
 */
export function saveKTTConfig(data) {
  return request({ url: '/erp/ktt/config', method: 'post', data })
}

/**
 * 获取快团团API配置
 */
export function getKTTConfig() {
  return request({ url: '/erp/ktt/config', method: 'get', skipError: true })
}

/**
 * 同步快团团订单
 */
export function syncKTTOrders(params) {
  return request({ url: '/erp/ktt/orders/sync', method: 'post', data: params })
}

/**
 * 获取同步任务状态
 */
export function getSyncTaskStatus(taskId) {
  return request({ url: `/erp/ktt/sync-tasks/${taskId}`, method: 'get' })
}

/**
 * 获取同步历史记录
 */
export function getSyncHistory(params) {
  return request({ url: '/erp/ktt/sync-history', method: 'get', params, skipError: true })
}

/**
 * 保存订单同步设置
 */
export function saveSyncConfig(data) {
  return request({ url: '/erp/ktt/sync-config', method: 'post', data })
}

/**
 * 获取订单同步设置
 */
export function getSyncConfig() {
  return request({ url: '/erp/ktt/sync-config', method: 'get', skipError: true })
}

// ========== 订单 ==========

/**
 * 订单发货
 */
export function shipOrder(data) {
  return request({ url: '/erp/orders/ship', method: 'post', data })
}

/**
 * 批量发货
 */
export function batchShipOrders(data) {
  return request({ url: '/erp/orders/batch-ship', method: 'post', data })
}

/**
 * 更新卖家备注
 */
export function updateOrderRemark(data) {
  return request({ url: '/erp/orders/remark', method: 'post', data })
}

/**
 * 复制订单
 */
export function copyOrder(id) {
  return request({ url: `/erp/orders/${id}/copy`, method: 'post' })
}

/**
 * 导出订单
 */
export function exportOrders(params) {
  return request({ url: '/erp/orders/export', method: 'get', params, responseType: 'blob' })
}

/**
 * 删除订单
 */
export function deleteOrder(id) {
  return request({ url: `/erp/orders/${id}`, method: 'delete' })
}

// ========== 商品 ==========

/**
 * 创建商品
 */
export function createProduct(data) {
  return request({ url: '/erp/products', method: 'post', data })
}

/**
 * 更新商品
 */
export function updateProduct(id, data) {
  return request({ url: `/erp/products/${id}`, method: 'put', data })
}

/**
 * 删除商品
 */
export function deleteProduct(id) {
  return request({ url: `/erp/products/${id}`, method: 'delete' })
}

/**
 * 批量上架商品
 */
export function batchOnSale(ids) {
  return request({ url: '/erp/products/batch-on-sale', method: 'post', data: { ids } })
}

/**
 * 批量下架商品
 */
export function batchOffSale(ids) {
  return request({ url: '/erp/products/batch-off-sale', method: 'post', data: { ids } })
}

/**
 * 导入商品
 */
export function importProducts(formData) {
  return request({
    url: '/erp/products/import',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 上传商品图片
 */
export function uploadProductImage(formData) {
  return request({
    url: '/erp/products/image',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// ========== 售后 ==========

/**
 * 获取售后列表
 */
export function getRefundList(params) {
  return request({ url: '/erp/refunds', method: 'get', params })
}

/**
 * 创建售后
 */
export function createRefund(data) {
  return request({ url: '/erp/refunds', method: 'post', data })
}

/**
 * 审核售后
 */
export function approveRefund(id, data) {
  return request({ url: `/erp/refunds/${id}/approve`, method: 'post', data })
}

/**
 * 退款
 */
export function refundOrder(id) {
  return request({ url: `/erp/refunds/${id}/refund`, method: 'post' })
}

// ========== SKU ==========

/**
 * 获取SKU列表
 */
export function getSKUList(params) {
  return request({ url: '/erp/skus', method: 'get', params })
}

/**
 * 创建SKU
 */
export function createSKU(data) {
  return request({ url: '/erp/skus', method: 'post', data })
}

/**
 * 更新SKU
 */
export function updateSKU(id, data) {
  return request({ url: `/erp/skus/${id}`, method: 'put', data })
}

/**
 * 删除SKU
 */
export function deleteSKU(id) {
  return request({ url: `/erp/skus/${id}`, method: 'delete' })
}

/**
 * 导入SKU
 */
export function importSKUs(formData) {
  return request({
    url: '/erp/skus/import',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// ========== 物流 ==========

/**
 * 获取电子面单账号列表
 */
export function getWaybillAccounts() {
  return request({ url: '/erp/waybill-accounts', method: 'get' })
}

/**
 * 创建电子面单账号
 */
export function createWaybillAccount(data) {
  return request({ url: '/erp/waybill-accounts', method: 'post', data })
}

/**
 * 删除电子面单账号
 */
export function deleteWaybillAccount(id) {
  return request({ url: `/erp/waybill-accounts/${id}`, method: 'delete' })
}

// ========== 快递面单打印 ==========

/**
 * 保存快递面单配置
 */
export function saveWaybillConfig(data) {
  return request({ url: '/erp/waybill/config', method: 'post', data })
}

/**
 * 获取快递面单配置
 */
export function getWaybillConfig() {
  return request({ url: '/erp/waybill/config', method: 'get', skipError: true })
}

/**
 * 测试快递面单连接
 */
export function testWaybillConnection(data) {
  return request({ url: '/erp/waybill/test', method: 'post', data })
}

/**
 * 生成电子面单（单个订单）
 */
export function generateWaybill(data) {
  return request({ url: '/erp/waybill/generate', method: 'post', data })
}

/**
 * 批量生成电子面单
 */
export function batchGenerateWaybill(data) {
  return request({ url: '/erp/waybill/batch-generate', method: 'post', data })
}

/**
 * 预览电子面单
 */
export function previewWaybill(waybillId) {
  return request({ url: `/erp/waybill/${waybillId}/preview`, method: 'get' })
}

/**
 * 打印电子面单
 */
export function printWaybill(data) {
  return request({ url: '/erp/waybill/print', method: 'post', data })
}

/**
 * 批量打印电子面单
 */
export function batchPrintWaybill(data) {
  return request({ url: '/erp/waybill/batch-print', method: 'post', data })
}

/**
 * 获取面单打印记录
 */
export function getWaybillPrintRecords(params) {
  return request({ url: '/erp/waybill/print-records', method: 'get', params })
}

/**
 * 取消面单（作废电子面单）
 */
export function cancelWaybill(waybillId) {
  return request({ url: `/erp/waybill/${waybillId}/cancel`, method: 'post' })
}

/**
 * 保存打印设置
 */
export function savePrinterConfig(data) {
  return request({ url: '/erp/printer/config', method: 'post', data })
}

/**
 * 获取打印设置
 */
export function getPrinterConfig() {
  return request({ url: '/erp/printer/config', method: 'get', skipError: true })
}

/**
 * 获取支持的快递公司列表
 */
export function getExpressCompanies() {
  return request({ url: '/erp/express/companies', method: 'get', skipError: true })
}

/**
 * 获取快递公司对应的面单模板
 */
export function getWaybillTemplates(expressCode) {
  return request({ url: `/erp/express/templates/${expressCode}`, method: 'get', skipError: true })
}

// ========== 系统设置 ==========

/**
 * 保存通知设置
 */
export function saveNotifyConfig(data) {
  return request({ url: '/erp/settings/notify', method: 'post', data })
}

/**
 * 获取通知设置
 */
export function getNotifyConfig() {
  return request({ url: '/erp/settings/notify', method: 'get', skipError: true })
}

/**
 * 获取所有ERP设置
 */
export function getAllERPSettings() {
  return request({ url: '/erp/settings', method: 'get', skipError: true })
}
