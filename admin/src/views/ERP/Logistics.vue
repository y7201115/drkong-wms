<template>
  <div class="page-container">
    <div class="page-card">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 物流跟踪 -->
        <el-tab-pane label="物流跟踪" name="tracking">
          <!-- 搜索栏 -->
          <div class="search-bar">
            <el-input v-model="searchForm.keyword" placeholder="快递单号/订单号" clearable style="width: 200px" @keyup.enter="handleSearch" />
            <el-select v-model="searchForm.status" placeholder="物流状态" clearable style="width: 140px">
              <el-option label="待发货" value="pending" />
              <el-option label="运输中" value="transit" />
              <el-option label="已签收" value="signed" />
            </el-select>
            <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon> 查询</el-button>
            <el-button @click="handleReset"><el-icon><Refresh /></el-icon> 重置</el-button>
          </div>

          <!-- 批量操作栏 -->
          <div class="batch-bar" v-if="selectedTrackingRows.length > 0">
            <span class="selected-count">已选择 <strong>{{ selectedTrackingRows.length }}</strong> 项</span>
            <el-button type="primary" size="small" @click="handleBatchQueryTracking">批量查询物流</el-button>
            <el-button size="small" @click="selectedTrackingRows = []">取消选择</el-button>
          </div>

          <!-- 物流表格 -->
          <el-table :data="tableData" v-loading="loading" stripe border style="width: 100%" @selection-change="handleTrackingSelection">
            <el-table-column type="selection" width="50" />
            <el-table-column prop="orderNo" label="订单号" width="200">
              <template #default="{ row }"><span class="order-no">{{ row.orderNo }}</span></template>
            </el-table-column>
            <el-table-column prop="expressNo" label="快递单号" width="180">
              <template #default="{ row }"><span class="express-no">{{ row.expressNo }}</span></template>
            </el-table-column>
            <el-table-column label="快递公司" width="100">
              <template #default="{ row }">{{ getCompanyName(row.expressCompany) }}</template>
            </el-table-column>
            <el-table-column prop="buyer" label="收件人" width="100" />
            <el-table-column prop="phone" label="联系电话" width="130" />
            <el-table-column prop="address" label="收货地址" min-width="200" show-overflow-tooltip />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="shipTime" label="发货时间" width="170" />
            <el-table-column label="操作" fixed="right" width="100">
              <template #default="{ row }">
                <el-button type="primary" text size="small" @click="viewTrace(row)">轨迹</el-button>
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
        </el-tab-pane>

        <!-- 电子面单账号 -->
        <el-tab-pane label="电子面单账号" name="accounts">
          <div class="account-header">
            <el-button type="primary" @click="handleAddAccount"><el-icon><Plus /></el-icon> 添加账号</el-button>
            <span class="account-tip">支持快递100、菜鸟、顺丰等电子面单平台账号接入</span>
          </div>

          <el-table :data="accountList" v-loading="accountLoading" stripe border style="width: 100%">
            <el-table-column prop="name" label="账号名称" width="150" />
            <el-table-column label="平台类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getPlatformType(row.platform)" size="small">{{ getPlatformName(row.platform) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="快递公司" width="120">
              <template #default="{ row }">{{ getCompanyName(row.expressCompany) }}</template>
            </el-table-column>
            <el-table-column prop="key" label="账号Key/AppId" width="200">
              <template #default="{ row }"><span class="key-text">{{ maskKey(row.key) }}</span></template>
            </el-table-column>
            <el-table-column label="模板名称" width="150">
              <template #default="{ row }">{{ row.templateName || '-' }}</template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-switch
                  v-model="row.enabled"
                  size="small"
                  @change="handleToggleAccount(row)"
                  :active-text="''"
                  :inactive-text="''"
                />
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="添加时间" width="170" />
            <el-table-column label="操作" fixed="right" width="180">
              <template #default="{ row }">
                <el-button type="primary" text size="small" @click="handleEditAccount(row)">编辑</el-button>
                <el-button type="primary" text size="small" @click="handleTestAccount(row)">测试</el-button>
                <el-button type="danger" text size="small" @click="handleDeleteAccount(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-empty v-if="accountList.length === 0" description="暂无电子面单账号，请点击添加" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 物流轨迹对话框 -->
    <el-dialog v-model="traceDialogVisible" title="物流轨迹" width="500px">
      <el-timeline>
        <el-timeline-item
          v-for="(trace, index) in traceList"
          :key="index"
          :timestamp="trace.time"
          :type="index === 0 ? 'primary' : 'info'"
        >
          {{ trace.desc }}
        </el-timeline-item>
      </el-timeline>
      <template #footer>
        <el-button @click="traceDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑电子面单账号对话框 -->
    <el-dialog v-model="accountDialogVisible" :title="isEdit ? '编辑电子面单账号' : '添加电子面单账号'" width="550px">
      <el-form :model="accountForm" label-width="100px" ref="accountFormRef">
        <el-form-item label="账号名称" required>
          <el-input v-model="accountForm.name" placeholder="如：顺丰月结账号-张三" />
        </el-form-item>
        <el-form-item label="平台类型" required>
          <el-select v-model="accountForm.platform" placeholder="选择平台" style="width: 100%" @change="onPlatformChange">
            <el-option label="快递100" value="kd100" />
            <el-option label="菜鸟电子面单" value="cainiao" />
            <el-option label="顺丰开放平台" value="sf" />
            <el-option label="中通开放平台" value="zto" />
            <el-option label="自定义API" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="快递公司" required>
          <el-select v-model="accountForm.expressCompany" placeholder="选择快递公司" style="width: 100%">
            <el-option v-for="(name, code) in companyMap" :key="code" :label="name" :value="code" />
          </el-select>
        </el-form-item>

        <!-- 快递100 配置 -->
        <template v-if="accountForm.platform === 'kd100'">
          <el-form-item label="授权Key" required>
            <el-input v-model="accountForm.key" placeholder="快递100授权Key" />
          </el-form-item>
          <el-form-item label="Secret">
            <el-input v-model="accountForm.secret" placeholder="快递100Secret（选填）" type="password" show-password />
          </el-form-item>
          <el-form-item label="模板ID">
            <el-input v-model="accountForm.templateId" placeholder="电子面单模板ID" />
          </el-form-item>
        </template>

        <!-- 菜鸟配置 -->
        <template v-if="accountForm.platform === 'cainiao'">
          <el-form-item label="AppKey" required>
            <el-input v-model="accountForm.key" placeholder="菜鸟AppKey" />
          </el-form-item>
          <el-form-item label="AppSecret" required>
            <el-input v-model="accountForm.secret" placeholder="菜鸟AppSecret" type="password" show-password />
          </el-form-item>
          <el-form-item label="物流商Code">
            <el-input v-model="accountForm.logisticsCode" placeholder="物流商编码（如：SFEXPRESS）" />
          </el-form-item>
          <el-form-item label="网点Code">
            <el-input v-model="accountForm.branchCode" placeholder="网点编码（选填）" />
          </el-form-item>
        </template>

        <!-- 顺丰配置 -->
        <template v-if="accountForm.platform === 'sf'">
          <el-form-item label="月结卡号" required>
            <el-input v-model="accountForm.key" placeholder="顺丰月结卡号" />
          </el-form-item>
          <el-form-item label="校验码">
            <el-input v-model="accountForm.secret" placeholder="顺丰校验码" type="password" show-password />
          </el-form-item>
          <el-form-item label="模板名称">
            <el-input v-model="accountForm.templateName" placeholder="如：顺丰标准面单" />
          </el-form-item>
        </template>

        <!-- 中通配置 -->
        <template v-if="accountForm.platform === 'zto'">
          <el-form-item label="ClientId" required>
            <el-input v-model="accountForm.key" placeholder="中通ClientId" />
          </el-form-item>
          <el-form-item label="ClientSecret" required>
            <el-input v-model="accountForm.secret" placeholder="中通ClientSecret" type="password" show-password />
          </el-form-item>
          <el-form-item label="网点编码">
            <el-input v-model="accountForm.branchCode" placeholder="网点编码" />
          </el-form-item>
        </template>

        <!-- 自定义API配置 -->
        <template v-if="accountForm.platform === 'custom'">
          <el-form-item label="API地址" required>
            <el-input v-model="accountForm.apiUrl" placeholder="https://api.example.com/waybill" />
          </el-form-item>
          <el-form-item label="账号Key" required>
            <el-input v-model="accountForm.key" placeholder="API认证Key" />
          </el-form-item>
          <el-form-item label="模板名称">
            <el-input v-model="accountForm.templateName" placeholder="面单模板名称" />
          </el-form-item>
        </template>

        <el-form-item label="备注">
          <el-input v-model="accountForm.remark" type="textarea" :rows="2" placeholder="备注（选填）" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="accountDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSaveAccount" :loading="savingAccount">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('tracking')

// 物流跟踪
const loading = ref(false)
const tableData = ref([])
const selectedTrackingRows = ref([])
const pagination = reactive({ currentPage: 1, pageSize: 20, total: 0 })
const searchForm = reactive({ keyword: '', status: '' })
const traceDialogVisible = ref(false)
const traceList = ref([])

const companyMap = { SF: '顺丰速运', ZTO: '中通快递', YTO: '圆通速递', YUN: '韵达快递', STO: '申通快递', JT: '极兔速递', EMS: '邮政快递', JD: '京东物流' }
function getCompanyName(code) { return companyMap[code] || code || '-' }
function getCompanyCode(name) { return Object.entries(companyMap).find(([_, n]) => n === name)?.[0] || '' }

function getStatusType(status) {
  const map = { pending: 'warning', transit: 'primary', signed: 'success' }
  return map[status] || 'info'
}
function getStatusText(status) {
  const map = { pending: '待发货', transit: '运输中', signed: '已签收' }
  return map[status] || status
}

onMounted(() => { fetchData(); fetchAccounts() })

async function fetchData() {
  loading.value = true
  try {
    const expressCompanies = Object.keys(companyMap)
    tableData.value = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      orderNo: `KTT20260608${String(i + 1).padStart(5, '0')}`,
      expressNo: `${expressCompanies[i % 8]}${Math.random().toString().slice(2, 14)}`,
      expressCompany: expressCompanies[i % 8],
      buyer: `买家${i + 1}`,
      phone: `138****${String(1234 + i).padStart(4, '0')}`,
      address: `${['北京', '上海', '广州', '深圳'][i % 4]}市xx区xx路xx号`,
      status: ['pending', 'transit', 'signed'][i % 3],
      shipTime: `2026-06-${String(8 - Math.floor(i / 7)).padStart(2, '0')} ${10 + (i % 8)}:${String(i * 3 % 60).padStart(2, '0')}`
    }))
    pagination.total = 68
  } finally { loading.value = false }
}

