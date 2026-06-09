/**
 * LODOP / C-Lodop 打印封装
 * 
 * 使用步骤：
 * 1. 下载安装 C-Lodop: http://www.c-lodop.com/download.html
 * 2. 安装后本地服务地址: http://localhost:8000/CLodopfuncs.js
 * 3. 在 index.html 中引入 C-Lodop 脚本
 * 4. 调用 LodopAPI.printWaybill() 打印面单
 */

// 获取 LODOP 对象
function getLodop() {
  return new Promise((resolve, reject) => {
    // 尝试获取已安装的 LODOP
    if (window.getLodop) {
      const lodop = window.getLodop()
      if (lodop) {
        resolve(lodop)
        return
      }
    }

    // 尝试 C-Lodop 云端打印
    const script = document.createElement('script')
    script.src = 'http://localhost:8000/CLodopfuncs.js'
    script.onload = () => {
      if (window.getLodop) {
        const lodop = window.getLodop()
        if (lodop) {
          resolve(lodop)
          return
        }
      }
      reject(new Error('未检测到 C-Lodop 服务，请先安装 C-Lodop'))
    }
    script.onerror = () => {
      reject(new Error('无法连接 C-Lodop 服务，请确认已安装并启动'))
    }
    document.head.appendChild(script)
  })
}

// 打印快递面单
export function printWaybill(options) {
  return getLodop().then(LODOP => {
    LODOP.PRINT_INITA(0, 0, 1000, 1500, '快递面单打印') // 100mm x 150mm

    // 条形码
    if (options.barcode) {
      LODOP.ADD_PRINT_BARCODE(30, 20, 200, 40, 'Code128B', options.barcode)
      LODOP.SET_PRINT_STYLEA(0, 'FontSize', 12)
      LODOP.SET_PRINT_STYLEA(0, 'Bold', 1)
    }

    // 快递公司名称
    if (options.companyName) {
      LODOP.ADD_PRINT_TEXT(80, 20, 300, 30, options.companyName)
      LODOP.SET_PRINT_STYLEA(0, 'FontSize', 16)
      LODOP.SET_PRINT_STYLEA(0, 'Bold', 1)
    }

    // 收件人信息
    if (options.receiver) {
      LODOP.ADD_PRINT_TEXT(120, 20, 200, 20, `收件人: ${options.receiver}`)
    }
    if (options.phone) {
      LODOP.ADD_PRINT_TEXT(140, 20, 200, 20, `电话: ${options.phone}`)
    }
    if (options.address) {
      LODOP.ADD_PRINT_TEXT(160, 20, 400, 40, `地址: ${options.address}`)
      LODOP.SET_PRINT_STYLEA(0, 'FontSize', 11)
    }

    // 商品信息
    if (options.items) {
      const itemText = options.items.map(i => `${i.name}(${i.size || ''})`).join(', ')
      LODOP.ADD_PRINT_TEXT(210, 20, 400, 30, `商品: ${itemText}`)
      LODOP.SET_PRINT_STYLEA(0, 'FontSize', 11)
    }

    // 运单号
    if (options.expressNo) {
      LODOP.ADD_PRINT_TEXT(250, 20, 300, 25, `运单号: ${options.expressNo}`)
      LODOP.SET_PRINT_STYLEA(0, 'FontSize', 14)
      LODOP.SET_PRINT_STYLEA(0, 'Bold', 1)
    }

    // 备注
    if (options.remark) {
      LODOP.ADD_PRINT_TEXT(280, 20, 400, 30, `备注: ${options.remark}`)
    }

    // 预览或直接打印
    if (options.preview) {
      LODOP.PREVIEW()
    } else {
      LODOP.PRINT()
    }
  })
}

// 批量打印面单
export function printWaybillsBatch(waybills) {
  return getLodop().then(LODOP => {
    LODOP.PRINT_INITA(0, 0, 1000, 1500, '批量快递面单打印')

    waybills.forEach((wb, index) => {
      if (index > 0) {
        LODOP.NewPageA() // 分页
      }

      if (wb.barcode) {
        LODOP.ADD_PRINT_BARCODE(30, 20, 200, 40, 'Code128B', wb.expressNo || wb.barcode)
      }
      if (wb.companyName) {
        LODOP.ADD_PRINT_TEXT(80, 20, 300, 30, wb.companyName)
        LODOP.SET_PRINT_STYLEA(0, 'FontSize', 16)
        LODOP.SET_PRINT_STYLEA(0, 'Bold', 1)
      }
      if (wb.receiver) {
        LODOP.ADD_PRINT_TEXT(120, 20, 200, 20, `收件人: ${wb.receiver}`)
      }
      if (wb.phone) {
        LODOP.ADD_PRINT_TEXT(140, 20, 200, 20, `电话: ${wb.phone}`)
      }
      if (wb.address) {
        LODOP.ADD_PRINT_TEXT(160, 20, 400, 40, `地址: ${wb.address}`)
        LODOP.SET_PRINT_STYLEA(0, 'FontSize', 11)
      }
      if (wb.items) {
        const itemText = wb.items.map(i => `${i.name}(${i.size || ''})`).join(', ')
        LODOP.ADD_PRINT_TEXT(210, 20, 400, 30, `商品: ${itemText}`)
        LODOP.SET_PRINT_STYLEA(0, 'FontSize', 11)
      }
      if (wb.expressNo) {
        LODOP.ADD_PRINT_TEXT(250, 20, 300, 25, `运单号: ${wb.expressNo}`)
        LODOP.SET_PRINT_STYLEA(0, 'FontSize', 14)
        LODOP.SET_PRINT_STYLEA(0, 'Bold', 1)
      }
    })

    if (waybills.length === 1 && waybills[0].preview) {
      LODOP.PREVIEW()
    } else {
      LODOP.PRINT()
    }
  })
}

// 检测是否已安装
export function checkLodopInstalled() {
  return new Promise(resolve => {
    if (window.getLodop && window.getLodop()) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'http://localhost:8000/CLodopfuncs.js'
    script.onload = () => {
      resolve(!!(window.getLodop && window.getLodop()))
    }
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })
}
