<template>
  <div class="page-container">
    <!-- 筛选条件 -->
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
        <el-button type="primary" @click="fetchReport">
          <el-icon><Search /></el-icon>
          生成报表
        </el-button>
      </div>
    </div>

    <!-- 退件原因分析（饼图模拟） -->
    <div class="page-card mt-lg">
      <h3 class="section-title">退件原因分析</h3>
      <div class="reason-analysis">
        <div class="pie-chart-container">
          <div class="pie-chart" :style="{ background: pieBackground }"></div>
        </div>
        <div class="reason-legend">
          <div
            v-for="(item, index) in reasonData"
            :key="index"
            class="legend-row"
          >
            <span class="legend-color" :style="{ backgroundColor: colors[index % colors.length] }"></span>
            <span class="legend-name">{{ item.reason }}</span>
            <span class="legend-count">{{ item.count }} 次</span>
            <span class="legend-percent">{{ item.percent }}%</span>
            <div class="legend-bar-bg">
              <div
                class="legend-bar"
                :style="{ width: item.percent + '%', backgroundColor: colors[index % colors.length] }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 退件趋势 -->
    <div class="page-card mt-lg">
      <h3 class="section-title">退件趋势（按日期）</h3>
      <div class="trend-chart">
        <div class="bar-chart">
          <div v-for="(item, index) in trendData" :key="index" class="bar-item">
            <div class="bar-value">{{ item.count }}</div>
            <div
              class="bar"
              :style="{ height: getBarHeight(item.count) + 'px' }"
            ></div>
            <div class="bar-label">{{ item.date }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 高频退件货号排行 -->
    <div class="page-card mt-lg">
      <h3 class="section-title">高频退件货号排行 TOP 10</h3>
      <el-table :data="topArticles" stripe border style="width: 100%">
        <el-table-column type="index" label="排名" width="70" align="center">
          <template #default="{ $index }">
            <el-tag :type="$index < 3 ? 'danger' : $index < 6 ? 'warning' : 'info'" size="small" round>
              {{ $index + 1 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="articleNo" label="货号" width="120" />
        <el-table-column prop="category" label="品类" width="100" />
        <el-table-column prop="returnCount" label="退件次数" width="120" sortable>
          <template #default="{ row }">
            <span class="count-highlight">{{ row.returnCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="mainReason" label="主要原因" min-width="150" />
        <el-table-column label="退件率" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="row.returnRate"
              :color="row.returnRate > 10 ? '#F56C6C' : row.returnRate > 5 ? '#E6A23C' : '#67C23A'"
              :stroke-width="10"
            />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getReturnsReasonAnalysis, getReturnsReport, getTopReturnArticles } from '@/api/reports'

const dateRange = ref(null)
const reasonData = ref([])
const trendData = ref([])
const topArticles = ref([])
const maxTrendCount = ref(1)

const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#722ED1', '#13C2C2', '#EB2F96']

const pieBackground = computed(() => {
  if (reasonData.value.length === 0) return '#f0f0f0'
  
  let gradient = 'conic-gradient('
  let accumulated = 0
  
  reasonData.value.forEach((item, index) => {
    const color = colors[index % colors.length]
    const start = accumulated
    accumulated += item.percent
    gradient += `${color} ${start}% ${accumulated}%`
    if (index < reasonData.value.length - 1) {
      gradient += ', '
    }
  })
  
  gradient += ')'
  return gradient
})

onMounted(() => {
  fetchReport()
})

async function fetchReport() {
  // 退件原因分析
  try {
    const res = await getReturnsReasonAnalysis({
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1]
    })
    reasonData.value = res || []
  } catch {
    // Mock data
    const reasons = [
      { reason: '尺码不合适', count: 120 },
      { reason: '质量问题', count: 45 },
      { reason: '不喜欢', count: 38 },
      { reason: '发错货', count: 22 },
      { reason: '破损', count: 15 },
      { reason: '颜色差异', count: 10 }
    ]
    const total = reasons.reduce((sum, r) => sum + r.count, 0)
    reasonData.value = reasons.map(r => ({
      ...r,
      percent: Math.round((r.count / total) * 100)
    }))
  }

  // 退件趋势
  try {
    const res = await getReturnsReport({
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1],
      days: 14
    })
    trendData.value = res?.trend || []
    maxTrendCount.value = Math.max(...trendData.value.map(t => t.count), 1)
  } catch {
    // Mock data
    const dates = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dates.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        count: Math.floor(Math.random() * 20) + 3
      })
    }
    trendData.value = dates
    maxTrendCount.value = Math.max(...dates.map(d => d.count), 1)
  }

  // 高频退件排行
  try {
    const res = await getTopReturnArticles({ limit: 10 })
    topArticles.value = res || []
  } catch {
    // Mock data
    const categories = ['运动鞋', '休闲鞋', '凉鞋', '靴子', '拖鞋']
    const reasons = ['尺码不合适', '质量问题', '不喜欢', '发错货']
    topArticles.value = Array.from({ length: 10 }, (_, i) => ({
      articleNo: `A${100 + i}`,
      category: categories[i % 5],
      returnCount: Math.floor(Math.random() * 50) + 10,
      mainReason: reasons[i % 4],
      returnRate: Math.floor(Math.random() * 15) + 1
    })).sort((a, b) => b.returnCount - a.returnCount)
  }
}

function getBarHeight(count) {
  const maxHeight = 140
  return (count / maxTrendCount.value) * maxHeight
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

.reason-analysis {
  display: flex;
  gap: $spacing-xl;
  align-items: center;
}

.pie-chart-container {
  flex-shrink: 0;
}

.pie-chart {
  width: 200px;
  height: 200px;
  border-radius: 50%;
}

.reason-legend {
  flex: 1;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;
  font-size: 13px;
}

.legend-color {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
}

.legend-name {
  width: 100px;
  color: $text-regular;
}

.legend-count {
  width: 60px;
  text-align: right;
  color: $text-primary;
  font-weight: 600;
}

.legend-percent {
  width: 50px;
  text-align: right;
  color: $text-secondary;
}

.legend-bar-bg {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.legend-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.trend-chart {
  padding: $spacing-md 0;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 200px;
  padding: 0 $spacing-sm;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 50px;
}

.bar-value {
  font-size: 12px;
  color: $text-regular;
  margin-bottom: $spacing-xs;
  font-weight: 600;
}

.bar {
  width: 28px;
  background: linear-gradient(180deg, #F56C6C 0%, #E6A23C 100%);
  border-radius: $border-radius-base $border-radius-base 0 0;
  transition: height 0.3s ease;

  &:hover {
    opacity: 0.85;
  }
}

.bar-label {
  margin-top: $spacing-sm;
  font-size: 11px;
  color: $text-secondary;
}

.count-highlight {
  color: #F56C6C;
  font-weight: 600;
  font-size: 16px;
}
</style>
