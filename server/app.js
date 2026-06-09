require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const Response = require('./utils/response');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== 内存存储（演示模式） ====================

const isDev = process.env.NODE_ENV === 'development';
const DB_AVAILABLE = false; // 设为 true 启用真实数据库

// 模拟用户数据
const mockUsers = [
  { id: 1, username: 'admin', password: bcrypt.hashSync('admin123', 10), name: '管理员', role: 'admin' },
];

// 模拟商品库存数据
const mockInventory = [
  { item_code: 'S14A2020DM', size: 27, quantity: 15, updated_at: new Date().toISOString() },
  { item_code: 'S14A2020DM', size: 28, quantity: 12, updated_at: new Date().toISOString() },
  { item_code: 'S14A2020DM', size: 29, quantity: 8, updated_at: new Date().toISOString() },
  { item_code: 'S14A2020DM', size: 30, quantity: 20, updated_at: new Date().toISOString() },
  { item_code: 'S14A2020DM', size: 31, quantity: 5, updated_at: new Date().toISOString() },
  { item_code: 'B1404559', size: 26, quantity: 10, updated_at: new Date().toISOString() },
  { item_code: 'B1404559', size: 27, quantity: 18, updated_at: new Date().toISOString() },
  { item_code: 'B1404559', size: 28, quantity: 3, updated_at: new Date().toISOString() },
  { item_code: 'B1404559', size: 29, quantity: 14, updated_at: new Date().toISOString() },
  { item_code: 'B1404559', size: 30, quantity: 22, updated_at: new Date().toISOString() },
];

// 模拟出入库记录
const mockStockRecords = [
  { id: 1, type: 'inbound', barcode: 'S14A2020DM0270', item_code: 'S14A2020DM', size: 27, quantity: 10, operator: 'admin', remark: '新品入库', created_at: new Date().toISOString() },
  { id: 2, type: 'outbound', barcode: 'B1404559--PIK29-', item_code: 'B1404559', size: 29, quantity: 5, operator: 'admin', remark: '订单出库', created_at: new Date().toISOString() },
  { id: 3, type: 'inbound', barcode: 'S14A2020DM0280', item_code: 'S14A2020DM', size: 28, quantity: 8, operator: 'admin', remark: '补货入库', created_at: new Date().toISOString() },
];

// 模拟退件记录
const mockReturns = [
  { id: 1, express_no: 'SF1234567890123', express_company: 'SF', order_no: '', barcode: 'B1404559--PIK27-', item_code: 'B1404559', size: 27, return_reason: '尺码不合', remark: '', status: 'pending', created_at: new Date().toISOString() },
  { id: 2, express_no: 'YT887275459207', express_company: 'YTO', order_no: '', barcode: 'S14A2020DM0290', item_code: 'S14A2020DM', size: 29, return_reason: '质量问题', remark: '', status: 'processed', created_at: new Date(Date.now() - 86400000).toISOString() },
];

// ==================== 中间件 ====================

app.use(helmet());

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('dev'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { code: 429, message: '请求过于频繁，请稍后再试' },
});
app.use('/api/', limiter);

// ==================== JWT 认证中间件 ====================

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: '登录已过期' });
  }
}

// ==================== 路由 ====================

// --- 认证 ---
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ code: 400, message: '请输入用户名和密码' });
  }
  
  const user = mockUsers.find(u => u.username === username);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ code: 401, message: '用户名或密码错误' });
  }
  
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  
  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role }
    }
  });
});

app.get('/api/auth/info', authMiddleware, (req, res) => {
  res.json({
    code: 200,
    data: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    }
  });
});

// --- 库存管理 ---

app.get('/api/inventory/list', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20, item_code, size } = req.query;
  
  let data = [...mockInventory];
  
  if (item_code) {
    data = data.filter(item => item.item_code.includes(item_code));
  }
  if (size) {
    data = data.filter(item => item.size == size);
  }
  
  const total = data.length;
  const start = (page - 1) * pageSize;
  const list = data.slice(start, start + parseInt(pageSize));
  
  // 按货号分组
  const grouped = {};
  list.forEach(item => {
    if (!grouped[item.item_code]) {
      grouped[item.item_code] = { item_code: item.item_code, sizes: [] };
    }
    grouped[item.item_code].sizes.push({ size: item.size, quantity: item.quantity });
  });
  
  res.json({
    code: 200,
    data: {
      list: Object.values(grouped),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  });
});

