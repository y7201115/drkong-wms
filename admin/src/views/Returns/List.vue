<template>
  <div class="page-container">
    <div class="page-card">
      <!-- 搜索筛选 -->
      <div class="search-bar">
        <el-select
          v-model="searchForm.status"
          placeholder="状态"
          clearable
          style="width: 140px"
        >
          <el-option label="待处理" value="pending" />
          <el-option label="已处理" value="processed" />
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
          v-model="searchForm.keyword"
          placeholder="快递单号/货号/条形码"
          clearable
          style="width: 200px"
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
        <el-button type="success" @click="goToCreate">
          <el-icon><Plus /></el-icon>
          新建退件
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
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

      <!-- 退件表格 -->
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        row-key="express_no"
        :expand-row-keys="expandRowKeys"
        @expand-change="handleExpandChange"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column type="expand" width="50">
          <template #default="{ row }">
            <div class="expand-content">
              <div class="expand-header">
                <span>包裹内商品（{{ row.items ? row.items.length : 0 }} 件）</span>
              </div>
              <el-table :data="row.items || []" size="small" border>
                <el-table-column prop="barcode" label="条形码" width="200" />
                <el-table-column prop="item_code" label="货号" width="140" />
                <el-table-column prop="size" label="尺码" width="80" />
                <el-table-column prop="return_reason" label="退件原因" />
                <el-table-column prop="remark" label="备注" />
              </el-table>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="express_no" label="快递单号" width="180" />
        
        <el-table-column prop="express_company" label="快递公司" width="100">
          <template #default="{ row }">
            {{ getCompanyName(row.express_company) }}
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="退件时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="商品数量" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.items ? row.items.length : 0 }} 件</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" fixed="right" width="260">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="viewDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              text
              size="small"
              @click="handleUpdateStatus(row, 'processed')"
            >标记处理</el-button>
            <el-button
              v-if="row.status === 'processed'"
              type="warning"
              text
              size="small"
              @click="handleUpdateStatus(row, 'pending')"
            >撤销</el-button>
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

    <!-- 状态更新对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="400px">
      <el-form label-width="80px">
        <el-form-item label="备注">
          <el-input v-model="dialogRemark" type="textarea" :rows="3" placeholder="请输入操作备注（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmUpdateStatus" :loading="submitting">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getReturnsList, updateReturnStatus } from '@/api/returns'
import { formatDateTime, exportToExcel } from '@/utils/format'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const expandRowKeys = ref([])
const selectedRows = ref([])

const searchForm = reactive({ status: '', dateRange: null, keyword: '' })

const pagination = reactive({ currentPage: 1, pageSize: 20, total: 0 })

const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogRemark = ref('')
const currentRow = ref(null)
const targetStatus = ref('')

onMounted(() => { fetchData() })

async function fetchData() {
  loading.value = true
  expandRowKeys.value = []
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
      status: searchForm.status || undefined,
      startDate: searchForm.dateRange?.[0] || undefined,
      endDate: searchForm.dateRange?.[1] || undefined,
      keyword: searchForm.keyword || undefined
    }
    const res = await getReturnsList(params)
    tableData.value = res.list || []
    pagination.total = res.total || 0
  } catch (e) {
    console.error('获取退件列表失败:', e)
    const mockGroups = [
      { express_no: 'SF1234567890123', express_company: 'SF', created_at: new Date().toISOString(), status: 'pending', items: [{ id: 1, barcode: 'B1404559--PIK27-', item_code: 'B1404559', size: 27, return_reason: '尺码不合', remark: '' }] },
      { express_no: 'YT887275459207', express_company: 'YTO', created_at: new Date(Date.now() - 86400000).toISOString(), status: 'processed', items: [{ id: 2, barcode: 'S14A2020DM0290', item_code: 'S14A2020DM', size: 29, return_reason: '质量问题', remark: '鞋面有划痕' }] }
    ]
    tableData.value = mockGroups
    pagination.total = mockGroups.length
  } finally { loading.value = false }
}

function handleSearch() { pagination.currentPage = 1; fetchData() }
function handleReset() { searchForm.status = ''; searchForm.dateRange = null; searchForm.keyword = ''; handleSearch() }
function handleSizeChange() { pagination.currentPage = 1; fetchData() }
function handleCurrentChange() { fetchData() }
function handleExpandChange(row, expandedRows) { expandRowKeys.value = expandedRows.map(r => r.express_no) }
function handleSelectionChange(selection) { selectedRows.value = selection }

function getCompanyName(code) {
  const map = { SF: '顺丰速运', ZTO: '中通快递', YTO: '圆通速递', YUN: '韵达快递', STO: '申通快递', BS: '百世快递', JT: '极兔速递', EMS: '邮政快递', JD: '京东物流', OTHER: '其他' }
  return map[code] || code || '-'
}

function getStatusType(status) {
  const map = { pending: 'warning', processed: 'success' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { pending: '待处理', processed: '已处理' }
  return map[status] || status
}

function goToCreate() { router.push('/returns/create') }

function handleExport() {
  const exportData = []
  for (const group of tableData.value) {
    if (group.items && group.items.length > 0) {
      for (const item of group.items) {
        exportData.push({ '快递单号': group.express_no, '快递公司': getCompanyName(group.express_company), '退件时间': formatDateTime(group.created_at), '状态': getStatusText(group.status), '条形码': item.barcode, '货号': item.item_code, '尺码': item.size, '退件原因': item.return_reason, '备注': item.remark || '' })
      }
    }
  }
  if (exportData.length === 0) { ElMessage.warning('没有数据可导出'); return }
  exportToExcel(exportData, '退件明细')
}

function viewDetail(row) {
  const firstItem = row.items && row.items.length > 0 ? row.items[0] : row
  router.push(`/returns/detail/${firstItem.id}`)
}

function handleUpdateStatus(row, status) {
  currentRow.value = row; targetStatus.value = status
  dialogTitle.value = status === 'processed' ? '确认标记为已处理' : '确认撤销处理'
  dialogRemark.value = ''; dialogVisible.value = true
}

async function confirmUpdateStatus() {
  if (!currentRow.value) return
  submitting.value = true
  try {
    if (currentRow.value.items && currentRow.value.items.length > 0) {
      for (const item of currentRow.value.items) {
        await updateReturnStatus({ id: item.id, status: targetStatus.value, remark: dialogRemark.value })
      }
    } else {
      await updateReturnStatus({ id: currentRow.value.id, status: targetStatus.value, remark: dialogRemark.value })
    }
    ElMessage.success('状态更新成功'); dialogVisible.value = false; fetchData()
  } catch (e) { console.error('更新失败:', e); ElMessage.error('状态更新失败，请重试') }
  finally { submitting.value = false }
}

function handleDelete(row) {
  ElMessageBox.confirm(`确认删除快递单号为 "${row.express_no}" 的退件记录？`, '确认删除', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }).then(async () => {
    try {
      // TODO: 调用后端删除 API
      // await deleteReturn(row.express_no)
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
    // await batchDeleteReturns(selectedRows.value.map(r => r.express_no))
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

.expand-content { padding: 12px 20px; background: #f5f7fa; .expand-header { font-size: 13px; color: #666; margin-bottom: 8px; } }

.batch-bar { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #fef0f0; border-radius: 8px; margin-bottom: 12px; border: 1px solid #fbc4c4; }
.selected-count { font-size: 14px; color: #666; strong { color: #f56c6c; } }
</style>
