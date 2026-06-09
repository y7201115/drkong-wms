<template>
  <div class="dashboard-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-lg">
      <el-col :xs="24" :sm="12" :lg="6" v-for="card in statCards" :key="card.title">
        <StatCard
          :title="card.title"
          :value="card.value"
          :icon="card.icon"
          :color="card.color"
          :subtitle="card.subtitle"
        />
      </el-col>
    </el-row>

    <!-- 最近记录和退件趋势 -->
    <el-row :gutter="20">
      <!-- 最近出入库记录 -->
      <el-col :xs="24" :lg="14">
        <div class="page-card">
          <div class="card-header">
            <h3>最近出入库记录</h3>
            <el-button type="primary" text @click="$router.push('/stock-records')">
              查看全部
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <el-table :data="recentRecords" stripe style="width: 100%">
            <el-table-column prop="time" label="时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.time) }}
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.type === 'in' ? 'success' : 'danger'" size="small">
                  {{ row.type === 'in' ? '入库' : '出库' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="barcode" label="条形码" width="180" />
            <el-table-column prop="articleNo" label="货号" width="100" />
            <el-table-column prop="size" label="尺码" width="70" />
            <el-table-column prop="quantity" label="数量" width="70" />
            <el-table-column prop="operator" label="操作人" />
          </el-table>
        </div>
      </el-col>

      <!-- 退件趋势 -->
      <el-col :xs="24" :lg="10">
        <div class="page-card">
          <div class="card-header">
            <h3>近7天退件趋势</h3>
          </div>
          <div class="chart-container">
            <div class="bar-chart">
              <div
                v-for="(item, index) in returnsTrend"
                :key="index"
                class="bar-item"
              >
                <div class="bar-value">{{ item.count }}</div>
                <div
                  class="bar"
                  :style="{ height: getBarHeight(item.count) + 'px', backgroundColor: item.count > 10 ? '#F56C6C' : '#409EFF' }"
                ></div>
                <div class="bar-label">{{ item.date }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 库存预警 -->
    <div class="page-card mt-lg">
      <div class="card-header">
        <h3>库存预警（数量 &lt; 10）</h3>
        <el-button type="danger" text @click="$router.push('/inventory/list')">
          查看库存列表
          <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      <el-table :data="warningList" stripe style="width: 100%">
        <el-table-column prop="articleNo" label="货号" width="120" />
        <el-table-column prop="size" label="尺码" width="80" />
        <el-table-column prop="stock" label="当前库存" width="120">
          <template #default="{ row }">
            <el-tag type="danger" size="small">{{ row.stock }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="goToAdjust(row)">
              调整库存
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import StatCard from '@/components/StatCard.vue'
import { formatDate } from '@/utils/format'
import { getDashboardStats, getReturnsTrend, getRecentStockRecords, getWarningCount } from '@/api/dashboard'
import { getReturnsStats } from '@/api/returns'

const router = useRouter()

const statCards = ref([
  { title: '今日入库', value: 0, icon: 'Download', color: '#67C23A' },
  { title: '今日出库', value: 0, icon: 'Upload', color: '#E6A23C' },
  { title: '今日退件', value: 0, icon: 'RefreshLeft', color: '#F56C6C' },
  { title: '当前总库存', value: 0, icon: 'Box', color: '#409EFF' }
])

const recentRecords = ref([])
const returnsTrend = ref([])
const warningList = ref([])

const maxReturnCount = ref(1)

onMounted(async () => {
  await fetchDashboardData()
})

async function fetchDashboardData() {
  try {
    const stats = await getDashboardStats()
    statCards.value[0].value = stats.todayIn || 0
    statCards.value[1].value = stats.todayOut || 0
    statCards.value[3].value = stats.totalStock || 0
    statCards.value[3].subtitle = `预警 ${stats.warningCount || 0} 项`
    
    // 获取退件统计数据
    try {
      const returnStats = await getReturnsStats()
      statCards.value[2].value = returnStats.pending || 0
      statCards.value[2].subtitle = `待处理 ${returnStats.pending || 0} 件`
    } catch {
      statCards.value[2].value = 0
      statCards.value[2].subtitle = '无待处理退件'
    }
  } catch {
    // Mock data for demo
    statCards.value = [
      { title: '今日入库', value: 128, icon: 'Download', color: '#67C23A' },
      { title: '今日出库', value: 96, icon: 'Upload', color: '#E6A23C' },
      { title: '待处理退件', value: 5, icon: 'RefreshLeft', color: '#F56C6C', subtitle: '待处理 5 件' },
      { title: '当前总库存', value: 12580, icon: 'Box', color: '#409EFF', subtitle: '预警 8 项' }
    ]
  }

  try {
    const trend = await getReturnsTrend({ days: 7 })
    returnsTrend.value = trend
    maxReturnCount.value = Math.max(...trend.map(t => t.count), 1)
  } catch {
    // Mock data
    const dates = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dates.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        count: Math.floor(Math.random() * 20) + 5
      })
    }
    returnsTrend.value = dates
    maxReturnCount.value = Math.max(...dates.map(d => d.count), 1)
  }

  try {
    const records = await getRecentStockRecords({ limit: 10 })
    recentRecords.value = records
  } catch {
    // Mock data
    const types = ['in', 'out']
    recentRecords.value = Array.from({ length: 8 }, (_, i) => ({
      time: new Date(Date.now() - i * 3600000).toISOString(),
      type: types[i % 2],
      barcode: `DRK-2024-${String(100 + i).padStart(3, '0')}-${25 + i}`,
      articleNo: `A${100 + i}`,
      size: 25 + i,
      quantity: Math.floor(Math.random() * 20) + 1,
      operator: ['张三', '李四', '王五', '赵六'][i % 4]
    }))
  }

  try {
    const warnings = await getWarningCount()
    warningList.value = warnings || []
  } catch {
    // Mock data
    warningList.value = [
      { articleNo: 'A101', size: '25', stock: 3, updateTime: new Date().toISOString() },
      { articleNo: 'A105', size: '28', stock: 5, updateTime: new Date().toISOString() },
      { articleNo: 'A112', size: '32', stock: 0, updateTime: new Date().toISOString() }
    ]
  }
}

function getBarHeight(count) {
  const maxHeight = 160
  return (count / maxReturnCount.value) * maxHeight
}

function goToAdjust(row) {
  router.push({ path: '/inventory/adjust', query: { articleNo: row.articleNo, size: row.size } })
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.dashboard-container {
  padding: 0;
}

.mb-lg {
  margin-bottom: $spacing-lg;
}

.mt-lg {
  margin-top: $spacing-lg;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing-lg;
  
  h3 {
    font-size: 16px;
    color: $text-primary;
    margin: 0;
    font-weight: 600;
  }
}

.chart-container {
  padding: $spacing-md 0;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 220px;
  padding: 0 $spacing-sm;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 60px;
}

.bar-value {
  font-size: 12px;
  color: $text-regular;
  margin-bottom: $spacing-xs;
  font-weight: 600;
}

.bar {
  width: 32px;
  border-radius: $border-radius-base $border-radius-base 0 0;
  transition: height 0.3s ease;
  
  &:hover {
    opacity: 0.8;
  }
}

.bar-label {
  margin-top: $spacing-sm;
  font-size: 12px;
  color: $text-secondary;
}
</style>