app.get('/api/inventory/search', authMiddleware, (req, res) => {
  const { keyword } = req.query;
  
  let data = [...mockInventory];
  if (keyword) {
    data = data.filter(item => item.item_code.includes(keyword));
  }
  
  const grouped = {};
  data.forEach(item => {
    if (!grouped[item.item_code]) {
      grouped[item.item_code] = { item_code: item.item_code, sizes: [] };
    }
    grouped[item.item_code].sizes.push({ size: item.size, quantity: item.quantity });
  });
  
  res.json({
    code: 200,
    data: { list: Object.values(grouped), total: data.length }
  });
});

app.post('/api/inventory/inbound', authMiddleware, (req, res) => {
  const { barcode, item_code, size, quantity = 1, remark } = req.body;
  
  const existing = mockInventory.find(item => item.item_code === item_code && item.size == size);
  
  if (existing) {
    existing.quantity += parseInt(quantity);
    existing.updated_at = new Date().toISOString();
  } else {
    mockInventory.push({
      item_code, size: parseInt(size), quantity: parseInt(quantity),
      updated_at: new Date().toISOString()
    });
  }
  
  mockStockRecords.push({
    id: mockStockRecords.length + 1,
    type: 'inbound', barcode, item_code, size: parseInt(size),
    quantity: parseInt(quantity), operator: req.user?.username || 'admin',
    remark, created_at: new Date().toISOString()
  });
  
  res.json({ code: 200, message: '入库成功', data: { item_code, size, quantity } });
});

app.post('/api/inventory/outbound', authMiddleware, (req, res) => {
  const { barcode, item_code, size, quantity = 1, remark } = req.body;
  
  const existing = mockInventory.find(item => item.item_code === item_code && item.size == size);
  
  if (!existing) {
    return res.status(400).json({ code: 400, message: '库存不存在' });
  }
  
  if (existing.quantity < parseInt(quantity)) {
    return res.status(400).json({ code: 400, message: '库存不足' });
  }
  
  existing.quantity -= parseInt(quantity);
  existing.updated_at = new Date().toISOString();
  
  mockStockRecords.push({
    id: mockStockRecords.length + 1,
    type: 'outbound', barcode, item_code, size: parseInt(size),
    quantity: parseInt(quantity), operator: req.user?.username || 'admin',
    remark, created_at: new Date().toISOString()
  });
  
  res.json({ code: 200, message: '出库成功', data: { item_code, size, quantity } });
});

// 批量入库
app.post('/api/inventory/batch-inbound', authMiddleware, (req, res) => {
  const { items } = req.body;
  
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ code: 400, message: '请提供有效的数据' });
  }
  
  const results = [];
  let totalCount = 0;
  
  for (const group of items) {
    const { item_code, items: sizeItems } = group;
    
    for (const item of sizeItems) {
      const { size, quantity = 1, barcode } = item;
      
      const existing = mockInventory.find(i => i.item_code === item_code && i.size == size);
      
      if (existing) {
        existing.quantity += parseInt(quantity);
        existing.updated_at = new Date().toISOString();
      } else {
        mockInventory.push({
          item_code, size: parseInt(size), quantity: parseInt(quantity),
          updated_at: new Date().toISOString()
        });
      }
      
      mockStockRecords.push({
        id: mockStockRecords.length + 1,
        type: 'inbound', barcode: barcode || '', item_code, size: parseInt(size),
        quantity: parseInt(quantity), operator: req.user?.username || 'admin',
        remark: '批量入库', created_at: new Date().toISOString()
      });
      
      results.push({ item_code, size: parseInt(size), quantity: parseInt(quantity) });
      totalCount += parseInt(quantity);
    }
  }
  
  res.json({ code: 200, message: `批量入库成功，共 ${totalCount} 件`, data: { results, totalCount } });
});