function handleSearch() { pagination.currentPage = 1; fetchData() }
function handleReset() { searchForm.keyword = ''; searchForm.status = ''; handleSearch() }
function handleSizeChange() { pagination.currentPage = 1; fetchData() }
function handleCurrentChange() { fetchData() }

function viewTrace(row) {
  traceList.value = [
    { time: `${row.shipTime} 揽收`, desc: '快件已从xx网点揽收' },
    { time: `${row.shipTime} 发出`, desc: '快件已从xx转运中心发出' },
    { time: '运输中', desc: '快件正在运输途中' },
  ]
  traceDialogVisible.value = true
}

function handleTrackingSelection(rows) { selectedTrackingRows.value = rows }

function handleBatchQueryTracking() {
  if (selectedTrackingRows.value.length === 0) { ElMessage.warning('请选择物流单号'); return }
  ElMessage.success(`正在查询 ${selectedTrackingRows.value.length} 个物流单号的实时状态...`)
  // 模拟批量查询
  selectedTrackingRows.value.forEach(row => {
    if (row.status === 'transit') {
      // 30% 概率更新为已签收
      if (Math.random() > 0.7) {
        row.status = 'signed'
      }
    }
  })
  ElMessage.success(`查询完成`)
  selectedTrackingRows.value = []
}

