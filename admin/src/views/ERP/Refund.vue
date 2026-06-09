<template>
  <div class="page-container">
    <div class="page-card">
      <!-- 售后/退款管理 -->
      <div class="search-bar">
        <el-select v-model="searchForm.type" placeholder="售后类型" clearable style="width: 130px">
          <el-option label="仅退款" value="refund_only" />
          <el-option label="退货退款" value="return_refund" />
          <el-option label="换货" value="exchange" />
        </el-select>
        <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 130px">
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
          <el-option label="退款中" value="refunding" />
          <el-option label="已退款" value="refunded" />
          <el-option label="已完成" value="completed" />
        </el-select>
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="申请时间"
          end-placeholder=""
          value-format="YYYY-MM-DD"
          style="width: 220px"
        />
        <el-input v-model="searchForm.keyword" placeholder="订单号/售后单号" clearable style="width: 200px" @keyup.enter="handleSearch" />
        <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon> 查询</el-button>
        <el-button @click="handleReset"><el-icon><Refresh /></el-icon> 重置</el-button>
        <el-button type="success" @click="handleCreate"><el-icon><Plus /></el-icon> 新建售后</el-button>
      </div>

      <!-- 统计卡片 -->
      <el-row :gutter="16" class="stat-row">
        <el-col :span="4">
          <div class="stat-card stat-pending" @click="searchForm.status = 'pending'; handleSearch()">
            <div class="stat-value">{{ stats.pending }}</div>
            <div class="stat-label">待审核</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card stat-approved" @click="searchForm.status = 'approved'; handleSearch()">
            <div class="stat-value">{{ stats.approved }}</div>
            <div class="stat-label">已通过</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card stat-refunding" @click="searchForm.status = 'refunding'; handleSearch()">
            <div class="stat-value">{{ stats.refunding }}</div>
            <div class="stat-label">退款中</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card stat-refunded" @click="searchForm.status = 'refunded'; handleSearch()">
            <div class="stat-value">{{ stats.refunded }}</div>
            <div class="stat-label">已退款</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card stat-rejected" @click="searchForm.status = 'rejected'; handleSearch()">
            <div class="stat-value">{{ stats.rejected }}</div>
            <div class="stat-label">已驳回</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card stat-total">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">本月总计</div>
          </div>
        </el-col>
      </el-row>

      <!-- 批量操作栏 -->
      <div class="batch-bar" v-if="selectedRows.length > 0">
        <span class="selected-count">已选择 <strong>{{ selectedRows.length }}</strong> 项</span>
        <el-button type="success" size="small" @click="handleBatchApprove" v-if="selectedRows.some(r => r.status === 'pending')">批量通过</el-button>
        <el-button type="warning" size="small" @click="handleBatchRefund" v-if="selectedRows.some(r => r.status === 'approved')">批量退款</el-button>
        <el-button size="small" @click="selectedRows = []">取消选择</el-button>
      </div>

      <!-- 售后列表 -->
      <el-table :data="paginatedRefundList" v-loading="loading" stripe border style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column label="售后单号" width="160">
          <template #default="{ row }">
            <span class="refund-no">{{ row.refundNo }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单号" width="160">
          <template #default="{ row }"><span class="order-no" @click="goToOrder(row)" style="cursor:pointer">{{ row.orderNo }}</span></template>
        </el-table-column>
        <el-table-column label="售后类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)" size="small">{{ getTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="商品信息" min-width="200">
          <template #default="{ row }">
            <div class="product-info">
              <img v-if="row.productImage" :src="row.productImage" class="product-thumb" alt="" />
              <div class="product-detail">
                <div class="product-name">{{ row.productName }}</div>
                <div class="product-spec">{{ row.spec }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="退款金额" width="90" align="right">
          <template #default="{ row }">
            <span class="refund-amount">¥{{ row.refundAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请人" width="90">
          <template #default="{ row }">{{ row.applicant }}</template>
        </el-table-column>
        <el-table-column label="申请时间" width="160">
          <template #default="{ row }">{{ row.applyTime }}</template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" type="success" text size="small" @click="handleApprove(row)">通过</el-button>
            <el-button v-if="row.status === 'pending'" type="danger" text size="small" @click="handleReject(row)">驳回</el-button>
            <el-button type="primary" text size="small" @click="handleView(row)">详情</el-button>
            <el-button v-if="row.status === 'approved'" type="warning" text size="small" @click="handleRefund(row)">退款</el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 新建售后对话框 -->
    <el-dialog v-model="createDialogVisible" title="新建售后" width="550px">
      <el-form :model="createForm" label-width="90px">
        <el-form-item label="关联订单" required>
          <el-select v-model="createForm.orderId" placeholder="选择订单" style="width: 100%" filterable>
            <el-option v-for="o in orderOptions" :key="o.id" :label="`${o.orderNo} - ${o.buyer}`" :value="o.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="售后类型" required>
          <el-radio-group v-model="createForm.type">
            <el-radio value="refund_only">仅退款</el-radio>
            <el-radio value="return_refund">退货退款</el-radio>
            <el-radio value="exchange">换货</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="退款金额" required>
          <el-input-number v-model="createForm.refundAmount" :min="0" :precision="2" :step="10" style="width: 150px" />
        </el-form-item>
        <el-form-item label="退款原因" required>
          <el-select v-model="createForm.reason" placeholder="选择退款原因" style="width: 100%">
            <el-option label="商品质量问题" value="quality" />
            <el-option label="尺码不合适" value="size" />
            <el-option label="发错货" value="wrong_item" />
            <el-option label="不喜欢/不想要" value="dont_want" />
            <el-option label="商品破损" value="damaged" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input v-model="createForm.remark" type="textarea" :rows="3" placeholder="详细描述问题..." />
        </el-form-item>
        <el-form-item label="凭证图片">
          <el-upload action="#" list-type="picture-card" :auto-upload="false" :limit="5">
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreate" :loading="saving">提交</el-button>
      </template>
    </el-dialog>

    <!-- 售后详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="售后详情" width="650px">
      <template v-if="currentRefund">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="售后单号">{{ currentRefund.refundNo }}</el-descriptions-item>
          <el-descriptions-item label="订单号">{{ currentRefund.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="售后类型">{{ getTypeName(currentRefund.type) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentRefund.status)" size="small">{{ getStatusName(currentRefund.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="商品信息" :span="2">
            {{ currentRefund.productName }} ({{ currentRefund.spec }})
          </el-descriptions-item>
          <el-descriptions-item label="退款金额">
            <span class="refund-amount">¥{{ currentRefund.refundAmount.toFixed(2) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="退款原因">{{ getReasonName(currentRefund.reason) }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentRefund.applicant }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ currentRefund.applyTime }}</el-descriptions-item>
          <el-descriptions-item label="备注说明" :span="2">{{ currentRefund.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 操作记录 -->
        <div class="action-log" v-if="currentRefund.actions?.length">
          <h4>操作记录</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(action, i) in currentRefund.actions"
              :key="i"
              :timestamp="action.time"
              :type="i === 0 ? 'primary' : 'info'"
            >
              {{ action.desc }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </template>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 驳回对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="驳回售后申请" width="450px">
      <el-form>
        <el-form-item label="驳回原因" required>
          <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入驳回原因..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject" :loading="saving">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const saving = ref(false)

const refundList = ref([])
const selectedRows = ref([])
const searchForm = reactive({ type: '', status: '', dateRange: null, keyword: '' })
const pagination = reactive({ currentPage: 1, pageSize: 20, total: 0 })

const createDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const currentRefund = ref(null)
const rejectReason = ref('')

const createForm = reactive({
  orderId: '', type: 'refund_only', refundAmount: 0, reason: '', remark: ''
})

const orderOptions = ref([
  { id: 1, orderNo: 'KTT2026060800001', buyer: '张**' },
  { id: 2, orderNo: 'KTT2026060800002', buyer: '李**' },
  { id: 3, orderNo: 'KTT2026060800003', buyer: '王**' },
])

const stats = reactive({ pending: 0, approved: 0, refunding: 0, refunded: 0, rejected: 0, total: 0 })

onMounted(() => { fetchData() })

async function fetchData() {
  loading.value = true
  try {
    const reasons = ['quality', 'size', 'wrong_item', 'dont_want', 'damaged']
    const products = [
      { name: '江博士童鞋 学步鞋S14A2020DM', spec: '白色 27码' },
      { name: '江博士童鞋 休闲鞋B1404559', spec: '粉色 30码' },
      { name: '江博士童鞋 运动鞋S14A2025AM', spec: '蓝色 28码' },
    ]

    refundList.value = Array.from({ length: 15 }, (_, i) => {
      const statuses = ['pending', 'approved', 'refunding', 'refunded', 'rejected', 'completed']
      const types = ['refund_only', 'return_refund', 'exchange']
      const status = statuses[i % 6]
      const p = products[i % 3]

      return {
        id: i + 1,
        refundNo: `AS202606${String(80 + i).padStart(3, '0')}`,
        orderNo: `KTT202606${String(1 + Math.floor(i / 3)).padStart(5, '0')}`,
        type: types[i % 3],
        status,
        productName: p.name,
        spec: p.spec,
        refundAmount: 89 + i * 12,
        reason: reasons[i % 5],
        applicant: ['张**', '李**', '王**', '赵**'][i % 4],
        applyTime: `2026-06-${String(8 - Math.floor(i / 4)).padStart(2, '0')} ${10 + (i % 8)}:${String(i * 7 % 60).padStart(2, '0')}`,
        remark: i % 3 === 0 ? '商品有质量问题，要求退款' : '',
        actions: [
          { time: `2026-06-08 ${10 + i}:00`, desc: '用户提交售后申请' },
          status !== 'pending' ? { time: `2026-06-08 ${11 + i}:30`, desc: status === 'approved' ? '审核通过' : status === 'rejected' ? '审核驳回' : '退款处理中' } : null,
          status === 'refunded' ? { time: `2026-06-08 ${12 + i}:00`, desc: '退款成功，金额已退回' } : null,
        ].filter(Boolean)
      }
    })

    // 统计
    stats.pending = refundList.value.filter(r => r.status === 'pending').length
    stats.approved = refundList.value.filter(r => r.status === 'approved').length
    stats.refunding = refundList.value.filter(r => r.status === 'refunding').length
    stats.refunded = refundList.value.filter(r => r.status === 'refunded').length
    stats.rejected = refundList.value.filter(r => r.status === 'rejected').length
    stats.total = refundList.value.length
    pagination.total = refundList.value.length
  } finally { loading.value = false }
}

const filteredRefundList = computed(() => {
  let list = refundList.value
  if (searchForm.type) list = list.filter(r => r.type === searchForm.type)
  if (searchForm.status) list = list.filter(r => r.status === searchForm.status)
  if (searchForm.keyword) {
    const kw = searchForm.keyword.toLowerCase()
    list = list.filter(r => r.refundNo.toLowerCase().includes(kw) || r.orderNo.toLowerCase().includes(kw))
  }
  pagination.total = list.length
  return list
})

const paginatedRefundList = computed(() => {
  const list = filteredRefundList.value
  const start = (pagination.currentPage - 1) * pagination.pageSize
  return list.slice(start, start + pagination.pageSize)
})

function handleSearch() { pagination.currentPage = 1 }
function handleReset() { searchForm.type = ''; searchForm.status = ''; searchForm.dateRange = null; searchForm.keyword = '' }
function handleSizeChange() { pagination.currentPage = 1 }
function handleCurrentChange() { /* 分页逻辑由 paginatedRefundList computed 处理 */ }

function handleSelectionChange(rows) { selectedRows.value = rows }

function handleBatchApprove() {
  const pendingRows = selectedRows.value.filter(r => r.status === 'pending')
  if (pendingRows.length === 0) { ElMessage.warning('选中的售后单中没有待审核的'); return }
  ElMessageBox.confirm(`确认通过 ${pendingRows.length} 个售后申请？`, '批量审核', {
    confirmButtonText: '确认', cancelButtonText: '取消', type: 'success'
  }).then(() => {
    pendingRows.forEach(row => {
      row.status = row.type === 'exchange' ? 'completed' : 'approved'
      row.actions.push({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '-'), desc: '审核通过' })
      stats.pending--
      if (row.status === 'approved') stats.approved++
      if (row.status === 'completed') stats.total-- // exchange completed doesn't increment approved
    })
    ElMessage.success(`已通过 ${pendingRows.length} 个售后申请`)
    selectedRows.value = []
  }).catch(() => {})
}

function handleBatchRefund() {
  const approvedRows = selectedRows.value.filter(r => r.status === 'approved')
  if (approvedRows.length === 0) { ElMessage.warning('选中的售后单中没有待退款的'); return }
  ElMessageBox.confirm(`确认对 ${approvedRows.length} 个售后申请执行退款，总金额 ¥${approvedRows.reduce((sum, r) => sum + r.refundAmount, 0).toFixed(2)}？`, '批量退款', {
    confirmButtonText: '确认退款', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    approvedRows.forEach(row => {
      row.status = 'refunded'
      row.actions.push({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '-'), desc: `退款成功，金额 ¥${row.refundAmount.toFixed(2)} 已退回` })
      stats.approved--
      stats.refunded++
    })
    ElMessage.success(`退款成功，共 ${approvedRows.length} 笔`)
    selectedRows.value = []
  }).catch(() => {})
}

// 类型/状态
function getTypeName(type) {
  return { refund_only: '仅退款', return_refund: '退货退款', exchange: '换货' }[type] || type
}
function getTypeColor(type) {
  return { refund_only: 'danger', return_refund: 'warning', exchange: '' }[type] || 'info'
}
function getStatusName(status) {
  return { pending: '待审核', approved: '已通过', rejected: '已驳回', refunding: '退款中', refunded: '已退款', completed: '已完成' }[status] || status
}
function getStatusType(status) {
  return { pending: 'warning', approved: 'success', rejected: 'danger', refunding: 'primary', refunded: 'info', completed: '' }[status] || 'info'
}
function getReasonName(reason) {
  return { quality: '商品质量问题', size: '尺码不合适', wrong_item: '发错货', dont_want: '不喜欢/不想要', damaged: '商品破损', other: '其他' }[reason] || reason
}

// 操作
function handleCreate() {
  Object.keys(createForm).forEach(k => createForm[k] = typeof createForm[k] === 'number' ? 0 : '')
  createDialogVisible.value = true
}

function confirmCreate() {
  if (!createForm.orderId) { ElMessage.warning('请选择关联订单'); return }
  if (!createForm.type) { ElMessage.warning('请选择售后类型'); return }
  if (createForm.refundAmount <= 0) { ElMessage.warning('请输入退款金额'); return }
  if (!createForm.reason) { ElMessage.warning('请选择退款原因'); return }

  saving.value = true
  setTimeout(() => {
    refundList.value.unshift({
      id: Date.now(),
      refundNo: `AS202606${String(refundList.value.length + 1).padStart(3, '0')}`,
      orderNo: orderOptions.value.find(o => o.id === createForm.orderId)?.orderNo || '',
      type: createForm.type,
      status: 'pending',
      productName: '江博士童鞋 学步鞋S14A2020DM',
      spec: '白色 27码',
      refundAmount: createForm.refundAmount,
      reason: createForm.reason,
      applicant: '当前用户',
      applyTime: new Date().toLocaleString('zh-CN').replace(/\//g, '-'),
      remark: createForm.remark,
      actions: [{ time: new Date().toLocaleString('zh-CN').replace(/\//g, '-'), desc: '用户提交售后申请' }]
    })
    stats.pending++
    stats.total++
    saving.value = false
    createDialogVisible.value = false
    ElMessage.success('售后申请已提交')
  }, 500)
}

function handleView(row) {
  currentRefund.value = row
  detailDialogVisible.value = true
}

function handleApprove(row) {
  ElMessageBox.confirm(`确认通过售后申请 ${row.refundNo}？`, '审核通过', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'success' })
    .then(() => {
      row.status = row.type === 'exchange' ? 'completed' : 'approved'
      row.actions.push({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '-'), desc: '审核通过' })
      stats.pending--
      if (row.status === 'approved') stats.approved++
      ElMessage.success('审核通过')
    })
    .catch(() => {})
}

function handleReject(row) {
  rejectReason.value = ''
  currentRefund.value = row
  rejectDialogVisible.value = true
}

function confirmReject() {
  if (!rejectReason.value) { ElMessage.warning('请输入驳回原因'); return }
  const row = currentRefund.value
  row.status = 'rejected'
  row.actions.push({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '-'), desc: `审核驳回：${rejectReason.value}` })
  stats.pending--
  stats.rejected++
  saving.value = false
  rejectDialogVisible.value = false
  ElMessage.success('已驳回')
}

function handleRefund(row) {
  ElMessageBox.confirm(`确认退款 ¥${row.refundAmount.toFixed(2)}？`, '确认退款', { confirmButtonText: '确认退款', cancelButtonText: '取消', type: 'warning' })
    .then(() => {
      row.status = 'refunded'
      row.actions.push({ time: new Date().toLocaleString('zh-CN').replace(/\//g, '-'), desc: `退款成功，金额 ¥${row.refundAmount.toFixed(2)} 已退回` })
      stats.approved--
      stats.refunded++
      ElMessage.success('退款成功')
    })
    .catch(() => {})
}

function goToOrder(row) {
  router.push({ path: '/erp/orders', query: { orderNo: row.orderNo } })
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.search-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 16px;
}

.batch-bar { display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: #f0f9eb; border-radius: 6px; margin-bottom: 12px; border: 1px solid #c2e7b0; }
.selected-count { font-size: 13px; color: #666; strong { color: #67C23A; } }

.pagination-container { display: flex; justify-content: flex-end; margin-top: $spacing-lg; }

.stat-row { margin-bottom: 20px; }

.stat-card {
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
}

.stat-value { font-size: 28px; font-weight: 700; }
.stat-label { font-size: 13px; margin-top: 4px; }

.stat-pending { background: #fdf6ec; .stat-value { color: #E6A23C; } .stat-label { color: #B08830; } }
.stat-approved { background: #f0f9eb; .stat-value { color: #67C23A; } .stat-label { color: #529B2E; } }
.stat-refunding { background: #ecf5ff; .stat-value { color: #409EFF; } .stat-label { color: #3375C2; } }
.stat-refunded { background: #f4f4f5; .stat-value { color: #909399; } .stat-label { color: #73767A; } }
.stat-rejected { background: #fef0f0; .stat-value { color: #F56C6C; } .stat-label { color: #C45656; } }
.stat-total { background: #f5f7fa; .stat-value { color: #303133; } .stat-label { color: #606266; } }

.refund-no { font-family: monospace; color: #E6A23C; font-size: 13px; }
.order-no { color: #409EFF; font-family: monospace; font-size: 13px; }
.refund-amount { color: #F56C6C; font-weight: 600; }

.product-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.product-thumb {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
  background: #f5f7fa;
}

.product-detail {
  .product-name { font-size: 13px; color: #333; }
  .product-spec { font-size: 12px; color: #999; }
}

.action-log {
  margin-top: 20px;
  h4 { margin: 0 0 12px; font-size: 14px; color: #333; }
}
</style>