// 批量出库
app.post('/api/inventory/batch-outbound', authMiddleware, (req, res) => {
  const { items } = req.body;
  
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ code: 400, message: '请提供有效的数据' });
  }
  
  const results = [];
  let totalCount = 0;
  
  for (const group of items) {
    const { item_code, items: sizeItems } = group;
    
    for (const item of sizeItems) {
      const { size, quantity = 1, barcode } = item;
      
      const existing = mockInventory.find(i => i.item_code === item_code && i.size == size);
      
      if (!existing) {
        return res.status(400).json({ code: 400, message: `${item_code} 尺码 ${size} 库存不存在` });
      }
      
      if (existing.quantity < parseInt(quantity)) {
        return res.status(400).json({ code: 400, message: `${item_code} 尺码 ${size} 库存不足，当前 ${existing.quantity}` });
      }
      
      existing.quantity -= parseInt(quantity);
      existing.updated_at = new Date().toISOString();
      
      mockStockRecords.push({
        id: mockStockRecords.length + 1,
        type: 'outbound', barcode: barcode || '', item_code, size: parseInt(size),
        quantity: parseInt(quantity), operator: req.user?.username || 'admin',
        remark: '批量出库', created_at: new Date().toISOString()
      });
      
      results.push({ item_code, size: parseInt(size), quantity: parseInt(quantity) });
      totalCount += parseInt(quantity);
    }
  }
  
  res.json({ code: 200, message: `批量出库成功，共 ${totalCount} 件`, data: { results, totalCount } });
});

app.get('/api/stock-records', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20, type, item_code } = req.query;
  
  let data = [...mockStockRecords].reverse();
  
  if (type) data = data.filter(r => r.type === type);
  if (item_code) data = data.filter(r => r.item_code.includes(item_code));
  
  const total = data.length;
  const start = (page - 1) * pageSize;
  
  res.json({
    code: 200,
    data: { list: data.slice(start, start + parseInt(pageSize)), total, page: parseInt(page) }
  });
});

// --- 退件管理 ---

// 创建退件（含快递单号，多个商品）
app.post('/api/returns/create', authMiddleware, (req, res) => {
  const { express_no, express_company, items } = req.body;
  
  if (!express_no) {
    return res.status(400).json({ code: 400, message: '请提供快递单号' });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ code: 400, message: '请提供退件商品信息' });
  }
  
  const results = [];
  
  for (const item of items) {
    const returnItem = {
      id: mockReturns.length + 1,
      order_no: '',
      express_no: express_no,
      express_company: express_company || '',
      barcode: item.barcode || '',
      item_code: item.item_code,
      size: parseInt(item.size),
      return_reason: item.reason || '其他',
      remark: item.remark || '',
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    mockReturns.push(returnItem);
    results.push(returnItem);
  }
  
  res.json({ 
    code: 200, 
    message: `退件登记成功，共 ${results.length} 件商品`, 
    data: results 
  });
});

// 检测快递公司
app.post('/api/returns/detect-express', authMiddleware, (req, res) => {
  const { express_no } = req.body;
  
  if (!express_no) {
    return res.status(400).json({ code: 400, message: '请提供快递单号' });
  }
  
  const rules = [
    { pattern: /^SF\d{12,14}$/i, company: 'SF', name: '顺丰速运' },
    { pattern: /^7\d{17}$/i, company: 'ZTO', name: '中通快递' },
    { pattern: /^YT\d{12,14}$/i, company: 'YTO', name: '圆通速递' },
    { pattern: /^3\d{17}$/i, company: 'YUN', name: '韵达快递' },
    { pattern: /^4\d{17}$/i, company: 'STO', name: '申通快递' },
    { pattern: /^JT\d{13,15}$/i, company: 'JT', name: '极兔速递' },
    { pattern: /^[A-Z]{2}\d{9}$/i, company: 'EMS', name: '邮政快递' },
    { pattern: /^JD\d{13,15}$/i, company: 'JD', name: '京东物流' },
  ];
  
  for (const rule of rules) {
    if (rule.pattern.test(express_no)) {
      return res.json({ code: 200, data: { company: rule.company, name: rule.name } });
    }
  }
  
  res.json({ code: 200, data: { company: 'OTHER', name: '其他' } });
});