// 电子面单账号
const accountLoading = ref(false)
const accountList = ref([])
const accountDialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const savingAccount = ref(false)
const accountFormRef = ref(null)

const accountForm = reactive({
  name: '',
  platform: '',
  expressCompany: '',
  key: '',
  secret: '',
  templateId: '',
  templateName: '',
  logisticsCode: '',
  branchCode: '',
  apiUrl: '',
  remark: ''
})

const platformFields = {
  kd100: ['key', 'secret', 'templateId'],
  cainiao: ['key', 'secret', 'logisticsCode', 'branchCode'],
  sf: ['key', 'secret', 'templateName'],
  zto: ['key', 'secret', 'branchCode'],
  custom: ['apiUrl', 'key', 'templateName']
}

function getPlatformName(platform) {
  const map = { kd100: '快递100', cainiao: '菜鸟', sf: '顺丰', zto: '中通', custom: '自定义' }
  return map[platform] || platform
}
function getPlatformType(platform) {
  const map = { kd100: '', cainiao: 'success', sf: 'warning', zto: 'primary', custom: 'info' }
  return map[platform] || ''
}
function maskKey(key) {
  if (!key) return '-'
  return key.length > 10 ? key.slice(0, 6) + '****' + key.slice(-4) : '****'
}

async function fetchAccounts() {
  accountLoading.value = true
  try {
    const stored = localStorage.getItem('waybill_accounts')
    if (stored) {
      accountList.value = JSON.parse(stored)
    } else {
      // 默认模拟数据
      accountList.value = [
        {
          id: 1,
          name: '顺丰月结-主力',
          platform: 'sf',
          expressCompany: 'SF',
          key: 'SF123456789',
          secret: 'test****',
          templateName: '顺丰标准面单',
          enabled: true,
          createTime: '2026-06-01 10:00'
        },
        {
          id: 2,
          name: '快递100-中通',
          platform: 'kd100',
          expressCompany: 'ZTO',
          key: 'kd100_abc123def456',
          templateId: 'tmpl_zto_001',
          enabled: true,
          createTime: '2026-06-03 14:30'
        }
      ]
      saveAccounts()
    }
  } finally { accountLoading.value = false }
}

