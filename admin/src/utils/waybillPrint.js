/**
 * 快递面单打印工具
 * 支持 LODOP、C-Lodop、浏览器打印和 PDF 下载
 */

// 快递公司简称映射
const EXPRESS_CODE_MAP = {
  SF: 'SF', ZTO: 'ZTO', YTO: 'YTO', YUN: 'YD',
  STO: 'STO', JT: 'JTSD', EMS: 'EMS', JD: 'JD'
}

/**
 * 初始化 LODOP/C-Lodop
 * @returns {Promise<Object|null>} LODOP 对象或 null
 */
export async function initLodop() {
  if (window.LODOP) return window.LODOP

  // 尝试加载 C-Lodop
  const scripts = [
    'http://localhost:8000/CLodopfuncs.js',
    'http://localhost:18000/CLodopfuncs.js'
  ]

  for (const src of scripts) {
    try {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = src
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
      if (window.LODOP) return window.LODOP
    } catch {
      // 继续尝试下一个地址
    }
  }
  return null
}

/**
 * 检查 LODOP 是否可用
 */
export async function checkLodopReady() {
  const lodop = await initLodop()
  if (!lodop) return false
  try {
    return !!lodop.VERSION
  } catch {
    return false
  }
}

/**
 * 生成面单 HTML 内容
 */
