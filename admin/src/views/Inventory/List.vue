<template>
  <div class="page-container">
    <div class="page-card">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchForm.articleNo"
          placeholder="货号搜索"
          clearable
          style="width: 180px"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="searchForm.size"
          placeholder="尺码筛选"
          clearable
          style="width: 120px"
        >
          <el-option
            v-for="size in sizeOptions"
            :key="size"
            :label="size"
            :value="size"
          />
        </el-select>
        <el-select
          v-model="searchForm.warningOnly"
          placeholder="库存状态"
          clearable
          style="width: 140px"
        >
          <el-option label="库存预警" :value="true" />
          <el-option label="全部" :value="false" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出Excel
        </el-button>
      </div>

      <!-- 批量操作栏 -->
      <div class="batch-bar" v-if="selectedRows.length > 0">
        <span class="selected-count">已选择 <strong>{{ selectedRows.length }}</strong> 项</span>
        <el-button type="warning" size="small" @click="handleBatchAdjust">
          <el-icon><Edit /></el-icon>
          批量调整
        </el-button>
        <el-button size="small" @click="selectedRows = []">取消选择</el-button>
      </div>

      <!-- 库存表格 -->
      <el-table
        ref="tableRef"
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="articleNo" label="货号" width="160" sortable>
          <template #default="{ row }">
            <a class="article-link" @click="viewDetail(row)">{{ row.articleNo }}</a>
          </template>
        </el-table-column>
        <el-table-column label="尺码范围" width="120">
          <template #default="{ row }">
            {{ row.minSize }}-{{ row.maxSize }}
          </template>
        </el-table-column>
        <el-table-column prop="totalStock" label="总库存" width="120" sortable>
          <template #default="{ row }">
            <span :class="{ 'stock-warning': row.totalStock < 10 }">
              {{ row.totalStock }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="库存状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.totalStock)" size="small">
              {{ getStatusText(row.totalStock) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column label="操作" fixed="right" width="150">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="goToAdjust(row)">调整</el-button>
            <el-button type="success" text size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 库存详情对话框 -->
      <el-dialog
        v-model="detailVisible"
        :title="currentRow ? `库存详情 - ${currentRow.articleNo}` : '库存详情'"
        width="680px"
        class="detail-dialog"
      >
        <div v-if="currentRow" class="detail-content">
          <div class="detail-info">
            <div class="info-item">
              <span class="info-label">货号</span>
              <span class="info-value">{{ currentRow.articleNo }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">品类</span>
              <span class="info-value">{{ currentRow.category || '童鞋' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">总库存</span>
              <span class="info-value highlight">{{ currentRow.totalStock }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">更新时间</span>
              <span class="info-value">{{ currentRow.updateTime }}</span>
            </div>
          </div>

          <h4 class="sizes-title">尺码库存明细</h4>
          <el-table
            :data="currentRow.sizeDetails || []"
            stripe
            border
            size="small"
          >
            <el-table-column prop="size" label="尺码" width="100" align="center" />
            <el-table-column prop="barcode" label="条形码" min-width="180" />
            <el-table-column prop="stock" label="库存" width="100" align="center">
              <template #default="{ row: detailRow }">
                <span :class="{ 'stock-warning': detailRow.stock < 10 }">
                  {{ detailRow.stock }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row: detailRow }">
                <el-tag :type="getStatusType(detailRow.stock)" size="small">
                  {{ getStatusText(detailRow.stock) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <template #footer>
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button type="primary" @click="goToAdjust(currentRow)">调整库存</el-button>
        </template>
      </el-dialog>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getInventoryList } from '@/api/inventory'
import { exportToExcel } from '@/utils/format'
import { ElMessage } from 'element-plus'
import { Edit } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const detailVisible = ref(false)
const currentRow = ref(null)
const selectedRows = ref([])

const searchForm = reactive({ articleNo: '', size: '', warningOnly: undefined })

const sizeOptions = [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37]

const pagination = reactive({ currentPage: 1, pageSize: 20, total: 0 })

onMounted(() => { fetchData() })

async function fetchData() {
  loading.value = true
  try {
    const params = { page: pagination.currentPage, pageSize: pagination.pageSize }
    if (searchForm.articleNo) params.item_code = searchForm.articleNo
    if (searchForm.size) params.size = searchForm.size
    if (searchForm.warningOnly === true) params.warning = true
    
    const res = await getInventoryList(params)
    const listData = Array.isArray(res?.list) ? res.list : []
    const total = res?.total || 0
    
    tableData.value = listData.map(item => {
      const sizes = item.sizes || []
      const totalStock = sizes.reduce((sum, s) => sum + (s.quantity || 0), 0)
      const sortedSizes = [...sizes].sort((a, b) => a.size - b.size)
      
      return {
        id: `${item.item_code}_${sortedSizes[0]?.size || ''}`,
        articleNo: item.item_code || '',
        minSize: sortedSizes[0]?.size ?? '-',
        maxSize: sortedSizes[sortedSizes.length - 1]?.size ?? '-',
        totalStock,
        updateTime: new Date().toLocaleString(),
        category: '童鞋',
        sizeDetails: sortedSizes.map(s => ({
          size: s.size,
          barcode: `${item.item_code}${String(s.size).padStart(2, '0')}`,
          stock: s.quantity || 0
        }))
      }
    })
    
    pagination.total = total
  } catch (err) {
    console.error('获取库存数据失败:', err)
    tableData.value = []
    pagination.total = 0
  } finally { loading.value = false }
}

function handleSearch() { pagination.currentPage = 1; fetchData() }
function handleReset() { searchForm.articleNo = ''; searchForm.size = ''; searchForm.warningOnly = undefined; handleSearch() }
function handleSizeChange() { pagination.currentPage = 1; fetchData() }
function handleCurrentChange() { fetchData() }
function handleSelectionChange(selection) { selectedRows.value = selection }

function handleExport() {
  const exportData = []
  for (const row of tableData.value) {
    const sizeDetails = row.sizeDetails || []
    if (sizeDetails.length === 0) {
      exportData.push({ '货号': row.articleNo, '尺码': '-', '条形码': '-', '库存数量': row.totalStock, '库存状态': getStatusText(row.totalStock), '更新时间': row.updateTime })
    } else {
      for (const detail of sizeDetails) {
        exportData.push({ '货号': row.articleNo, '尺码': detail.size, '条形码': detail.barcode, '库存数量': detail.stock, '库存状态': getStatusText(detail.stock), '更新时间': row.updateTime })
      }
    }
  }
  exportToExcel(exportData, '库存明细')
}

function getStatusType(count) {
  if (count <= 0) return 'danger'
  if (count < 10) return 'warning'
  return 'success'
}

function getStatusText(count) {
  if (count <= 0) return '缺货'
  if (count < 10) return '库存紧张'
  return '正常'
}

function goToAdjust(row) {
  router.push({ path: '/inventory/adjust', query: { articleNo: row.articleNo } })
}

function viewDetail(row) { currentRow.value = { ...row }; detailVisible.value = true }

function handleBatchAdjust() {
  if (selectedRows.value.length === 0) return
  ElMessage.info(`已选择 ${selectedRows.value.length} 个货号，请前往调整页面操作`)
  const articleNos = selectedRows.value.map(r => r.articleNo).join(',')
  router.push({ path: '/inventory/adjust', query: { articleNos } })
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.pagination-container { display: flex; justify-content: flex-end; margin-top: $spacing-lg; }

.stock-warning { color: #F56C6C; font-weight: 600; }

.article-link { color: #409EFF; cursor: pointer; text-decoration: none; font-weight: 500; &:hover { text-decoration: underline; color: #66b1ff; } }

.detail-dialog { :deep(.el-dialog) { border-radius: 12px; } :deep(.el-dialog__title) { font-weight: 600; } }

.detail-content {
  .detail-info { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px; }
  .info-item { display: flex; flex-direction: column; gap: 4px; }
  .info-label { font-size: 12px; color: #999; }
  .info-value { font-size: 15px; color: #333; font-weight: 500; &.highlight { color: #409EFF; font-size: 20px; } }
  .sizes-title { font-size: 15px; font-weight: 600; color: #333; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 1px solid #ebeef5; }
}

.batch-bar { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #fdf6ec; border-radius: 8px; margin-bottom: 12px; border: 1px solid #f5deb3; }
.selected-count { font-size: 14px; color: #666; strong { color: #e6a23c; } }
</style>
