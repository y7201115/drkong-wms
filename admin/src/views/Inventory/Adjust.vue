<template>
  <div class="page-container">
    <div class="page-card">
      <h3 class="page-title">库存调整</h3>
      
      <el-form
        ref="formRef"
        :model="adjustForm"
        :rules="adjustRules"
        label-width="100px"
        style="max-width: 600px"
      >
        <el-form-item label="货号" prop="articleNo">
          <el-input v-model="adjustForm.articleNo" placeholder="请输入货号" />
        </el-form-item>
        
        <el-form-item label="尺码" prop="size">
          <el-input-number
            v-model="adjustForm.size"
            :min="20"
            :max="40"
            placeholder="尺码"
          />
        </el-form-item>

        <el-form-item label="条形码" prop="barcode">
          <el-input
            v-model="adjustForm.barcode"
            placeholder="扫描或输入条形码"
            @blur="handleBarcodeBlur"
          >
            <template #append>
              <el-button @click="handleScanBarcode">扫描</el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="调整类型" prop="adjustType">
          <el-radio-group v-model="adjustForm.adjustType">
            <el-radio value="add">增加库存</el-radio>
            <el-radio value="reduce">减少库存</el-radio>
            <el-radio value="set">设置库存</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="数量" prop="quantity">
          <el-input-number
            v-model="adjustForm.quantity"
            :min="1"
            :max="9999"
            placeholder="调整数量"
          />
        </el-form-item>

        <el-form-item label="当前库存">
          <el-tag type="info">{{ currentStock }}</el-tag>
        </el-form-item>

        <el-form-item label="调整后库存">
          <el-tag :type="getNewStockTag()">{{ newStock }}</el-tag>
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="adjustForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入调整原因"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            提交调整
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 调整历史记录 -->
      <div class="history-section">
        <h4>最近调整记录</h4>
        <el-table :data="historyData" stripe border style="width: 100%; margin-top: 16px">
          <el-table-column prop="time" label="时间" width="180" />
          <el-table-column prop="articleNo" label="货号" width="120" />
          <el-table-column prop="size" label="尺码" width="80" />
          <el-table-column prop="adjustType" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.adjustType === 'add' ? 'success' : row.adjustType === 'reduce' ? 'danger' : 'warning'" size="small">
                {{ row.adjustType === 'add' ? '增加' : row.adjustType === 'reduce' ? '减少' : '设置' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column prop="operator" label="操作人" width="100" />
          <el-table-column prop="remark" label="备注" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { adjustInventory } from '@/api/inventory'
import { parseBarcode } from '@/utils/barcode'
import { ElMessage } from 'element-plus'

const route = useRoute()
const formRef = ref(null)
const submitting = ref(false)

const adjustForm = reactive({
  articleNo: '',
  size: 25,
  barcode: '',
  adjustType: 'add',
  quantity: 1,
  remark: ''
})

const adjustRules = {
  articleNo: [{ required: true, message: '请输入货号', trigger: 'blur' }],
  adjustType: [{ required: true, message: '请选择调整类型', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }]
}

const currentStock = ref(0)

const newStock = computed(() => {
  const current = currentStock.value
  const qty = adjustForm.quantity
  switch (adjustForm.adjustType) {
    case 'add': return current + qty
    case 'reduce': return Math.max(0, current - qty)
    case 'set': return qty
    default: return current
  }
})

const historyData = ref([
  { time: '2024-03-20 14:30', articleNo: 'A101', size: '25', adjustType: 'add', quantity: 50, operator: '张三', remark: '新货入库' },
  { time: '2024-03-20 11:20', articleNo: 'A105', size: '28', adjustType: 'reduce', quantity: 5, operator: '李四', remark: '盘点差异' },
  { time: '2024-03-19 16:45', articleNo: 'A112', size: '32', adjustType: 'set', quantity: 100, operator: '王五', remark: '初始库存录入' }
])

onMounted(() => {
  // Fill form from query params
  if (route.query.articleNo) {
    adjustForm.articleNo = route.query.articleNo
  }
  if (route.query.size) {
    adjustForm.size = parseInt(route.query.size)
  }
  // Mock current stock
  currentStock.value = Math.floor(Math.random() * 100)
})

function handleBarcodeBlur() {
  if (adjustForm.barcode) {
    const parsed = parseBarcode(adjustForm.barcode)
    if (parsed) {
      adjustForm.articleNo = parsed.articleNo
      adjustForm.size = parseInt(parsed.size)
      // Mock stock lookup
      currentStock.value = Math.floor(Math.random() * 50)
    }
  }
}

function handleScanBarcode() {
  // Mock barcode scan - in production this would use a barcode scanner
  adjustForm.barcode = `DRK-2024-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}-${adjustForm.size}`
  handleBarcodeBlur()
}

function getNewStockTag() {
  if (newStock.value <= 0) return 'danger'
  if (newStock.value < 10) return 'warning'
  return 'success'
}

async function handleSubmit() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await adjustInventory({
          ...adjustForm,
          currentStock: currentStock.value,
          newStock: newStock.value
        })
        ElMessage.success('库存调整成功')
        currentStock.value = newStock.value
        handleReset()
      } catch {
        ElMessage.success('库存调整成功（模拟数据）')
        currentStock.value = newStock.value
      } finally {
        submitting.value = false
      }
    }
  })
}

function handleReset() {
  adjustForm.barcode = ''
  adjustForm.adjustType = 'add'
  adjustForm.quantity = 1
  adjustForm.remark = ''
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.page-title {
  font-size: 18px;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $border-color-light;
}

.history-section {
  margin-top: $spacing-xl;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color-light;
  
  h4 {
    font-size: 16px;
    margin-bottom: $spacing-md;
  }
}
</style>
