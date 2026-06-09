const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const StockRecord = require('../models/StockRecord');
const Return = require('../models/Return');

/**
 * 初始化所有数据库表
 */
const initializeTables = async () => {
  console.log('正在初始化数据库表...');

  try {
    await Product.createTable();
    console.log('✓ products 表已就绪');

    await Inventory.createTable();
    console.log('✓ inventory 表已就绪');

    await StockRecord.createTable();
    console.log('✓ stock_records 表已就绪');

    await Return.createTable();
    console.log('✓ returns 表已就绪');

    console.log('数据库表初始化完成');
  } catch (error) {
    console.error('数据库表初始化失败:', error);
    throw error;
  }
};

module.exports = initializeTables;
