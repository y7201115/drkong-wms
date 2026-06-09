<template>
  <div class="page-container">
    <div class="page-card">
      <!-- SKU管理页面：管理商品多规格 -->
      <el-tabs v-model="activeTab" type="border-card">
        <!-- SKU列表 -->
        <el-tab-pane label="SKU管理" name="sku">
          <div class="search-bar">
            <el-input v-model="searchForm.keyword" placeholder="SKU编码/货号/商品名称" clearable style="width: 220px" @keyup.enter="handleSearch" />
            <el-select v-model="searchForm.product" placeholder="关联商品" clearable style="width: 180px">
              <el-option v-for="p in productList" :key="p.id" :label="p.name" :value="p.id" />
            </el-select>
            <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 120px">
              <el-option label="启用" value="active" />
              <el-option label="停用" value="inactive" />
            </el-select>
            <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon> 查询</el-button>
            <el-button @click="handleReset"><el-icon><Refresh /></el-icon> 重置</el-button>
            <el-button type="success" @click="handleAddSKU"><el-icon><Plus /></el-icon> 添加SKU</el-button>
            <el-button type="warning" @click="handleBatchImport"><el-icon><Upload /></el-icon> 批量导入</el-button>
          </div>

          <el-table :data="filteredSKUList" v-loading="loading" stripe border style="width: 100%">
            <el-table-column label="SKU编码" width="160">
              <template #default="{ row }">
                <span class="sku-code">{{ row.skuCode }}</span>
              </template>
            </el-table-column>
            <el-table-column label="货号" width="130">
              <template #default="{ row }">{{ row.articleNo }}</template>
            </el-table-column>
            <el-table-column label="规格属性" width="200">
              <template #default="{ row }">
                <div class="spec-tags">
                  <el-tag v-if="row.color" size="small" type="info">{{ row.color }}</el-tag>
                  <el-tag v-if="row.size" size="small" type="primary">{{ row.size }}</el-tag>
                  <el-tag v-if="row.material" size="small" type="warning">{{ row.material }}</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="关联商品" min-width="180">
              <template #default="{ row }">{{ row.productName }}</template>
            </el-table-column>
            <el-table-column label="价格" width="90" align="right">
              <template #default="{ row }">¥{{ row.price?.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column label="库存" width="80" align="center">
              <template #default="{ row }">
                <span :class="{ 'stock-warning': row.stock < 10 }">{{ row.stock }}</span>
              </template>
            </el-table-column>
            <el-table-column label="条码" width="140">
              <template #default="{ row }"><span class="barcode">{{ row.barcode || '-' }}</span></template>
            </el-table-column>
            <el-table-column label="状态" width="70">
              <template #default="{ row }">
                <el-switch v-model="row.active" size="small" @change="handleToggleSKU(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" fixed="right" width="150">
              <template #default="{ row }">
                <el-button type="primary" text size="small" @click="handleEditSKU(row)">编辑</el-button>
                <el-button type="danger" text size="small" @click="handleDeleteSKU(row)">删除</el-button>
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
        </el-tab-pane>

        <!-- 规格模板管理 -->
        <el-tab-pane label="规格模板" name="template">
          <div class="search-bar">
            <el-button type="success" @click="handleAddTemplate"><el-icon><Plus /></el-icon> 添加规格模板</el-button>
          </div>

          <el-table :data="templateList" v-loading="loading" stripe border style="width: 100%">
            <el-table-column prop="name" label="模板名称" width="150" />
            <el-table-column label="规格项" min-width="300">
              <template #default="{ row }">
                <div class="spec-preview">
                  <span v-for="(spec, i) in row.specs" :key="i" class="spec-group">
                    <span class="spec-name">{{ spec.name }}</span>:
                    <span v-for="(val, j) in spec.values" :key="j" class="spec-val">{{ val }}</span>
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="SKU数量" width="100" align="center">
              <template #default="{ row }">{{ countSKUs(row.specs) }}</template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="170" />
            <el-table-column label="操作" fixed="right" width="150">
              <template #default="{ row }">
                <el-button type="primary" text size="small" @click="handleEditTemplate(row)">编辑</el-button>
                <el-button type="primary" text size="small" @click="handleApplyTemplate(row)">应用到商品</el-button>
                <el-button type="danger" text size="small" @click="handleDeleteTemplate(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 添加/编辑SKU对话框 -->
    <el-dialog v-model="skuDialogVisible" :title="isEdit ? '编辑SKU' : '添加SKU'" width="550px">
      <el-form :model="skuForm" label-width="90px">
        <el-form-item label="关联商品" required>
          <el-select v-model="skuForm.productId" placeholder="选择商品" style="width: 100%" filterable>
            <el-option v-for="p in productList" :key="p.id" :label="`${p.articleNo} - ${p.name}`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="SKU编码" required>
          <el-input v-model="skuForm.skuCode" placeholder="如：S14A2020DM-27-白" />
          <div class="form-tip">建议格式：货号-尺码-颜色</div>
        </el-form-item>
        <el-form-item label="货号">
          <el-input v-model="skuForm.articleNo" placeholder="自动带出或手动输入" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-input v-model="skuForm.color" placeholder="如：白色" />
        </el-form-item>
        <el-form-item label="尺码" required>
          <el-input v-model="skuForm.size" placeholder="如：27码" />
        </el-form-item>
        <el-form-item label="材质">
          <el-input v-model="skuForm.material" placeholder="如：网布（选填）" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="skuForm.price" :min="0" :precision="2" :step="10" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="skuForm.stock" :min="0" :step="10" />
        </el-form-item>
        <el-form-item label="条码">
          <el-input v-model="skuForm.barcode" placeholder="商品条码/ISBN（选填）" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="skuForm.active">
            <el-radio :value="true">启用</el-radio>
            <el-radio :value="false">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="skuForm.remark" type="textarea" :rows="2" placeholder="备注（选填）" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="skuDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSaveSKU" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 规格模板编辑对话框 -->
    <el-dialog v-model="templateDialogVisible" :title="isEditTemplate ? '编辑规格模板' : '添加规格模板'" width="600px">
      <el-form label-width="80px">
        <el-form-item label="模板名称" required>
          <el-input v-model="templateForm.name" placeholder="如：童鞋标准规格" />
        </el-form-item>

        <el-form-item label="规格项">
          <div class="spec-editor">
            <div v-for="(spec, si) in templateForm.specs" :key="si" class="spec-row">
              <el-input v-model="spec.name" placeholder="规格名" style="width: 100px" />
              <span class="spec-sep">:</span>
              <div class="spec-values">
                <el-tag
                  v-for="(val, vi) in spec.values"
                  :key="vi"
                  closable
                  @close="removeSpecValue(si, vi)"
                  class="spec-value-tag"
                >
                  {{ val }}
                </el-tag>
                <el-input
                  v-if="spec.inputVisible"
                  ref="specInputRefs"
                  v-model="spec.inputValue"
                  size="small"
                  style="width: 80px"
                  @keyup.enter="addSpecValue(si)"
                  @blur="addSpecValue(si)"
                />
                <el-button v-else size="small" @click="showSpecInput(si)" class="add-spec-btn">+</el-button>
              </div>
              <el-button type="danger" text size="small" @click="removeSpec(si)" class="remove-spec-btn">删除</el-button>
            </div>
            <el-button type="primary" text size="small" @click="addSpec" class="add-spec-main">+ 添加规格项</el-button>
          </div>
        </el-form-item>

        <!-- 预览 -->
        <el-form-item label="生成预览">
          <div class="sku-preview">
            <div v-if="previewSKUs.length > 0">
              将生成 <strong>{{ previewSKUs.length }}</strong> 个SKU：
            </div>
            <div class="preview-list">
              <el-tag v-for="(sku, i) in previewSKUs.slice(0, 20)" :key="i" size="small" class="preview-sku-tag">
                {{ sku }}
              </el-tag>
              <span v-if="previewSKUs.length > 20" class="preview-more">等{{ previewSKUs.length }}个</span>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSaveTemplate" :loading="saving">保存模板</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入SKU" width="500px">
      <el-upload drag :auto-upload="false" accept=".xlsx,.xls,.csv" :on-change="handleFileChange">
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">将SKU Excel文件拖到此处，或<em>点击选择</em></div>
        <template #tip>
          <div class="el-upload__tip">
            支持 .xlsx / .xls / .csv 格式<br>
            Excel需包含：SKU编码、货号、颜色、尺码、价格、库存 列
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport" :loading="importing">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Search, Refresh, Plus, Upload, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('sku')
const loading = ref(false)
const saving = ref(false)
const importing = ref(false)

