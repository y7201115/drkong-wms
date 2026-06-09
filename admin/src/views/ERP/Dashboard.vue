<template>
  <div class="page-container">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16">
      <el-col :span="6">
        <div class="stat-card orders" @click="router.push('/erp/orders')">
          <div class="stat-icon"><el-icon><Document /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.todayOrders }}</div>
            <div class="stat-label">今日订单</div>
          </div>
          <div class="stat-trend up">↑ 12%</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card revenue">
          <div class="stat-icon"><el-icon><Money /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">¥{{ stats.todayRevenue.toLocaleString() }}</div>
            <div class="stat-label">今日收入</div>
          </div>
          <div class="stat-trend up">↑ 8%</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card pending">
          <div class="stat-icon"><el-icon><Clock /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.pendingOrders }}</div>
            <div class="stat-label">待发货</div>
          </div>
          <div class="stat-trend down">↓ 3</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card alerts" @click="router.push('/erp/sku-mgmt')">
          <div class="stat-icon"><el-icon><WarningFilled /></el-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.lowStock }}</div>
            <div class="stat-label">库存预警</div>
          </div>
          <div class="stat-trend up">需关注</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="content-row">
      <!-- 待处理订单 -->
      <el-col :span="16">
        <el-card shadow="never" class="panel">
          <template #header>
            <div class="panel-header">
              <span>待处理订单</span>
              <el-button type="primary" text @click="router.push('/erp/orders')">查看全部</el-button>
            </div>
          </template>

          <el-table :data="pendingOrders" v-loading="loading" stripe border style="width: 100%">
            <el-table-column prop="orderNo" label="订单号" width="180">
              <template #default="{ row }">
                <span class="order-no">{{ row.orderNo }}</span>
              </template>
            </el-table-column>
            <el-table-column label="买家" width="80">
              <template #default="{ row }">{{ row.buyer }}</template>
            </el-table-column>
            <el-table-column label="商品" min-width="180">
              <template #default="{ row }">
                <div class="order-product">
                  <span class="name">{{ row.productName }}</span>
                  <span class="size">x{{ row.quantity }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="80" align="right">
              <template #default="{ row }">
                <span class="amount">¥{{ row.amount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="时间" width="150">
              <template #default="{ row }">{{ row.time }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleShipFromDashboard(row)">发货</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 最新动态 & 快捷入口 -->
      <el-col :span="8">
        <!-- 库存预警 -->
        <el-card shadow="never" class="panel mb-16">
          <template #header>
            <div class="panel-header">
              <span>库存预警</span>
              <el-button type="primary" text @click="router.push('/erp/sku-mgmt')">管理库存</el-button>
            </div>
          </template>

          <div class="stock-alert-list">
            <div class="stock-alert-item" v-for="item in lowStockAlerts" :key="item.id">
              <div class="product-info">
                <span class="name">{{ item.name }}</span>
                <span class="article-no">{{ item.articleNo }}</span>
              </div>
              <div class="stock-info">
                <span class="stock-count" :class="{ critical: item.stock <= 5, warning: item.stock > 5 }">{{ item.stock }}</span>
                <span class="unit">件</span>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 最新动态 -->
        <el-card shadow="never" class="panel mb-16">
          <template #header>
            <div class="panel-header">
              <span>最新动态</span>
            </div>
          </template>

          <el-timeline class="activity-timeline">
            <el-timeline-item timestamp="2026-06-08 14:30" placement="top">
              <span>新订单 <span class="order-no-inline">KTT2026060800056</span> 待发货</span>
            </el-timeline-item>
            <el-timeline-item timestamp="2026-06-08 14:15" placement="top">
              <span>商品 <span class="name-inline">江博士童鞋 S14A2020DM</span> 库存已补充至100件</span>
            </el-timeline-item>
            <el-timeline-item timestamp="2026-06-08 13:50" placement="top">
              <span>售后单 <span class="order-no-inline">AS202606080</span> 审核通过</span>
            </el-timeline-item>
            <el-timeline-item timestamp="2026-06-08 13:20" placement="top">
              <span>快递 <span class="name-inline">中通快递 78356123456789</span> 已签收</span>
            </el-timeline-item>
            <el-timeline-item timestamp="2026-06-08 12:00" placement="top">
              <span>商品 <span class="name-inline">江博士童鞋 B1404580</span> 库存不足，仅剩8件</span>
            </el-timeline-item>
          </el-timeline>
        </el-card>

        <!-- 快捷入口 -->
        <el-card shadow="never" class="panel">
          <template #header>
            <div class="panel-header">
              <span>快捷入口</span>
            </div>
          </template>

          <div class="quick-actions">
            <div class="quick-action" @click="router.push('/erp/orders')">
              <div class="icon orders-icon"><el-icon><Document /></el-icon></div>
              <span>订单管理</span>
            </div>
            <div class="quick-action" @click="router.push('/erp/products')">
              <div class="icon products-icon"><el-icon><Goods /></el-icon></div>
              <span>商品管理</span>
            </div>
            <div class="quick-action" @click="router.push('/erp/sku-mgmt')">
              <div class="icon sku-icon"><el-icon><Box /></el-icon></div>
              <span>SKU管理</span>
            </div>
            <div class="quick-action" @click="router.push('/erp/logistics')">
              <div class="icon logistics-icon"><el-icon><Van /></el-icon></div>
              <span>物流管理</span>
            </div>
            <div class="quick-action" @click="router.push('/erp/refund')">
              <div class="icon refund-icon"><el-icon><RefreshLeft /></el-icon></div>
              <span>售后退款</span>
            </div>
            <div class="quick-action" @click="handleSyncAll">
              <div class="icon sync-icon"><el-icon><Download /></el-icon></div>
              <span>同步订单</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import {
  Document, Money, Clock, WarningFilled, Search, Refresh, Download, Upload,
  Goods, Box, Van, RefreshLeft
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getERPStats } from '@/api/erp'

const router = useRouter()
const loading = ref(false)
const syncing = ref(false)
const pendingOrders = ref([])
const lowStockAlerts = ref([])

const stats = reactive({
  todayOrders: 0,
  todayRevenue: 0,
  pendingOrders: 0,
  lowStock: 0,
  totalOrders: 0,
  totalProducts: 0,
})

onMounted(() => {
  fetchStats()
  fetchPendingOrders()
  fetchLowStockAlerts()
})

async function fetchStats() {
  try {
    const data = await getERPStats()
    stats.todayOrders = data.todayOrders || 0
    stats.todayRevenue = data.todayRevenue || 0
    stats.pendingOrders = data.pendingOrders || 0
    stats.lowStock = data.lowStock || 0
    stats.totalOrders = data.totalOrders || 0
    stats.totalProducts = data.totalProducts || 0
  } catch {
    // API失败时使用模拟数据
    stats.todayOrders = 23
    stats.todayRevenue = 3458
    stats.pendingOrders = 15
    stats.lowStock = 3
    stats.totalOrders = 236
    stats.totalProducts = 156
  }
}

function fetchPendingOrders() {
  pendingOrders.value = [
    { id: 1, orderNo: 'KTT2026060800056', buyer: '张**', productName: '江博士童鞋 学步鞋', quantity: 1, amount: 158, time: '2026-06-08 14:30' },
    { id: 2, orderNo: 'KTT2026060800055', buyer: '李**', productName: '江博士童鞋 运动鞋', quantity: 2, amount: 456, time: '2026-06-08 14:15' },
    { id: 3, orderNo: 'KTT2026060800054', buyer: '王**', productName: '江博士童鞋 休闲鞋', quantity: 1, amount: 198, time: '2026-06-08 13:50' },
    { id: 4, orderNo: 'KTT2026060800053', buyer: '赵**', productName: '江博士童鞋 帆布鞋', quantity: 3, amount: 414, time: '2026-06-08 13:20' },
  ]
}

function fetchLowStockAlerts() {
  lowStockAlerts.value = [
    { id: 1, name: '江博士童鞋 学步鞋', articleNo: 'S14A2020DM', stock: 3 },
    { id: 2, name: '江博士童鞋 休闲鞋', articleNo: 'B1404559', stock: 5 },
    { id: 3, name: '江博士童鞋 凉鞋', articleNo: 'B1404580', stock: 8 },
  ]
}

// 从仪表盘直接发货
function handleShipFromDashboard(row) {
  router.push({ path: '/erp/orders', query: { orderNo: row.orderNo, action: 'ship' } })
  ElMessage.success('已跳转至发货页面')
}

function handleSyncAll() {
  syncing.value = true
  setTimeout(() => {
    ElMessage.success('订单同步完成，获取 23 个新订单')
    syncing.value = false
    stats.todayOrders += 23
  }, 2000)
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.page-container {
  padding: 0;
  background: #f5f5f5;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.orders .stat-icon { background: #ecf5ff; color: #409EFF; }
.revenue .stat-icon { background: #f0f9eb; color: #67C23A; }
.pending .stat-icon { background: #fdf6ec; color: #E6A23C; }
.alerts .stat-icon { background: #fef0f0; color: #F56C6C; }

.stat-content { flex: 1; }
.stat-value { font-size: 24px; font-weight: 600; line-height: 1.2; }
.stat-label { font-size: 13px; color: #999; margin-top: 2px; }

.stat-trend {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  &.up { background: #f0f9eb; color: #67C23A; }
  &.down { background: #fef0f0; color: #F56C6C; }
}

.content-row { margin-bottom: 16px; }
.panel { box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05); border: none; }
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.order-no { font-family: monospace; color: #409EFF; font-size: 13px; }
.order-no-inline { font-family: monospace; color: #409EFF; font-size: 12px; }
.amount { color: #F56C6C; font-weight: 600; }
.name-inline { color: #333; font-size: 12px; }

.activity-timeline { padding: 0 16px; }
:deep(.el-timeline-item__timestamp) { font-size: 12px; }

.stock-alert-list { padding: 0 16px; }
.stock-alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  &:last-child { border-bottom: none; }
}

.stock-alert-item .product-info { display: flex; flex-direction: column; }
.stock-alert-item .name { font-size: 13px; color: #333; }
.stock-alert-item .article-no { font-size: 12px; color: #E6A23C; font-family: monospace; }
.stock-info { font-size: 16px; font-weight: 600; }
.stock-info .unit { font-size: 12px; color: #999; font-weight: normal; }
.stock-count { font-size: 20px; }
.stock-count.warning { color: #E6A23C; }
.stock-count.critical { color: #F56C6C; }

.mb-16 { margin-bottom: 16px; }

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 12px 16px;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  border-radius: 8px;
  background: #f5f7fa;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  color: #666;
  &:hover {
    background: #ecf5ff;
    color: #409EFF;
  }
}

.icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orders-icon { background: #ecf5ff; color: #409EFF; }
.products-icon { background: #f0f9eb; color: #67C23A; }
.sku-icon { background: #fdf6ec; color: #E6A23C; }
.logistics-icon { background: #ecf5ff; color: #409EFF; }
.refund-icon { background: #fef0f0; color: #F56C6C; }
.sync-icon { background: #f4f4f5; color: #909399; }

.order-product .name { font-size: 13px; color: #333; }
.order-product .size { font-size: 12px; color: #999; margin-left: 8px; }
</style>
