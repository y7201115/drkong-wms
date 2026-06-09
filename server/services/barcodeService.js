/**
 * 条形码解析服务
 * 支持两种条形码格式：
 * 格式1: S14A2020DM0270 → 货号=S14A2020DM, 尺码=27
 * 格式2: B1404559--PIK29- → 货号=B1404559, 尺码=29
 * 支持半码（如 27.5）
 */

class BarcodeService {
  /**
   * 解析条形码
   * @param {string} barcode - 条形码字符串
   * @returns {{ articleNo: string, size: string } | null}
   */
  static parse(barcode) {
    if (!barcode || typeof barcode !== 'string') {
      return null;
    }

    const trimmed = barcode.trim().toUpperCase();

    // 尝试格式1: S14A2020DM0270
    // 规则: 字母数字开头 + 0 + 2~3位数字(尺码) + 可选的末尾校验位
    // 货号部分是去除末尾尺码数字后的部分
    const result1 = this.parseFormat1(trimmed);
    if (result1) {
      return result1;
    }

    // 尝试格式2: B1404559--PIK29- 或 B1404559--PIK29.5-
    const result2 = this.parseFormat2(trimmed);
    if (result2) {
      return result2;
    }

    return null;
  }

  /**
   * 解析格式1: S14A2020DM0270
   * 结构: [货号部分][0][尺码][可选后缀]
   * 示例: S14A2020DM0270 → 货号=S14A2020DM, 尺码=27
   * 示例: S14A2020DM02750 → 货号=S14A2020DM, 尺码=27.5 (半码)
   */
  static parseFormat1(barcode) {
    // 匹配模式: 以大写字母开头，中间有字母数字，然后跟着0+尺码数字
    // 关键特征: 货号后面紧跟 0，然后是2~3位尺码数字
    // 尺码可能是 23~37 之间的整数或半码
    // 格式: [前缀][0][尺码NN或NN5][可选后缀]

    // 尝试匹配: 找到最后一个 0 后面跟着 2~3 位数字的模式
    // 匹配 0 + 两位数字(23-37) + 可选的5(半码) + 可选的一位后缀
    const regex1 = /^([A-Z0-9]+?)0(2[3-9]|3[0-7])(5)?([A-Z0-9]?)$/;
    const match = barcode.match(regex1);

    if (match) {
      const [, articleNoPrefix, sizeInt, halfSize, suffix] = match;

      // 验证: 货号部分应该以字母结尾（确保不是货号的一部分被错误截断）
      if (!/[A-Z]$/.test(articleNoPrefix)) {
        return null;
      }

      const size = halfSize ? `${sizeInt}.5` : sizeInt;

      return {
        articleNo: articleNoPrefix,
        size,
        format: 'format1',
      };
    }

    return null;
  }

  /**
   * 解析格式2: B1404559--PIK29-
   * 结构: [货号]--[颜色/批次][尺码][后缀]
   * 示例: B1404559--PIK29- → 货号=B1404559, 尺码=29
   * 示例: B1404559--PIK29.5- → 货号=B1404559, 尺码=29.5
   */
  static parseFormat2(barcode) {
    // 匹配模式: [货号]--[任意字符][尺码][可选后缀]
    // 货号: 以大写字母开头，后跟数字
    // 分隔符: --
    // 中间部分: 字母（如PIK、RED等颜色代码）
    // 尺码: 2~3位数字，可能带.5
    // 后缀: 可能是 - 或其他字符

    const regex2 = /^([A-Z][0-9]+)--([A-Z]*)(2[3-9]|3[0-7])(\.5)?([-A-Z0-9]*)$/;
    const match = barcode.match(regex2);

    if (match) {
      const [, articleNo, , sizeInt, halfDecimal, suffix] = match;

      const size = halfDecimal ? `${sizeInt}${halfDecimal}` : sizeInt;

      return {
        articleNo,
        size,
        format: 'format2',
      };
    }

    return null;
  }

  /**
   * 批量解析条形码
   * @param {string[]} barcodes - 条形码数组
   * @returns {Array<{ barcode: string, articleNo: string | null, size: string | null, success: boolean }>}
   */
  static parseBatch(barcodes) {
    return barcodes.map((barcode) => {
      const result = this.parse(barcode);
      return {
        barcode,
        articleNo: result?.articleNo || null,
        size: result?.size || null,
        success: result !== null,
      };
    });
  }

  /**
   * 生成条形码（格式1）
   * @param {string} articleNo - 货号
   * @param {string} size - 尺码
   * @param {string} [suffix='0'] - 后缀
   * @returns {string}
   */
  static generateFormat1(articleNo, size, suffix = '0') {
    const sizeStr = size.toString().replace('.', '');
    return `${articleNo}0${sizeStr}${suffix}`;
  }

  /**
   * 生成条形码（格式2）
   * @param {string} articleNo - 货号
   * @param {string} colorCode - 颜色代码（如 PIK、RED）
   * @param {string} size - 尺码
   * @param {string} [suffix='-'] - 后缀
   * @returns {string}
   */
  static generateFormat2(articleNo, colorCode, size, suffix = '-') {
    return `${articleNo}--${colorCode}${size}${suffix}`;
  }
}

module.exports = BarcodeService;
