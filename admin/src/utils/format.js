import dayjs from 'dayjs'

/**
 * 格式化日期时间
 * @param {string|Date|number} date - 日期
 * @param {string} format - 格式
 * @returns {string}
 */
export function formatDateTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '-'
  return dayjs(date).format(format)
}

/**
 * 格式化日期
 * @param {string|Date|number} date - 日期
 * @returns {string}
 */
export function formatDate(date) {
  return formatDateTime(date, 'YYYY-MM-DD')
}

/**
 * 格式化数字（千分位）
 * @param {number} num - 数字
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0'
  return Number(num).toLocaleString('zh-CN')
}

/**
 * 格式化库存状态
 * @param {number} count - 库存数量
 * @returns {object} { text, type }
 */
export function getInventoryStatus(count) {
  if (count <= 0) {
    return { text: '缺货', type: 'danger' }
  } else if (count < 10) {
    return { text: '库存紧张', type: 'warning' }
  } else if (count < 50) {
    return { text: '正常', type: 'success' }
  } else {
    return { text: '充足', type: 'info' }
  }
}

/**
 * 格式化出入库类型
 * @param {string} type - 类型
 * @returns {object} { text, type }
 */
export function getStockType(type) {
  const map = {
    'in': { text: '入库', type: 'success' },
    'out': { text: '出库', type: 'danger' },
    'adjust': { text: '调整', type: 'warning' }
  }
  return map[type] || { text: type, type: 'info' }
}

/**
 * 格式化退件状态
 * @param {string} status - 状态
 * @returns {object} { text, type }
 */
export function getReturnStatus(status) {
  const map = {
    'pending': { text: '待处理', type: 'warning' },
    'received': { text: '已入库', type: 'success' },
    'exchanged': { text: '已换货', type: 'primary' },
    'refunded': { text: '已退款', type: 'info' }
  }
  return map[status] || { text: status, type: 'info' }
}

/**
 * 导出模拟Excel
 * @param {Array} data - 表格数据
 * @param {string} filename - 文件名
 */
export function exportToExcel(data, filename = 'export') {
  if (!data || data.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  
  // 获取表头
  const headers = Object.keys(data[0])
  const headerRow = headers.join(',')
  
  // 构建CSV内容
  const rows = data.map(row => 
    headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(',')
  )
  
  const csvContent = [headerRow, ...rows].join('\n')
  
  // 下载
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${formatDate(new Date())}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