const productList = ref([])
const skuList = ref([])
const templateList = ref([])

const searchForm = reactive({ keyword: '', product: '', status: '' })
const pagination = reactive({ currentPage: 1, pageSize: 20, total: 0 })

// SKU编辑
const skuDialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const skuForm = reactive({
  productId: '', productName: '', articleNo: '', skuCode: '',
  color: '', size: '', material: '', price: 0, stock: 0,
  barcode: '', active: true, remark: ''
})

// 模板编辑
const templateDialogVisible = ref(false)
const isEditTemplate = ref(false)
const editingTemplateId = ref(null)
const templateForm = reactive({ name: '', specs: [] })
const specInputRefs = ref([])

// 批量导入
const importDialogVisible = ref(false)
const importFile = ref(null)

onMounted(() => {
  fetchProducts()
  fetchSKUs()
  fetchTemplates()
})

async function fetchProducts() {
  productList.value = [
    { id: 1, articleNo: 'S14A2020DM', name: '江博士童鞋 学步鞋S14A2020DM' },
    { id: 2, articleNo: 'B1404559', name: '江博士童鞋 休闲鞋B1404559' },
    { id: 3, articleNo: 'S14A2025AM', name: '江博士童鞋 运动鞋S14A2025AM' },
    { id: 4, articleNo: 'B1404580', name: '江博士童鞋 凉鞋B1404580' },
    { id: 5, articleNo: 'S14A2030DM', name: '江博士童鞋 雪地靴S14A2030DM' },
  ]
}

