<template>
  <div class="page-container">
    <div class="page-card">
      <div class="page-header">
        <el-button text @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <h3 class="page-title">退件登记</h3>
        <el-tag type="info" size="large">待提交 {{ pendingList.length }} 单</el-tag>
      </div>

      <!-- 模式切换 -->
      <div class="mode-switch">
        <el-radio-group v-model="mode" size="large">
          <el-radio-button value="single">逐单登记</el-radio-button>
          <el-radio-button value="batch">批量登记</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 快递单号区域 -->
      <div class="express-section">
        <div class="section-label">
          <el-icon><Position /></el-icon>
          <span>快递单号</span>
        </div>
        <div class="express-input-row">
          <el-input
            ref="expressInputRef"
            v-model="expressNo"
            placeholder="请扫描快递单号（回车确认）"
            size="large"
            class="express-input"
            @keyup.enter="handleExpressScan"
            clearable
          >
            <template #prefix>
              <el-icon><Position /></el-icon>
            </template>
          </el-input>
          <el-select
            v-model="expressCompany"
            placeholder="选择快递公司"
            size="large"
            class="company-select"
          >
            <el-option label="顺丰速运" value="SF" />
            <el-option label="中通快递" value="ZTO" />
            <el-option label="圆通速递" value="YTO" />
            <el-option label="韵达快递" value="YUN" />
            <el-option label="申通快递" value="STO" />
            <el-option label="百世快递" value="BS" />
            <el-option label="极兔速递" value="JT" />
            <el-option label="邮政快递" value="EMS" />
            <el-option label="京东物流" value="JD" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </div>
        <div class="scan-hint" v-if="expressCompany">
          <el-icon><SuccessFilled /></el-icon>
          <span>已识别：<strong>{{ getCompanyName(expressCompany) }}</strong></span>
        </div>
        <div class="scan-hint" v-else>
          <el-icon><InfoFilled /></el-icon>
          <span>扫描快递单号后按回车键确认</span>
        </div>
      </div>

      <!-- 分隔线 -->
      <el-divider v-if="expressNo" />

      <!-- 商品信息区域 -->
      <div class="items-section" v-if="expressNo">
        <div class="section-header">
          <div class="section-label">
            <el-icon><Goods /></el-icon>
            <span>包裹内商品</span>
            <el-tag size="small" type="info">{{ items.length }} 件</el-tag>
          </div>
          <div class="header-actions">
            <el-button type="primary" size="small" @click="addItem">
              <el-icon><Plus /></el-icon>
              添加商品
            </el-button>
          </div>
        </div>

        <!-- 商品列表 -->
        <div class="item-list">
          <div
            v-for="(item, index) in items"
            :key="item.id"
            class="item-card"
            :class="{ 'item-completed': isItemComplete(item) }"
          >
            <div class="item-header">
              <div class="item-index-wrap">
                <span class="item-index">{{ index + 1 }}</span>
                <el-icon v-if="isItemComplete(item)" class="item-check"><CircleCheckFilled /></el-icon>
              </div>
              <el-button
                type="danger"
                text
                size="small"
                @click="removeItem(index)"
                v-if="items.length > 1"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>

            <!-- 条形码扫描 -->
            <div class="barcode-input-row">
              <el-input
                v-model="item.barcode"
                placeholder="扫描商品条形码（回车确认）"
                size="large"
                class="barcode-input"
                @keyup.enter="handleItemBarcode(item, index)"
                @change="handleItemBarcode(item, index)"
                :disabled="item.item_code !== ''"
              >
                <template #prefix>
                  <el-icon><Camera /></el-icon>
                </template>
                <template #append v-if="item.item_code">
                  <el-button @click="item.barcode = ''; item.item_code = ''; item.size = ''" size="small">重新扫描</el-button>
                </template>
              </el-input>
              <el-button 
                v-if="item.barcode && !item.item_code" 
                type="primary" 
                size="large" 
                @click="handleItemBarcode(item, index)"
                style="margin-left: 8px;"
              >
                解析
              </el-button>
            </div>

            <!-- 解析结果 -->
            <div class="parse-result" v-if="item.item_code">
              <div class="parse-info">
                <span class="parse-label">货号</span>
                <span class="parse-value highlight">{{ item.item_code }}</span>
              </div>
              <div class="parse-info">
                <span class="parse-label">尺码</span>
                <span class="parse-value highlight">{{ item.size }}</span>
              </div>
            </div>

            <!-- 退件原因 -->
            <div class="reason-row">
              <span class="reason-label">退件原因</span>
              <el-select v-model="item.reason" size="large" placeholder="选择原因" style="flex: 1;">
                <el-option label="尺码不合适" value="尺码不合适" />
                <el-option label="质量问题" value="质量问题" />
                <el-option label="颜色差异" value="颜色差异" />
                <el-option label="不喜欢/七天无理由" value="不喜欢/七天无理由" />
                <el-option label="发错货" value="发错货" />
                <el-option label="破损" value="破损" />
                <el-option label="其他" value="其他" />
              </el-select>
            </div>

            <!-- 备注 -->
            <div class="remark-row">
              <el-input
                v-model="item.remark"
                placeholder="备注（选填）"
                size="large"
                clearable
              />
            </div>
          </div>
        </div>

        <!-- 操作按钮区域 -->
        <div class="submit-section">
          <div class="submit-summary">
            <span>共 <strong>{{ items.length }}</strong> 件商品</span>
            <span>已完整填写 <strong class="text-success">{{ completedCount }}</strong> 件</span>
          </div>
          
          <!-- 逐单模式：直接提交 -->
          <el-button
            v-if="mode === 'single'"
            size="large"
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
            :disabled="!canSubmit"
            class="submit-btn"
          >
            <el-icon><Check /></el-icon>
            确认退件登记
          </el-button>
          <div class="submit-hint" v-if="mode === 'single' && !canSubmit">
            请填写完整的快递单号，并扫描所有商品条形码及选择退件原因
          </div>

          <!-- 批量模式：暂存 -->
          <template v-if="mode === 'batch'">
            <el-button
              size="large"
              type="success"
              @click="handleTempSave"
              :disabled="!canSubmit"
              class="submit-btn"
            >
              <el-icon><DocumentAdd /></el-icon>
              暂存此单
            </el-button>
            <div class="submit-hint" v-if="!canSubmit">
              请先填写完整的退件信息后暂存
            </div>
          </template>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-else>
        <el-icon class="empty-icon"><Box /></el-icon>
        <p>请先扫描快递单号</p>
        <span class="empty-hint">一个快递包裹可包含 1~N 个商品</span>
      </div>
    </div>

    <!-- 批量模式：待提交列表 -->
    <div class="page-card pending-card" v-if="mode === 'batch' && pendingList.length > 0">
      <div class="pending-header">
        <div class="section-label">
          <el-icon><Tickets /></el-icon>
          <span>待提交列表</span>
          <el-tag type="warning" size="small">{{ pendingList.length }} 单</el-tag>
        </div>
        <div class="pending-actions">
          <el-button type="danger" text size="small" @click="clearPending">
            <el-icon><Delete /></el-icon>
            清空列表
          </el-button>
          <el-button type="primary" size="large" :loading="submitting" @click="handleBatchSubmit" class="batch-submit-btn">
            <el-icon><Check /></el-icon>
            批量提交 ({{ pendingList.length }})
          </el-button>
        </div>
      </div>
      
      <el-table :data="pendingList" stripe border size="default">
        <el-table-column label="序号" width="60">
          <template #default="{ row, $index }">{{ $index + 1 }}</template>
        </el-table-column>
        <el-table-column label="快递单号" width="180">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.express_no }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="快递公司" width="100">
          <template #default="{ row }">
            {{ getCompanyName(row.express_company) }}
          </template>
        </el-table-column>
        <el-table-column label="商品数量" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.items.length }} 件</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="商品明细" min-width="200">
          <template #default="{ row }">
            <div class="item-summary">
              <span v-for="(item, i) in row.items" :key="i" class="item-tag">
                {{ item.item_code }} / {{ item.size }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ $index }">
            <el-button type="danger" text size="small" @click="removePending($index)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, Position, InfoFilled, Goods, Plus, Delete,
  Check, Box, CircleCheckFilled, SuccessFilled, Camera,
  DocumentAdd, Tickets
} from '@element-plus/icons-vue'
import { createReturn } from '@/api/returns'

