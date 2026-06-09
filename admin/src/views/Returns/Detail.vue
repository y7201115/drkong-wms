<template>
  <div class="page-container">
    <div class="page-card">
      <div class="detail-header">
        <el-button @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h3>退件详情</h3>
        <el-button
          type="primary"
          size="small"
          @click="handleEdit"
          v-if="!isEditing"
        >
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
        <el-button
          type="success"
          size="small"
          @click="handleSave"
          :loading="saving"
          v-else
        >
          <el-icon><Check /></el-icon>
          保存
        </el-button>
        <el-button
          size="small"
          @click="handleCancelEdit"
          v-if="isEditing"
        >
          取消
        </el-button>
      </div>

      <!-- 快递信息 -->
      <div class="section-title mt-lg">快递信息</div>
      <el-descriptions :column="2" border class="mt-md">
        <el-descriptions-item label="快递单号">{{ detailData.expressNo }}</el-descriptions-item>
        <el-descriptions-item label="快递公司">{{ detailData.expressCompany ? getCompanyName(detailData.expressCompany) : '-' }}</el-descriptions-item>
        <el-descriptions-item label="退件时间">{{ formatDateTime(detailData.time || detailData.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-radio-group v-if="isEditing" v-model="detailData.status" size="small">
            <el-radio-button value="pending">待处理</el-radio-button>
            <el-radio-button value="processed">已处理</el-radio-button>
          </el-radio-group>
          <el-tag v-else :type="getStatusType(detailData.status)" size="small">
            {{ getStatusText(detailData.status) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 商品信息 -->
      <div class="section-title mt-lg">
        商品信息
        <el-tag size="small" type="info" style="margin-left: 8px;">{{ returnItems.length }} 件</el-tag>
      </div>
      <el-table :data="returnItems" border class="mt-md" size="default">
        <el-table-column prop="barcode" label="条形码" width="200" />
        <el-table-column prop="item_code" label="货号" width="140" />
        <el-table-column prop="size" label="尺码" width="80" />
        <el-table-column label="退件原因">
          <template #default="{ row }">
            <el-input
              v-if="isEditing"
              v-model="row.return_reason"
              placeholder="请输入退件原因"
            />
            <span v-else>{{ row.return_reason }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注">
          <template #default="{ row }">
            <el-input
              v-if="isEditing"
              v-model="row.remark"
              placeholder="请输入备注（选填）"
            />
            <span v-else>{{ row.remark || '-' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 操作日志 -->
      <div class="section-title mt-lg">操作日志</div>
      <el-timeline class="mt-md">
        <el-timeline-item
          v-for="(log, index) in operationLogs"
          :key="index"
          :timestamp="log.time"
          placement="top"
          :type="log.type || 'primary'"
        >
          <el-card>
            <p><strong>{{ log.operator }}</strong> {{ log.action }}</p>
            <p v-if="log.remark" class="log-remark">{{ log.remark }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>

      <!-- 操作按钮 -->
      <div class="action-buttons mt-lg" v-if="detailData.status !== 'exchanged' && detailData.status !== 'refunded'">
        <el-button
          v-if="detailData.status === 'pending'"
          type="success"
          @click="handleUpdateStatus('received')"
        >
          确认入库
        </el-button>
        <el-button
          v-if="detailData.status === 'received'"
          type="warning"
          @click="handleUpdateStatus('exchanged')"
        >
          确认换货
        </el-button>
        <el-button
          v-if="detailData.status === 'received'"
          type="info"
          @click="handleUpdateStatus('refunded')"
        >
          确认退款
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getReturnDetail, updateReturnStatus, updateReturnDetail } from '@/api/returns'
import { formatDateTime } from '@/utils/format'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Edit, Check } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const detailData = ref({
  id: '',
  expressNo: '',
  expressCompany: '',
  status: 'pending',
  created_at: new Date().toISOString()
})

const returnItems = ref([])

const operationLogs = ref([
  { time: '2024-03-20 10:30:00', action: '创建退件单', operator: '系统', type: 'primary', remark: '客户发起退货申请' },
  { time: '2024-03-20 14:15:00', action: '退回仓库', operator: '仓库管理员', type: 'warning', remark: '商品已退回仓库待检' }
])

const isEditing = ref(false)
const saving = ref(false)
const originalData = ref({})

onMounted(async () => {
  const id = route.params.id
  try {
    const res = await getReturnDetail(id)
    // 适配后端返回的数据结构
    detailData.value = {
      ...res,
      expressNo: res.express_no || '',
      expressCompany: res.express_company || '',
      status: res.status || 'pending',
      created_at: res.created_at || new Date().toISOString()
    }
    
    // 查询同一快递单号下的所有商品
    const expressNo = res.express_no
    if (expressNo) {
      try {
        const listRes = await getReturnsList({ express_no: expressNo })
        const group = (listRes.list || []).find(g => g.express_no === expressNo)
        if (group && group.items) {
          returnItems.value = group.items
        } else {
          returnItems.value = [{ ...res }]
        }
      } catch {
        returnItems.value = [{ ...res }]
      }
    } else {
      returnItems.value = [{ ...res }]
    }
  } catch {
    // Mock data already set
    returnItems.value = [{
      id: 1,
      barcode: 'B1404559--PIK27-',
      item_code: 'B1404559',
      size: 27,
      return_reason: '尺码不合',
      remark: ''
    }]
  }
})

function getCompanyName(code) {
  const map = {
    SF: '顺丰速运', ZTO: '中通快递', YTO: '圆通速递',
    YUN: '韵达快递', STO: '申通快递', BS: '百世快递',
    JT: '极兔速递', EMS: '邮政快递', JD: '京东物流',
    OTHER: '其他'
  }
  return map[code] || code
}

function getStatusType(status) {
  const map = { pending: 'warning', received: 'success', exchanged: 'primary', refunded: 'info', processed: 'success' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { pending: '待处理', received: '已入库', exchanged: '已换货', refunded: '已退款', processed: '已处理' }
  return map[status] || status
}

// 编辑模式
function handleEdit() {
  originalData.value = JSON.parse(JSON.stringify(detailData.value))
  isEditing.value = true
}

// 取消编辑
function handleCancelEdit() {
  detailData.value = JSON.parse(JSON.stringify(originalData.value))
  isEditing.value = false
}

// 保存编辑
async function handleSave() {
  // 验证所有商品的退件原因
  for (const item of returnItems.value) {
    if (!item.return_reason) {
      ElMessage.warning(`请填写第 ${returnItems.value.indexOf(item) + 1} 件商品的退件原因`)
      return
    }
  }

  saving.value = true
  try {
    // 更新每个商品的备注
    for (const item of returnItems.value) {
      await updateReturnDetail(item.id, {
        reason: item.return_reason,
        remark: item.remark || ''
      })
    }
    
    // 更新状态
    await updateReturnDetail(detailData.value.id, {
      status: detailData.value.status
    })

    ElMessage.success('保存成功')
    isEditing.value = false
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// 更新状态
async function handleUpdateStatus(status) {
  const statusText = status === 'received' ? '入库' : status === 'exchanged' ? '换货' : '退款'

  try {
    await ElMessageBox.confirm(`确认执行${statusText}操作？`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await updateReturnStatus({
      id: detailData.value.id,
      status,
      remark: `${statusText}操作`
    })

    detailData.value.status = status
    operationLogs.value.unshift({
      time: formatDateTime(new Date()),
      action: `确认${statusText}`,
      operator: '当前用户',
      type: status === 'received' ? 'success' : 'primary'
    })

    ElMessage.success(`${statusText}成功`)
  } catch {
    // 用户取消或失败处理
  }
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.detail-header {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;

  h3 {
    margin: 0;
    font-size: 18px;
  }
}

.mt-lg {
  margin-top: $spacing-lg;
}

.mt-md {
  margin-top: $spacing-md;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  padding-bottom: $spacing-sm;
  border-bottom: 1px solid $border-color-light;
}

.log-remark {
  font-size: 12px;
  color: $text-secondary;
  margin-top: 4px;
}

.action-buttons {
  display: flex;
  gap: $spacing-md;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color-light;
}
</style>