async function fetchSKUs() {
  loading.value = true
  try {
    const colors = ['白色', '黑色', '粉色', '蓝色', '灰色']
    const sizes = ['25码', '26码', '27码', '28码', '29码', '30码', '31码', '32码']
    const materials = ['网布', '真皮', '合成革']

    skuList.value = productList.value.flatMap((p, pi) => {
      return sizes.slice(0, 4 + (pi % 3)).map((s, si) => ({
        id: `${p.id}-${si}`,
        productId: p.id,
        productName: p.name,
        articleNo: p.articleNo,
        skuCode: `${p.articleNo}-${s.replace('码', '')}-${colors[si % 5].slice(0, 1)}`,
        color: colors[(pi + si) % 5],
        size: s,
        material: materials[si % 3],
        price: 128 + pi * 30,
        stock: Math.floor(Math.random() * 80) + 5,
        barcode: `69${String(Math.random()).slice(2, 12)}`,
        active: true,
        remark: ''
      }))
    })
    pagination.total = skuList.value.length
  } finally { loading.value = false }
}

async function fetchTemplates() {
  templateList.value = [
    {
      id: 1,
      name: '童鞋标准规格',
      specs: [
        { name: '颜色', values: ['白色', '黑色', '粉色', '蓝色'] },
        { name: '尺码', values: ['25码', '26码', '27码', '28码', '29码', '30码', '31码', '32码'] }
      ],
      createTime: '2026-06-01 10:00'
    },
    {
      id: 2,
      name: '凉鞋规格',
      specs: [
        { name: '颜色', values: ['白色', '粉色'] },
        { name: '尺码', values: ['25码', '26码', '27码', '28码', '29码', '30码'] },
        { name: '材质', values: ['网布', '真皮'] }
      ],
      createTime: '2026-06-03 14:30'
    }
  ]
}

