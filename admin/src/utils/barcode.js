/**
 * 条形码解析工具
 * 江博士童鞋条形码格式示例: DRK-2024-001-28
 * 格式: 品牌前缀-年份-货号-尺码
 */

/**
 * 解析条形码
 * @param {string} barcode - 条形码字符串
 * @returns {object|null} 解析结果 { brand, year, articleNo, size }
 */
export function parseBarcode(barcode) {
  if (!barcode) return null
  
  const patterns = [
    // DRK-2024-001-28
    /^(?<brand>[A-Z]+)-(?<year>\d{4})-(?<articleNo>\d{3})-(?<size>\d+)$/,
    // 2024001028
    /^(?<year>\d{4})(?<articleNo>\d{3})(?<size>\d{2})$/
  ]
  
  for (const pattern of patterns) {
    const match = barcode.toUpperCase().match(pattern)
    if (match && match.groups) {
      return {
        brand: match.groups.brand || 'DRK',
        year: match.groups.year,
        articleNo: match.groups.articleNo,
        size: match.groups.size
      }
    }
  }
  
  return null
}

/**
 * 从货号提取基础信息
 * @param {string} articleNo - 货号
 * @returns {object} 货号信息
 */
export function parseArticleNo(articleNo) {
  if (!articleNo) return { articleNo: '', category: '', color: '' }
  
  // 假设货号格式: 类别+颜色编号 (如: 1A001)
  const categoryMap = {
    '1': '运动鞋',
    '2': '休闲鞋',
    '3': '凉鞋',
    '4': '靴子',
    '5': '拖鞋'
  }
  
  const category = categoryMap[articleNo.charAt(0)] || '未知'
  
  return {
    articleNo,
    category,
    color: articleNo.slice(1)
  }
}

/**
 * 生成条形码
 * @param {object} params - 参数
 * @returns {string} 条形码
 */
export function generateBarcode({ brand = 'DRK', year, articleNo, size }) {
  const currentYear = year || new Date().getFullYear()
  return `${brand}-${currentYear}-${String(articleNo).padStart(3, '0')}-${size}`
}