function saveAccounts() {
  localStorage.setItem('waybill_accounts', JSON.stringify(accountList.value))
}

function handleAddAccount() {
  isEdit.value = false
  editingId.value = null
  Object.keys(accountForm).forEach(k => accountForm[k] = '')
  accountDialogVisible.value = true
}

function handleEditAccount(row) {
  isEdit.value = true
  editingId.value = row.id
  Object.keys(accountForm).forEach(k => {
    accountForm[k] = row[k] || ''
  })
  accountDialogVisible.value = true
}

function onPlatformChange() {
  // 切换平台时清空非共用字段
  const common = ['name', 'platform', 'expressCompany']
  Object.keys(accountForm).forEach(k => {
    if (!common.includes(k)) accountForm[k] = ''
  })
}

async function confirmSaveAccount() {
  if (!accountForm.name) { ElMessage.warning('请输入账号名称'); return }
  if (!accountForm.platform) { ElMessage.warning('请选择平台类型'); return }
  if (!accountForm.expressCompany) { ElMessage.warning('请选择快递公司'); return }
  if (!accountForm.key) { ElMessage.warning('请输入账号Key'); return }

  savingAccount.value = true
  try {
    if (isEdit.value) {
      const idx = accountList.value.findIndex(a => a.id === editingId.value)
      if (idx !== -1) {
        accountList.value[idx] = { ...accountList.value[idx], ...accountForm }
      }
      ElMessage.success('编辑成功')
    } else {
      const newAccount = {
        ...accountForm,
        id: Date.now(),
        enabled: true,
        createTime: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(/\//g, '-')
      }
      accountList.value.push(newAccount)
      ElMessage.success('添加成功')
    }
    saveAccounts()
    accountDialogVisible.value = false
  } finally { savingAccount.value = false }
}

function handleToggleAccount(row) {
  saveAccounts()
  ElMessage.success(`${row.name} 已${row.enabled ? '启用' : '停用'}`)
}

function handleDeleteAccount(row) {
  ElMessageBox.confirm(`确认删除电子面单账号"${row.name}"？`, '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    accountList.value = accountList.value.filter(a => a.id !== row.id)
    saveAccounts()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function handleTestAccount(row) {
  ElMessage.info(`正在测试连接"${row.name}"...`)
  setTimeout(() => ElMessage.success('连接成功，账号配置有效'), 1500)
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';
.pagination-container { display: flex; justify-content: flex-end; margin-top: $spacing-lg; }
.order-no { color: #409EFF; font-family: monospace; font-size: 13px; }
.express-no { color: #E6A23C; font-family: monospace; font-size: 13px; }
.key-text { font-family: monospace; color: #999; font-size: 12px; }

.batch-bar { display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: #ecf5ff; border-radius: 6px; margin-bottom: 12px; border: 1px solid #b3d8ff; }
.selected-count { font-size: 13px; color: #666; strong { color: #409EFF; } }

.account-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.account-tip {
  font-size: 13px;
  color: #999;
}
</style>