app.get('/api/returns/list', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20, status, keyword, startDate, endDate, express_no } = req.query;
  
  let data = [...mockReturns].reverse();
  if (status) data = data.filter(r => r.status === status);
  if (express_no) data = data.filter(r => r.express_no === express_no);
  if (keyword) {
    data = data.filter(r => 
      r.express_no.includes(keyword) || 
      r.item_code.includes(keyword) || 
      r.barcode.includes(keyword)
    );
  }
  if (startDate) {
    data = data.filter(r => new Date(r.created_at) >= new Date(startDate));
  }
  if (endDate) {
    data = data.filter(r => new Date(r.created_at) <= new Date(endDate + 'T23:59:59'));
  }
  
  const total = data.length;
  const start = (page - 1) * pageSize;
  
  // 按快递单号分组
  const grouped = {};
  data.forEach(r => {
    const key = r.express_no || r.id;
    if (!grouped[key]) {
      grouped[key] = {
        express_no: r.express_no,
        express_company: r.express_company,
        created_at: r.created_at,
        status: r.status,
        items: []
      };
    }
    grouped[key].items.push({
      id: r.id,
      barcode: r.barcode,
      item_code: r.item_code,
      size: r.size,
      return_reason: r.return_reason,
      remark: r.remark
    });
  });
  
  const groupedList = Object.values(grouped);
  const pagedList = groupedList.slice(start, start + parseInt(pageSize));
  
  res.json({
    code: 200,
    data: { 
      list: pagedList, 
      total: groupedList.length, 
      page: parseInt(page) 
    }
  });
});

app.get('/api/returns/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const item = mockReturns.find(r => r.id == id);
  if (!item) {
    return res.status(404).json({ code: 404, message: '退件记录不存在' });
  }
  res.json({ code: 200, data: item });
});

app.put('/api/returns/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { reason, remark, status } = req.body;
  
  const item = mockReturns.find(r => r.id == id);
  if (!item) {
    return res.status(404).json({ code: 404, message: '退件记录不存在' });
  }
  
  if (reason !== undefined) item.return_reason = reason;
  if (remark !== undefined) item.remark = remark;
  if (status !== undefined) item.status = status;
  
  res.json({ code: 200, message: '更新成功', data: item });
});

app.put('/api/returns/status', authMiddleware, (req, res) => {
  const { id, status, remark } = req.body;
  
  const item = mockReturns.find(r => r.id == id);
  if (!item) {
    return res.status(404).json({ code: 404, message: '退件记录不存在' });
  }
  
  item.status = status;
  if (remark) item.remark = remark;
  
  res.json({ code: 200, message: '状态已更新', data: item });
});

app.get('/api/returns/stats', authMiddleware, (req, res) => {
  const stats = {
    total: mockReturns.length,
    pending: mockReturns.filter(r => r.status === 'pending').length,
    received: mockReturns.filter(r => r.status === 'received').length,
    exchanged: mockReturns.filter(r => r.status === 'exchanged').length,
    refunded: mockReturns.filter(r => r.status === 'refunded').length,
    byReason: {}
  };
  
  mockReturns.forEach(r => {
    const reason = r.return_reason || '其他';
    stats.byReason[reason] = (stats.byReason[reason] || 0) + 1;
  });
  
  res.json({ code: 200, data: stats });
});

// --- 仪表盘 ---

app.get('/api/dashboard/stats', authMiddleware, (req, res) => {
  const today = new Date().toDateString();
  
  const todayRecords = mockStockRecords.filter(r => new Date(r.created_at).toDateString() === today);
  const todayInbound = todayRecords.filter(r => r.type === 'inbound').reduce((sum, r) => sum + r.quantity, 0);
  const todayOutbound = todayRecords.filter(r => r.type === 'outbound').reduce((sum, r) => sum + r.quantity, 0);
  const totalInventory = mockInventory.reduce((sum, item) => sum + item.quantity, 0);
  const pendingReturns = mockReturns.filter(r => r.status === 'pending').length;
  
  res.json({
    code: 200,
    data: {
      todayInbound,
      todayOutbound,
      totalInventory,
      pendingReturns,
      recentRecords: mockStockRecords.slice(-10).reverse(),
      recentReturns: mockReturns.slice(-5).reverse()
    }
  });
});

// --- 仪表盘扩展 API ---