// SKU 过滤
const filteredSKUList = computed(() => {
  let list = skuList.value
  if (searchForm.keyword) {
    const kw = searchForm.keyword.toLowerCase()
    list = list.filter(s =>
      s.skuCode.toLowerCase().includes(kw) ||
      s.articleNo.toLowerCase().includes(kw) ||
      s.productName.toLowerCase().includes(kw)
    )
  }
  if (searchForm.product) {
    list = list.filter(s => s.productId === searchForm.product)
  }
  if (searchForm.status) {
    list = list.filter(s => searchForm.status === 'active' ? s.active : !s.active)
  }
  pagination.total = list.length
  return list
})

function handleSearch() { pagination.currentPage = 1 }
function handleReset() { searchForm.keyword = ''; searchForm.product = ''; searchForm.status = '' }
function handleSizeChange() { pagination.currentPage = 1 }
function handleCurrentChange() { /* 分页逻辑由 filteredSkuList computed 处理 */ }

function handleAddSKU() {
  isEdit.value = false
  editingId.value = null
  Object.keys(skuForm).forEach(k => skuForm[k] = typeof skuForm[k] === 'boolean' ? true : (typeof skuForm[k] === 'number' ? 0 : ''))
  skuDialogVisible.value = true
}

function handleEditSKU(row) {
  isEdit.value = true
  editingId.value = row.id
  Object.keys(skuForm).forEach(k => { skuForm[k] = row[k] ?? '' })
  skuDialogVisible.value = true
}

function confirmSaveSKU() {
  if (!skuForm.skuCode) { ElMessage.warning('请输入SKU编码'); return }
  if (!skuForm.size) { ElMessage.warning('请输入尺码'); return }

  saving.value = true
  setTimeout(() => {
    if (isEdit.value) {
      const idx = skuList.value.findIndex(s => s.id === editingId.value)
      if (idx !== -1) Object.assign(skuList.value[idx], skuForm)
      ElMessage.success('编辑成功')
    } else {
      skuList.value.push({ ...skuForm, id: Date.now().toString() })
      ElMessage.success('添加成功')
    }
    saving.value = false
    skuDialogVisible.value = false
  }, 500)
}

function handleToggleSKU(row) {
  ElMessage.success(`${row.skuCode} 已${row.active ? '启用' : '停用'}`)
}