const router = useRouter()
const expressInputRef = ref(null)
const expressNo = ref('')
const expressCompany = ref('')
const submitting = ref(false)
const mode = ref('single') // 'single' | 'batch'

// 当前编辑的商品列表
const items = reactive([])

// 待提交列表（批量模式）
const pendingList = ref([])

// 判断单个商品是否填写完整
function isItemComplete(item) {
  return !!(item.item_code && item.size && item.reason)
}

// 已完整填写的商品数量
const completedCount = computed(() => {
  return items.filter(isItemComplete).length
})

// 添加商品
function addItem() {
  items.push({
    id: Date.now() + Math.random(),
    barcode: '',
    item_code: '',
    size: '',
    reason: '',
    remark: ''
  })
  nextTick(() => {
    const inputs = document.querySelectorAll('.barcode-input .el-input__inner')
    if (inputs.length > 0) {
      inputs[inputs.length - 1].focus()
    }
  })
}

// 删除商品
function removeItem(index) {
  items.splice(index, 1)
}

// 扫描快递单号
function handleExpressScan() {
  const no = expressNo.value.trim()
  if (!no) return

  // 自动识别快递公司
  const company = detectExpressCompany(no)
  if (company) {
    expressCompany.value = company
    ElMessage.success(`已识别快递公司：${getCompanyName(company)}`)
  } else {
    expressCompany.value = 'OTHER'
  }

  // 初始化商品列表
  if (items.length === 0) {
    addItem()
  }

  // 聚焦第一个商品条形码
  nextTick(() => {
    const inputs = document.querySelectorAll('.barcode-input .el-input__inner')
    if (inputs[0]) inputs[0].focus()
  })
}