app.get('/api/dashboard/returns-trend', authMiddleware, (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const trend = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    const count = mockReturns.filter(r => r.created_at.startsWith(dayStr)).length || Math.floor(Math.random() * 20) + 5;
    trend.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, count });
  }
  res.json({ code: 200, data: trend });
});

app.get('/api/dashboard/recent-records', authMiddleware, (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const records = mockStockRecords.slice(-limit).reverse().map(r => ({
    time: r.created_at,
    type: r.type,
    barcode: r.barcode,
    articleNo: r.item_code,
    size: r.size,
    quantity: r.quantity,
    operator: r.operator
  }));
  res.json({ code: 200, data: records });
});

app.get('/api/dashboard/warning-count', authMiddleware, (req, res) => {
  const warnings = mockInventory
    .filter(item => item.quantity < 10)
    .map(item => ({
      articleNo: item.item_code,
      size: item.size,
      stock: item.quantity,
      updateTime: item.updated_at || new Date().toISOString()
    }));
  res.json({ code: 200, data: warnings });
});

// --- 条形码解析 ---

app.post('/api/barcode/parse', (req, res) => {
  const { barcode } = req.body;
  
  // 格式1: S14A2020DM0270 → 货号=S14A2020DM，尺码=27/27.5
  // 格式2: B1404559--PIK29- → 货号=B1404559，尺码=29
  
  let result = null;
  
  // 尝试格式2
  const rule2 = /^([A-Z0-9]+)--.*?(\d+(?:\.\d+)?)-/;
  const match2 = barcode.match(rule2);
  if (match2) {
    result = { item_code: match2[1], size: parseFloat(match2[2]) };
  }
  
  // 尝试格式1
  if (!result) {
    const rule1 = /^([A-Z0-9]+?)(\d{2,3})$/;
    const match1 = barcode.match(rule1);
    if (match1) {
      const rawSize = match1[2];
      let size;
      if (rawSize.length === 3) {
        size = parseFloat(rawSize.slice(0, 2) + '.' + rawSize[2]);
      } else {
        size = parseInt(rawSize);
      }
      result = { item_code: match1[1], size };
    }
  }
  
  if (result) {
    res.json({ code: 200, data: { barcode, ...result } });
  } else {
    res.status(400).json({ code: 400, message: '无法解析条形码' });
  }
});

// ==================== 快团团ERP API ====================

// ERP 仪表盘统计
app.get('/api/erp/stats', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = mockReturns.filter(r => r.created_at.startsWith(today));
  
  res.json({
    code: 200,
    data: {
      pendingOrders: 12,
      todayOrders: 38,
      todaySales: 8520,
      totalProducts: 156,
      warningCount: mockInventory.filter(i => i.quantity < 10).length
    }
  });
});

// 订单列表
app.get('/api/erp/orders', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20, status, keyword, startDate, endDate } = req.query;
  
  res.json({
    code: 200,
    data: {
      list: [],
      total: 0,
      page: parseInt(page)
    }
  });
});

// 订单导入
app.post('/api/erp/orders/import', authMiddleware, (req, res) => {
  res.json({ code: 200, message: '导入成功', data: { imported: 0 } });
});

// 订单发货
app.post('/api/erp/orders/ship', authMiddleware, (req, res) => {
  res.json({ code: 200, message: '发货成功' });
});

// 商品列表
app.get('/api/erp/products', authMiddleware, (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  res.json({ code: 200, data: { list: [], total: 0, page: parseInt(page) } });
});

// 物流列表
app.get('/api/erp/logistics', authMiddleware, (req, res) => {
  res.json({ code: 200, data: { list: [], total: 0 } });
});

// 快团团授权状态
app.get('/api/erp/ktt/auth', authMiddleware, (req, res) => {
  res.json({ code: 200, data: { connected: false, authType: 'excel' } });
});

// 快团团授权
app.post('/api/erp/ktt/auth', authMiddleware, (req, res) => {
  res.json({ code: 200, message: '授权成功', data: { connected: true } });
});

// ==================== 错误处理 ====================

app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('全局错误:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

// ==================== 启动服务 ====================

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`江博士童鞋仓库管理系统`);
  console.log(`服务已启动: http://localhost:${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'} (内存演示模式)`);
  console.log(`默认账号: admin / admin123`);
  console.log(`========================================\n`);
});

module.exports = app;