function handleDeleteSKU(row) {
  ElMessageBox.confirm(`确认删除SKU "${row.skuCode}"？`, '删除确认', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    .then(() => { skuList.value = skuList.value.filter(s => s.id !== row.id); ElMessage.success('删除成功') })
    .catch(() => {})
}

// 批量导入
function handleBatchImport() { importDialogVisible.value = true }
function handleFileChange(file) { importFile.value = file.raw }
function confirmImport() {
  if (!importFile.value) { ElMessage.warning('请选择文件'); return }
  importing.value = true
  setTimeout(() => {
    const newSKUs = Array.from({ length: 20 }, (_, i) => ({
      id: `import-${i}`,
      productId: 1,
      productName: productList.value[0].name,
      articleNo: 'IMPORT001',
      skuCode: `IMP001-${25 + i}`,
      color: ['白色', '黑色', '粉色'][i % 3],
      size: `${25 + i}码`,
      material: '网布',
      price: 158,
      stock: 50,
      barcode: '',
      active: true,
      remark: '批量导入'
    }))
    skuList.value.push(...newSKUs)
    pagination.total = skuList.value.length
    ElMessage.success(`成功导入 ${newSKUs.length} 个SKU`)
    importDialogVisible.value = false
    importFile.value = null
    importing.value = false
  }, 1000)
}

// 规格模板
function countSKUs(specs) {
  if (!specs.length) return 0
  return specs.reduce((acc, spec) => acc * spec.values.length, 1)
}

const previewSKUs = computed(() => {
  if (!templateForm.specs.length) return []
  const combos = templateForm.specs.reduce((acc, spec) => {
    const newAcc = []
    for (const item of acc) {
      for (const val of spec.values) {
        newAcc.push([...item, val])
      }
    }
    return newAcc
  }, [[]])
  return combos.map(c => c.join(' / '))
})

function handleAddTemplate() {
  isEditTemplate.value = false
  editingTemplateId.value = null
  templateForm.name = ''
  templateForm.specs = [{ name: '颜色', values: [], inputVisible: false, inputValue: '' }]
  templateDialogVisible.value = true
}

function handleEditTemplate(row) {
  isEditTemplate.value = true
  editingTemplateId.value = row.id
  templateForm.name = row.name
  templateForm.specs = row.specs.map(s => ({ ...s, inputVisible: false, inputValue: '' }))
  templateDialogVisible.value = true
}

function addSpec() {
  templateForm.specs.push({ name: '', values: [], inputVisible: false, inputValue: '' })
}

function removeSpec(index) {
  templateForm.specs.splice(index, 1)
}

function showSpecInput(index) {
  templateForm.specs[index].inputVisible = true
  templateForm.specs[index].inputValue = ''
}

function addSpecValue(index) {
  const spec = templateForm.specs[index]
  if (spec.inputValue && !spec.values.includes(spec.inputValue.trim())) {
    spec.values.push(spec.inputValue.trim())
  }
  spec.inputVisible = false
  spec.inputValue = ''
}

function removeSpecValue(specIndex, valIndex) {
  templateForm.specs[specIndex].values.splice(valIndex, 1)
}

function confirmSaveTemplate() {
  if (!templateForm.name) { ElMessage.warning('请输入模板名称'); return }
  if (!templateForm.specs.length) { ElMessage.warning('请添加至少一个规格项'); return }

  saving.value = true
  setTimeout(() => {
    if (isEditTemplate.value) {
      const idx = templateList.value.findIndex(t => t.id === editingTemplateId.value)
      if (idx !== -1) {
        templateList.value[idx] = { ...templateList.value[idx], name: templateForm.name, specs: templateForm.specs.map(s => ({ name: s.name, values: s.values })) }
      }
      ElMessage.success('编辑成功')
    } else {
      templateList.value.push({
        id: Date.now(),
        name: templateForm.name,
        specs: templateForm.specs.map(s => ({ name: s.name, values: s.values })),
        createTime: new Date().toLocaleString('zh-CN').replace(/\//g, '-')
      })
      ElMessage.success('添加成功')
    }
    saving.value = false
    templateDialogVisible.value = false
  }, 500)
}

function handleApplyTemplate(row) {
  ElMessage.info(`模板 "${row.name}" 将应用到商品，共生成 ${countSKUs(row.specs)} 个SKU`)
}

function handleDeleteTemplate(row) {
  ElMessageBox.confirm(`确认删除模板 "${row.name}"？`, '删除确认', { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' })
    .then(() => { templateList.value = templateList.value.filter(t => t.id !== row.id); ElMessage.success('删除成功') })
    .catch(() => {})
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

.pagination-container { display: flex; justify-content: flex-end; margin-top: $spacing-lg; }

.sku-code {
  font-family: monospace;
  color: #409EFF;
  font-size: 13px;
}

.barcode {
  font-family: monospace;
  color: #999;
  font-size: 12px;
}

.stock-warning { color: #F56C6C; font-weight: 600; }

.spec-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

// 规格模板样式
.spec-editor {
  width: 100%;
}

.spec-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.spec-sep {
  font-size: 16px;
  color: #999;
}

.spec-values {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.spec-value-tag {
  margin: 0;
}

.add-spec-btn {
  padding: 0 6px;
  height: 24px;
  line-height: 24px;
}

.remove-spec-btn {
  color: #F56C6C;
}

.add-spec-main {
  margin-top: 8px;
}

.sku-preview {
  width: 100%;
}

.preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
  max-height: 120px;
  overflow-y: auto;
}

.preview-sku-tag {
  margin: 0;
}

.preview-more {
  font-size: 12px;
  color: #999;
  align-self: center;
}

.spec-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.spec-group {
  font-size: 13px;
  color: #666;
  .spec-name {
    font-weight: 500;
    color: #333;
  }
  .spec-val {
    margin-left: 4px;
    padding: 1px 6px;
    background: #f0f9eb;
    border-radius: 3px;
    font-size: 12px;
    color: #67C23A;
  }
}
</style>
