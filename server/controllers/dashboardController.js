const Inventory = require('../models/Inventory');
const Return = require('../models/Return');
const StockRecord = require('../models/StockRecord');
const Response = require('../utils/response');

class DashboardController {
  /**
   * 获取仪表盘统计数据
   * GET /api/dashboard/stats
   */
  static async getStats(req, res) {
    try {
      // 库存统计
      const inventoryStats = await Inventory.getStats();

      // 退件统计
      const returnStats = await Return.getStats();

      // 最近出入库记录数量
      const [recentRecords] = await StockRecord.list(1, 10, {});

      // 最近7天出入库统计
      const [recent7Days] = await require('../config/database').execute(`
        SELECT
          DATE(created_at) as date,
          SUM(CASE WHEN type = 'inbound' THEN quantity ELSE 0 END) as inbound_quantity,
          SUM(CASE WHEN type = 'outbound' THEN quantity ELSE 0 END) as outbound_quantity,
          COUNT(*) as record_count
        FROM stock_records
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      return Response.success(res, {
        inventory: {
          total_skus: inventoryStats.total_skus || 0,
          total_quantity: inventoryStats.total_quantity || 0,
          total_articles: inventoryStats.total_articles || 0,
        },
        returns: {
          total: returnStats.total || 0,
          pending: returnStats.pending || 0,
          processing: returnStats.processing || 0,
          completed: returnStats.completed || 0,
        },
        recent_records: recentRecords.list || [],
        daily_stats: recent7Days || [],
      });
    } catch (error) {
      console.error('获取仪表盘统计错误:', error);
      return Response.error(res, '获取统计数据失败');
    }
  }
}

module.exports = DashboardController;
