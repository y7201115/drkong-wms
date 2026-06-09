/**
 * 条形码解析工具
 * 
 * 支持的条码格式:
 * 1. S14A2020DM0270 → 货号=S14A2020DM, 尺码=27
 * 2. B1404559--PIK29- → 货号=B1404559, 尺码=29
 * 3. 支持半码: 如 27.5
 */

/**
 * 解析条形码，提取货号和尺码
 * @param {string} barcode - 条形码字符串
 * @returns {object} { articleNo: string, size: string, rawSize: string, isHalfSize: boolean }
 */
export function parseBarcode(barcode) {
  if (!barcode) {
    return null
  }

  const trimmed = barcode.trim()

  // 格式2: B1404559--PIK29- 或 B1404559--PIK29.5-
  const format2 = /^([A-Za-z0-9]+)--PIK(\d+(?:\.5)?)-$/.exec(trimmed)
  if (format2) {
    return {
      articleNo: format2[1],
      rawSize: format2[2],
      size: formatSize(format2[2]),
      isHalfSize: format2[2].includes('.5'),
      format: 'B'
    }
  }

  // 格式1: S14A2020DM0270 或 S14A2020DM0275(半码)
  // 规则: 货号部分 + 0/5(半码标识) + 两位数字尺码
  // 例如: S14A2020DM0270 → 货号=S14A2020DM, 0表示正码, 27是尺码, 0是后缀
  //       S14A2020DM0275 → 货号=S14A2020DM, 5表示半码, 27是尺码
  const format1 = /^([A-Za-z0-9]+?)(\d)(\d{2})(\d)$/.exec(trimmed)
  if (format1) {
    const halfIndicator = format1[2]
    const sizeNum = format1[3]
    const suffix = format1[4]
    
    // 判断半码: 如果倒数第二位前一位是5则为半码，如果是0则为正码
    const isHalf = halfIndicator === '5'
    const size = isHalf ? `${sizeNum}.5` : sizeNum

    return {
      articleNo: format1[1],
      rawSize: isHalf ? `${sizeNum}.5` : sizeNum,
      size: formatSize(size),
      isHalfSize: isHalf,
      format: 'S'
    }
  }

  // 如果都不匹配，返回原始值
  return {
    articleNo: trimmed,
    rawSize: '',
    size: '',
    isHalfSize: false,
    format: 'unknown'
  }
}

/**
 * 格式化尺码显示
 * @param {string} size - 原始尺码
 * @returns {string} - 格式化后的尺码
 */
export function formatSize(size) {
  if (!size) return ''
  // 去除前导零
  const num = parseFloat(size)
  if (isNaN(num)) return size
  return String(num)
}

/**
 * 拼接完整条形码（根据货号+尺码生成）
 * @param {string} articleNo - 货号
 * @param {string} size - 尺码
 * @param {string} format - 格式类型 'S' 或 'B'
 * @returns {string}
 */
export function generateBarcode(articleNo, size, format = 'S') {
  if (!articleNo || !size) return ''

  const isHalf = String(size).includes('.5')
  const cleanSize = String(size).replace('.5', '')
  const paddedSize = cleanSize.padStart(2, '0')

  if (format === 'B') {
    const halfIndicator = isHalf ? '5' : '0'
    return `${articleNo}${halfIndicator}${paddedSize}0`
  } else {
    // 默认 S 格式暂不支持反向生成
    return `${articleNo}--PIK${size}-`
  }
}

/**
 * 验证条形码是否合法
 * @param {string} barcode
 * @returns {boolean}
 */
export function isValidBarcode(barcode) {
  if (!barcode) return false
  const result = parseBarcode(barcode)
  return result && result.format !== 'unknown'
}
