<template>
  <div class="page-container">
    <div class="page-card">
      <div class="search-bar">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 240px"
        />
        <el-input
          v-model="articleNo"
          placeholder="货号（可选）"
          clearable
          style="width: 160px"
        />
        <el-button type="primary" @click="fetchReport">
          <el-icon><Search /></el-icon>
          生成报表
        </el-button>
      </div>
    </div>

    <!-- 按货号统计 -->
    <div class="page-card mt-lg">
      <h3 class="section-title">按货号统计</h3>
      <el-table :data="articleStats" stripe border style="width: 100%" show-summary :summary-method="getSummaries">
        <el-table-column prop="articleNo" label="货号" width="120" fixed />
        <el-table-column prop="category" label="品类" width="100" />
        <el-table-column label="尺码分布">
          <template #default="{ row }">
            <div class="size-distribution">
              <el-tag
                v-for="(count, size) in row.sizeMap"
                :key="size"
                size="small"
                :type="count < 10 ? 'danger' : count < 50 ? 'warning' : 'success'"
                class="size-tag"
              >
                {{ size }}:{{ count }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="totalStock" label="总库存" width="100" sortable>
          <template #default="{ row }">
            <span :class="{ 'stock-warning': row.totalStock < 10 }">{{ row.totalStock }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.totalStock < 10 ? 'danger' : 'success'" size="small">
              {{ row.totalStock < 10 ? '预警' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 出入库趋势 -->
    <div class="page-card mt-lg">
      <h3 class="section-title">出入库趋势（近7天）</h3>
      <div class="trend-chart">
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-dot" style="background: #67C23A"></span>
            入库
          </span>
          <span class="legend-item">
            <span class="legend-dot" style="background: #E6A23C"></span>
            出库
          </span>
        </div>
        <div class="bar-chart-group">
          <div v-for="(item, index) in trendData" :key="index" class="bar-group">
            <div class="bar-pair">
              <div
                class="bar bar-in"
                :style="{ height: getBarHeight(item.in, 'in') + 'px' }"
              ></div>
              <div
                class="bar bar-out"
                :style="{ height: getBarHeight(item.out, 'out') + 'px' }"
              ></div>
            </div>
            <div class="bar-label">{{ item.date }}</div>
            <div class="bar-values">
              <span class="val-in">{{ item.in }}</span>
              <span class="val-out">{{ item.out }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getInventoryReport, getStockTrendReport } from '@/api/reports'

const dateRange = ref(null)
const articleNo = ref('')
const articleStats = ref([])
const trendData = ref([])
const maxInCount = ref(1)
const maxOutCount = ref(1)

onMounted(() => {
  fetchReport()
})

async function fetchReport() {
  try {
    const params = {
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1],
      articleNo: articleNo.value || undefined
    }
    const res = await getInventoryReport(params)
    articleStats.value = res.articleStats || []
  } catch {
    articleStats.value = Array.from({ length: 10 }, (_, i) => ({
      articleNo: `A${100 + i}`,
      category: ['运动鞋', '休闲鞋', '凉鞋', '靴子'][i % 4],
      sizeMap: {
        25: Math.floor(Math.random() * 30) + 5,
        26: Math.floor(Math.random() * 30) + 5,
        27: Math.floor(Math.random() * 30) + 5,
        28: Math.floor(Math.random() * 30) + 5,
        29: Math.floor(Math.random() * 30) + 5,
        30: Math.floor(Math.random() * 30) + 5
      },
      totalStock: Math.floor(Math.random() * 200) + 10
    }))
  }

  try {
    const trend = await getStockTrendReport({ days: 7 })
    trendData.value = trend
    maxInCount.value = Math.max(...trend.map(t => t.in || 0), 1)
    maxOutCount.value = Math.max(...trend.map(t => t.out || 0), 1)
  } catch {
    const dates = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dates.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        in: Math.floor(Math.random() * 150) + 50,
        out: Math.floor(Math.random() * 120) + 30
      })
    }
    trendData.value = dates
    maxInCount.value = Math.max(...dates.map(t => t.in), 1)
    maxOutCount.value = Math.max(...dates.map(t => t.out), 1)
  }
}

function getBarHeight(count, type) {
  const max = type === 'in' ? maxInCount.value : maxOutCount.value
  return (count / max) * 160
}

function getSummaries({ columns, data }) {
  const sums = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    if (column.property === 'totalStock') {
      const values = data.map(item => Number(item[column.property]))
      sums[index] = values.reduce((prev, curr) => {
        const value = Number(curr)
        if (!isNaN(value)) return prev + curr
        return prev
      }, 0)
    }
  })
  return sums
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.mt-lg {
  margin-top: $spacing-lg;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid $border-color-light;
}

.stock-warning {
  color: #F56C6C;
  font-weight: 600;
}

.size-distribution {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.size-tag {
  margin: 0;
}

.trend-chart {
  padding: $spacing-md 0;
}

.chart-legend {
  display: flex;
  gap: $spacing-lg;
  margin-bottom: $spacing-lg;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: $text-regular;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.bar-chart-group {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 240px;
  padding: 0 $spacing-sm;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 80px;
}

.bar-pair {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 170px;
}

.bar {
  width: 24px;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;

  &:hover {
    opacity: 0.85;
  }
}

.bar-in {
  background: #67C23A;
}

.bar-out {
  background: #E6A23C;
}

.bar-label {
  margin-top: $spacing-sm;
  font-size: 12px;
  color: $text-secondary;
}

.bar-values {
  display: flex;
  gap: 4px;
  font-size: 11px;
  margin-top: 4px;
}

.val-in {
  color: #67C23A;
  font-weight: 600;
}

.val-out {
  color: #E6A23C;
  font-weight: 600;
}
</style>