function generateWaybillHTML(data) {
  const {
    expressCompany,
    expressCompanyCN,
    expressNo,
    receiver,
    phone,
    address,
    sender = '江博士童鞋仓库',
    senderPhone = '400-XXX-XXXX',
    items = [],
    remark = '',
    paperSize = '100x150'
  } = data

  const goodsDesc = items.map(i => `${i.name || ''}(${i.size || ''})×${i.qty || 1}`).join('\n')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: ${paperSize === '100x150' ? '100mm 150mm' : paperSize === '100x180' ? '100mm 180mm' : '100mm 210mm'}; margin: 0; }
        body {
          width: 100mm;
          font-family: 'Microsoft YaHei', 'SimHei', sans-serif;
          font-size: 12px;
          padding: 3mm;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 3mm;
          margin-bottom: 3mm;
        }
        .company-name {
          font-size: 18px;
          font-weight: bold;
          letter-spacing: 2px;
        }
        .barcode-area {
          text-align: center;
          margin: 3mm 0;
          border: 1px solid #000;
          padding: 2mm;
        }
        .barcode-lines {
          height: 12mm;
          background: repeating-linear-gradient(
            90deg,
            #000 0px, #000 1px,
            #fff 1px, #fff 3px
          );
        }
        .express-no {
          font-family: 'Courier New', monospace;
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 2px;
          margin-top: 1mm;
        }
        .section {
          border: 1px solid #000;
          padding: 2mm;
          margin-bottom: 2mm;
        }
        .section-title {
          font-weight: bold;
          font-size: 11px;
          color: #333;
          border-bottom: 1px dashed #ccc;
          padding-bottom: 1mm;
          margin-bottom: 1mm;
        }
        .info-row {
          display: flex;
          padding: 0.5mm 0;
          font-size: 12px;
        }
        .info-label {
          min-width: 16mm;
          color: #666;
          font-weight: 500;
        }
        .info-value {
          flex: 1;
          word-break: break-all;
        }
        .receiver-name {
          font-size: 16px;
          font-weight: bold;
        }
        .goods-list {
          max-height: 30mm;
          overflow: hidden;
        }
        .goods-item {
          padding: 0.5mm 0;
          border-bottom: 1px dotted #eee;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          color: #999;
          margin-top: 3mm;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${expressCompanyCN || expressCompany}</div>
      </div>

      <div class="barcode-area">
        <div class="barcode-lines"></div>
        <div class="express-no">${expressNo}</div>
      </div>

      <div class="section">
        <div class="section-title">收件信息</div>
        <div class="info-row">
          <span class="info-label">收件人:</span>
          <span class="info-value receiver-name">${receiver}</span>
        </div>
        <div class="info-row">
          <span class="info-label">电话:</span>
          <span class="info-value">${phone}</span>
        </div>
        <div class="info-row">
          <span class="info-label">地址:</span>
          <span class="info-value">${address}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">寄件信息</div>
        <div class="info-row">
          <span class="info-label">寄件人:</span>
          <span class="info-value">${sender}</span>
        </div>
        <div class="info-row">
          <span class="info-label">电话:</span>
          <span class="info-value">${senderPhone}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">商品明细</div>
        <div class="goods-list">
          ${items.map(i => `
            <div class="goods-item">
              ${i.name || '商品'} (${i.size || ''}) × ${i.qty || 1}
            </div>
          `).join('')}
        </div>
      </div>

      ${remark ? `
        <div class="section">
          <div class="section-title">备注</div>
          <div class="info-value">${remark}</div>
        </div>
      ` : ''}

      <div class="footer">
        打印时间: ${new Date().toLocaleString('zh-CN')}
      </div>
    </body>
    </html>
  `
}

/**
 * 浏览器打印面单
 */
export function browserPrint(data) {
  const html = generateWaybillHTML(data)
  const printWindow = window.open('', '_blank', 'width=400,height=600')
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}

/**
 * LODOP 打印面单
 */
export async function lodopPrint(data) {
  const lodop = await initLodop()
  if (!lodop) {
    throw new Error('LODOP/C-Lodop 未安装或未启动')
  }

  lodop.PRINT_INITA(0, 0, 100 * 10, 150 * 10, '快递面单打印')

  // 设置纸张大小
  lodop.SET_PRINT_PAGESIZE(1, 100 * 10, 150 * 10, '快递面单')

  // 公司名称
  lodop.ADD_PRINT_TEXT(10, 20, 80 * 10, 12, data.expressCompanyCN || data.expressCompany)
  lodop.SET_PRINT_STYLEA(0, 'FontSize', 18)
  lodop.SET_PRINT_STYLEA(0, 'Bold', 1)
  lodop.SET_PRINT_STYLEA(0, 'Alignment', 2)

  // 快递单号
  lodop.ADD_PRINT_TEXT(30, 10, 90 * 10, 12, data.expressNo)
  lodop.SET_PRINT_STYLEA(0, 'FontSize', 16)
  lodop.SET_PRINT_STYLEA(0, 'Bold', 1)
  lodop.SET_PRINT_STYLEA(0, 'Alignment', 2)

  // 收件人
  lodop.ADD_PRINT_TEXT(50, 10, 20 * 10, 10, '收件人:')
  lodop.ADD_PRINT_TEXT(50, 35 * 10, 55 * 10, 10, data.receiver)
  lodop.SET_PRINT_STYLEA(0, 'FontSize', 14)
  lodop.SET_PRINT_STYLEA(0, 'Bold', 1)

  // 电话
  lodop.ADD_PRINT_TEXT(65, 10, 20 * 10, 10, '电话:')
  lodop.ADD_PRINT_TEXT(65, 30 * 10, 60 * 10, 10, data.phone)

  // 地址
  lodop.ADD_PRINT_TEXT(80, 10, 20 * 10, 10, '地址:')
  lodop.ADD_PRINT_TEXT(80, 30 * 10, 60 * 10, 25, data.address)

  // 商品
  const goodsText = (data.items || []).map(i => `${i.name}(${i.size})×${i.qty || 1}`).join(', ')
  lodop.ADD_PRINT_TEXT(110, 10, 20 * 10, 10, '商品:')
  lodop.ADD_PRINT_TEXT(110, 30 * 10, 60 * 10, 20, goodsText)

  // 打印预览
  if (data.preview) {
    lodop.PREVIEW()
  } else {
    lodop.PRINT()
  }
}

/**
 * 下载面单为 PDF（通过浏览器打印到 PDF）
 */
export function downloadWaybillPDF(data) {
  browserPrint(data)
}

/**
 * 打印单个面单（自动选择打印方式）
 * @param {Object} data - 面单数据
 * @param {string} method - 打印方式: 'lodop' | 'browser' | 'pdf'
 * @param {boolean} preview - 是否预览
 */
export async function printWaybill(data, method = 'browser', preview = false) {
  const printData = { ...data, preview }

  switch (method) {
    case 'lodop':
      try {
        await lodopPrint(printData)
        return { success: true, method: 'lodop' }
      } catch (e) {
        console.warn('LODOP 打印失败，降级为浏览器打印:', e.message)
        browserPrint(printData)
        return { success: true, method: 'browser_fallback' }
      }
    case 'pdf':
      downloadWaybillPDF(printData)
      return { success: true, method: 'pdf' }
    default:
      browserPrint(printData)
      return { success: true, method: 'browser' }
  }
}

/**
 * 批量打印面单
 * @param {Array} orders - 订单列表
 * @param {string} expressCompany - 快递公司代码
 * @param {string} method - 打印方式
 */
export async function batchPrintWaybills(orders, expressCompany, method = 'browser') {
  const results = []
  for (const order of orders) {
    const data = {
      expressCompany,
      expressCompanyCN: getExpressCompanyCN(expressCompany),
      expressNo: order.expressNo,
      receiver: order.receiver,
      phone: order.phone,
      address: `${order.province}${order.city}${order.district}${order.address}`,
      items: order.items,
      remark: order.sellerRemark || ''
    }

    try {
      await printWaybill(data, method)
      results.push({ orderNo: order.orderNo, success: true, expressNo: order.expressNo })
    } catch (e) {
      results.push({ orderNo: order.orderNo, success: false, error: e.message })
    }
  }
  return results
}

/**
 * 获取快递公司中文名称
 */
function getExpressCompanyCN(code) {
  const map = {
    SF: '顺丰速运', ZTO: '中通快递', YTO: '圆通速递',
    YUN: '韵达快递', STO: '申通快递', JT: '极兔速递',
    EMS: '邮政快递', JD: '京东物流'
  }
  return map[code] || code
}

/**
 * 生成模拟快递单号
 */
export function generateExpressNo(expressCompany) {
  const prefixes = {
    SF: 'SF', ZTO: '7', YTO: 'YT', YUN: '',
    STO: '', JT: 'JT', EMS: 'E', JD: 'JD'
  }
  const prefix = prefixes[expressCompany] || ''
  const random = Math.floor(Math.random() * 1e12).toString().padStart(12, '0')
  return prefix + random
}