// 自动识别快递公司
function detectExpressCompany(no) {
  const rules = [
    { pattern: /^SF\d{12,14}$/i, company: 'SF' },
    { pattern: /^7\d{17}$/i, company: 'ZTO' },
    { pattern: /^YT\d{12,14}$/i, company: 'YTO' },
    { pattern: /^3\d{17}$/i, company: 'YUN' },
    { pattern: /^4\d{17}$/i, company: 'STO' },
    { pattern: /^JT\d{13,15}$/i, company: 'JT' },
    { pattern: /^[A-Z]{2}\d{9}$/i, company: 'EMS' },
    { pattern: /^JD\d{13,15}$/i, company: 'JD' },
  ]

  for (const rule of rules) {
    if (rule.pattern.test(no)) {
      return rule.company
    }
  }
  return ''
}

function getCompanyName(code) {
  const map = {
    SF: '顺丰速运', ZTO: '中通快递', YTO: '圆通速递',
    YUN: '韵达快递', STO: '申通快递', BS: '百世快递',
    JT: '极兔速递', EMS: '邮政快递', JD: '京东物流',
    OTHER: '其他'
  }
  return map[code] || code
}

// 扫描商品条形码
function handleItemBarcode(item, index) {
  const barcode = item.barcode.trim()
  if (!barcode) return

  const parsed = parseBarcodeSync(barcode)
  if (!parsed) {
    ElMessage.warning(`无法解析条形码: ${barcode}`)
    return
  }

  item.item_code = parsed.item_code
  item.size = parsed.size

  ElMessage.success(`已识别: ${parsed.item_code} / 尺码 ${parsed.size}`)
  item.barcode = ''

  nextTick(() => {
    const selects = document.querySelectorAll('.reason-row .el-select__input')
    if (selects[index]) {
      selects[index].focus()
    }
  })
}

// 同步解析条形码
function parseBarcodeSync(barcode) {
  // 格式2: B1404559--PIK29- → 货号=B1404559，尺码=29
  const rule2 = /^([A-Z0-9]+)--.*?(\d+(?:\.\d+)?)-/
  const match2 = barcode.match(rule2)
  if (match2) {
    return { item_code: match2[1], size: parseFloat(match2[2]) }
  }

  // 格式1: S14A2020DM0270 → 货号=S14A2020DM，尺码=27
  const rule1 = /^([A-Z0-9]+?)(\d{2,3})$/
  const match1 = barcode.match(rule1)
  if (match1) {
    const rawSize = match1[2]
    let size
    if (rawSize.length === 3) {
      size = parseFloat(rawSize.slice(0, 2) + '.' + rawSize[2])
    } else {
      size = parseInt(rawSize)
    }
    return { item_code: match1[1], size }
  }

  return null
}

// 是否可以提交
const canSubmit = computed(() => {
  if (!expressNo.value.trim() || !expressCompany.value) return false
  if (items.length === 0) return false
  return items.every(item => isItemComplete(item))
})

