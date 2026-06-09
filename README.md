# 江博士童鞋仓库管理系统

> 扫码出入库微信小程序 + PC管理后台，数据实时互通

## 📁 项目结构

```
deepseek/
├── server/           # 后端API服务 (Node.js + Express + MySQL)
├── miniapp/          # 微信小程序 (uni-app)
├── admin/            # PC管理后台 (Vue3 + Element Plus)
└── package.json      # 根项目配置
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16
- MySQL >= 5.7
- Redis >= 6.0
- 微信开发者工具（运行小程序）

### 1. 安装依赖

```bash
npm run install:all
```

### 2. 配置后端

编辑 `server/.env` 文件：

```env
# 服务器配置
PORT=3001
NODE_ENV=development

# MySQL数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=warehouse_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
```

### 3. 启动服务

```bash
# 启动后端（会自动创建数据库表）
cd server && npm run dev

# 启动PC管理后台
cd admin && npm run dev

# 启动小程序（用微信开发者工具打开miniapp目录）
```

## 📱 功能模块

### 微信小程序
| 功能 | 说明 |
|------|------|
| 扫码入库 | 扫条形码自动解析货号/尺码，快速入库 |
| 扫码出库 | 扫码出库，显示当前库存 |
| 库存查询 | 按货号搜索，展开查看各尺码库存 |
| 退件处理 | 扫码登记退件，选择退件原因 |
| 操作记录 | 查看个人出入库记录 |

### PC管理后台
| 功能 | 说明 |
|------|------|
| 仪表盘 | 今日数据统计、最近记录、库存预警 |
| 库存管理 | 货号分组查询、库存调整、预警设置 |
| 出入库记录 | 单据管理、筛选查询、导出 |
| 退件管理 | 退件列表、状态跟踪、处理操作 |
| 报表统计 | 按货号/尺码/时间维度统计 |

## 🔧 条形码解析规则

系统支持以下两种条形码格式：

| 格式 | 示例 | 货号 | 尺码 |
|------|------|------|------|
| 格式1 | S14A2020DM0270 | S14A2020DM | 27 |
| 格式1(半码) | S14A2020DM02750 | S14A2020DM | 27.5 |
| 格式2 | B1404559--PIK29- | B1404559 | 29 |
| 格式2(半码) | B1404559--PIK29.5- | B1404559 | 29.5 |

## 📡 API接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 登录 |
| GET | `/api/inventory/list` | 库存列表（货号分组） |
| POST | `/api/inventory/inbound` | 入库 |
| POST | `/api/inventory/outbound` | 出库 |
| GET | `/api/inventory/search` | 搜索库存 |
| POST | `/api/returns/create` | 创建退件 |
| GET | `/api/returns/list` | 退件列表 |
| PUT | `/api/returns/:id/status` | 更新退件状态 |
| GET | `/api/dashboard/stats` | 仪表盘统计 |

## 🛠️ 技术栈

| 端 | 技术 |
|---|---|
| 后端 | Node.js + Express + MySQL + Redis + JWT |
| 小程序 | uni-app + Vue3 + Pinia |
| PC端 | Vue3 + Vite + Element Plus + Vue Router + Pinia |

## 📝 默认账号

- 用户名: `admin`
- 密码: `admin123`

## ⚠️ 注意事项

1. 首次启动后端会自动创建数据库表
2. 确保MySQL和Redis服务已启动
3. 小程序需要在微信开发者工具中配置合法域名（开发阶段可关闭域名校验）
4. 生产环境请修改JWT密钥和数据库密码
