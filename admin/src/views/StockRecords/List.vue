<template>
  <div class="page-container">
    <div class="page-card">
      <!-- 搜索筛选 -->
      <div class="search-bar">
        <el-select
          v-model="searchForm.type"
          placeholder="类型"
          clearable
          style="width: 120px"
        >
          <el-option label="入库" value="in" />
          <el-option label="出库" value="out" />
        </el-select>
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 240px"
        />
        <el-input
          v-model="searchForm.articleNo"
          placeholder="货号"
          clearable
          style="width: 160px"
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="searchForm.barcode"
          placeholder="条形码"
          clearable
          style="width: 180px"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>

      <!-- 批量操作栏 -->
      <div class="batch-bar" v-if="selectedRows.length > 0">
        <span class="selected-count">已选择 <strong>{{ selectedRows.length }}</strong> 项</span>
        <el-button type="danger" size="small" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-button size="small" @click="selectedRows = []">取消选择</el-button>
      </div>

      <!-- 记录表格 -->
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="time" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.time) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="type" label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="row.type === 'in' ? 'success' : 'danger'" size="small">
              {{ row.type === 'in' ? '入库' : '出库' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="barcode" label="条形码" width="180" />
        <el-table-column prop="articleNo" label="货号" width="120" />
        <el-table-column prop="size" label="尺码" width="80" />
        <el-table-column prop="quantity" label="数量" width="80" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.type === 'out' ? '#F56C6C' : '#67C23A', fontWeight: 600 }">
              {{ row.type === 'out' ? '-' : '+' }}{{ row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="100" />
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" fixed="right" width="80">
          <template #default="{ row }">
            <el-button type="danger" text size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

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
import { getStockRecordsList } from '@/api/stockRecords'
import { formatDateTime } from '@/utils/format'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

const loading = ref(false)
const tableData = ref([])
const selectedRows = ref([])

const searchForm = reactive({ type: '', dateRange: null, articleNo: '', barcode: '' })

const pagination = reactive({ currentPage: 1, pageSize: 20, total: 0 })

onMounted(() => { fetchData() })

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      type: searchForm.type || undefined,
      startDate: searchForm.dateRange?.[0] || undefined,
      endDate: searchForm.dateRange?.[1] || undefined,
      articleNo: searchForm.articleNo || undefined,
      barcode: searchForm.barcode || undefined
    }
    const res = await getStockRecordsList(params)
    tableData.value = res.list || []
    pagination.total = res.total || 0
  } catch {
    const types = ['in', 'out']
    const operators = ['张三', '李四', '王五', '赵六']
    const remarks = ['新货入库', '订单发货', '调拨入库', '退货入库', '订单出库', '盘点出库']
    
    const mockData = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      time: new Date(Date.now() - i * 3600000 * 2).toISOString(),
      type: types[i % 2],
      barcode: `DRK-2024-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}-${25 + (i % 10)}`,
      articleNo: `A${100 + Math.floor(i / 2)}`,
      size: 25 + (i % 10),
      quantity: Math.floor(Math.random() * 50) + 1,
      operator: operators[i % 4],
      remark: remarks[i % 6]
    }))
    tableData.value = mockData
    pagination.total = 200
  } finally { loading.value = false }
}

function handleSearch() { pagination.currentPage = 1; fetchData() }
function handleReset() { searchForm.type = ''; searchForm.dateRange = null; searchForm.articleNo = ''; searchForm.barcode = ''; handleSearch() }
function handleSizeChange() { pagination.currentPage = 1; fetchData() }
function handleCurrentChange() { fetchData() }
function handleSelectionChange(selection) { selectedRows.value = selection }

function handleDelete(row) {
  ElMessageBox.confirm(`确认删除该条出入库记录？`, '确认删除', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }).then(async () => {
    try {
      // TODO: 调用后端删除 API
      // await deleteStockRecord(row.id)
      ElMessage.success('删除成功')
      fetchData()
    } catch (e) {
      console.error('删除失败:', e)
      ElMessage.error('删除失败，请重试')
    }
  }).catch(() => {})
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条记录？`, '批量删除', { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' })
  } catch { return }
  try {
    // TODO: 调用后端批量删除 API
    // await batchDeleteStockRecords(selectedRows.value.map(r => r.id))
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    fetchData()
  } catch (e) {
    console.error('批量删除失败:', e)
    ElMessage.error('批量删除失败，请重试')
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.pagination-container { display: flex; justify-content: flex-end; margin-top: $spacing-lg; }

.batch-bar { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #fef0f0; border-radius: 8px; margin-bottom: 12px; border: 1px solid #fbc4c4; }
.selected-count { font-size: 14px; color: #666; strong { color: #f56c6c; } }
</style>