// 逐单模式：直接提交
async function handleSubmit() {
  if (!canSubmit.value) return

  submitting.value = true
  try {
    const submitData = buildSubmitData()
    await createReturn(submitData)
    ElMessage.success(`退件登记成功！共 ${items.length} 件商品`)
    resetForm()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('退件登记失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 批量模式：暂存当前记录
function handleTempSave() {
  if (!canSubmit.value) return

  pendingList.value.push({
    express_no: expressNo.value.trim(),
    express_company: expressCompany.value,
    items: items.map(item => ({
      barcode: `${item.item_code}${String(item.size).replace('.', '')}`,
      item_code: item.item_code,
      size: item.size,
      reason: item.reason,
      remark: item.remark
    }))
  })

  ElMessage.success(`已暂存：${expressNo.value.trim()}（${items.length} 件）`)
  resetForm()
}

// 批量模式：批量提交
async function handleBatchSubmit() {
  if (pendingList.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确认提交 ${pendingList.value.length} 单退件记录？`,
      '批量提交确认',
      { confirmButtonText: '确认提交', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }

  submitting.value = true
  try {
    // 逐条提交
    let successCount = 0
    for (const record of pendingList.value) {
      await createReturn(record)
      successCount++
    }

    ElMessage.success(`批量提交成功！共 ${successCount} 单`)
    pendingList.value = []
  } catch (error) {
    console.error('批量提交失败:', error)
    ElMessage.error('批量提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 删除待提交记录
function removePending(index) {
  pendingList.value.splice(index, 1)
  ElMessage.success('已删除')
}

// 清空待提交列表
function clearPending() {
  pendingList.value = []
  ElMessage.success('已清空')
}

// 构建提交数据
function buildSubmitData() {
  return {
    express_no: expressNo.value.trim(),
    express_company: expressCompany.value,
    items: items.map(item => ({
      barcode: `${item.item_code}${String(item.size).replace('.', '')}`,
      item_code: item.item_code,
      size: item.size,
      reason: item.reason,
      remark: item.remark
    }))
  }
}

// 重置表单
function resetForm() {
  expressNo.value = ''
  expressCompany.value = ''
  items.length = 0
  addItem()
  nextTick(() => {
    expressInputRef.value?.focus()
  })
}

onMounted(() => {
  addItem()
  nextTick(() => {
    expressInputRef.value?.focus()
  })
})
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.mode-switch {
  margin-bottom: 20px;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

// 快递单号区域
.express-section {
  margin-bottom: 20px;
}

.express-input-row {
  display: flex;
  gap: 12px;
}

.express-input {
  flex: 1;
  :deep(.el-input__wrapper) {
    padding: 10px 14px;
  }
  :deep(.el-input__inner) {
    font-size: 16px;
    font-family: monospace;
  }
}

.company-select {
  width: 160px;
}

.scan-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 13px;
  color: #999;

  strong {
    color: #67c23a;
  }
}

:deep(.el-divider) {
  margin: 24px 0;
}

// 商品区域
.items-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

// 商品卡片
.item-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.item-card {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 16px;
  background: #fafafa;
  transition: all 0.2s;

  &:hover {
    border-color: #d9d9d9;
  }

  &.item-completed {
    border-color: #b7eb8f;
    background: #f6ffed;
  }
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.item-index-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #409eff;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 50%;
}

.item-check {
  color: #67c23a;
  font-size: 20px;
}

.barcode-input-row {
  margin-bottom: 12px;
}

.barcode-input {
  :deep(.el-input__wrapper) {
    background: #fff;
  }
  :deep(.el-input__inner) {
    font-family: monospace;
  }
}

.parse-result {
  display: flex;
  gap: 20px;
  padding: 10px 14px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid #e8f5e9;
}

.parse-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.parse-label {
  font-size: 12px;
  color: #999;
}

.parse-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;

  &.highlight {
    color: #67c23a;
  }
}

.reason-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.reason-label {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  min-width: 60px;
}

.remark-row {
  :deep(.el-input__wrapper) {
    background: #fff;
  }
}

// 提交区域
.submit-section {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.submit-summary {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;

  strong {
    color: #409eff;
    font-size: 18px;
  }

  .text-success {
    color: #67c23a;
  }
}

.submit-btn {
  width: 100%;
  max-width: 300px;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

.batch-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 8px;
}

.action-btn {
  min-width: 160px;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

.submit-hint {
  font-size: 13px;
  color: #999;
  margin-top: 8px;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #ccc;

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.4;
  }

  p {
    font-size: 15px;
    color: #999;
    margin: 0 0 8px;
  }

  .empty-hint {
    font-size: 13px;
    color: #bbb;
  }
}

// 待提交列表卡片
.pending-card {
  margin-top: 20px;
}

.pending-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.pending-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.batch-submit-btn {
  min-width: 160px;
  font-weight: 500;
}

.item-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.item-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #f0f9ff;
  border: 1px solid #d9ecff;
  border-radius: 4px;
  font-size: 12px;
  color: #409eff;
}
</style>
