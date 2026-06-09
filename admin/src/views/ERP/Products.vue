<template>
  <div class="page-container">
    <div class="page-card">
      <!-- 顶部统计 -->
      <el-row :gutter="12" class="stat-row">
        <el-col :span="6" v-for="stat in productStats" :key="stat.label">
          <div class="stat-card" :class="stat.class" @click="searchForm.status = stat.value; handleSearch()">
            <div class="stat-value">{{ stat.count }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </el-col>
      </el-row>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input v-model="searchForm.keyword" placeholder="货号/商品名称" clearable style="width: 200px" @keyup.enter="handleSearch" />
        <el-select v-model="searchForm.category" placeholder="分类" clearable style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="童鞋" value="shoe" />
          <el-option label="配件" value="accessory" />
        </el-select>
        <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 100px">
          <el-option label="在售" value="active" />
          <el-option label="下架" value="inactive" />
        </el-select>
        <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon> 查询</el-button>
        <el-button @click="handleReset"><el-icon><Refresh /></el-icon> 重置</el-button>
        <el-divider direction="vertical" />
        <el-button type="success" @click="handleAdd"><el-icon><Plus /></el-icon> 添加商品</el-button>
        <el-button type="warning" @click="handleBatchImport"><el-icon><Upload /></el-icon> 批量导入</el-button>
        <el-button type="info" @click="handleExport"><el-icon><Download /></el-icon> 导出</el-button>
        <el-divider direction="vertical" />
        <el-button type="primary" @click="handleBatchOnSale" :disabled="selectedRows.length === 0">批量上架</el-button>
        <el-button @click="handleBatchOffSale" :disabled="selectedRows.length === 0">批量下架</el-button>
      </div>

      <!-- 批量操作栏 -->
      <div class="batch-bar" v-if="selectedRows.length > 0">
        <span class="selected-count">已选择 <strong>{{ selectedRows.length }}</strong> 项</span>
        <el-button size="small" @click="handleSelectAll">全选</el-button>
        <el-button size="small" @click="handleInvertSelect">反选</el-button>
        <el-button type="success" size="small" @click="handleBatchOnSale">批量上架</el-button>
        <el-button size="small" @click="handleBatchOffSale">批量下架</el-button>
        <el-button type="danger" size="small" @click="handleBatchDelete">批量删除</el-button>
        <el-button size="small" @click="handleCancelSelect">取消选择</el-button>
      </div>

      <!-- 商品表格 -->
      <el-table :data="filteredTableData" v-loading="loading" stripe border style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <div class="product-img-wrapper">
              <el-image v-if="row.image" :src="row.image" fit="cover" class="product-img" :preview-src-list="[row.image]" />
              <div v-else class="product-img-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="200">
          <template #default="{ row }">
            <div class="product-name-cell">
              <span>{{ row.name }}</span>
              <el-tag v-if="row.category === 'shoe'" size="small" type="" effect="plain">童鞋</el-tag>
              <el-tag v-if="row.category === 'accessory'" size="small" type="info" effect="plain">配件</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="articleNo" label="货号" width="130">
          <template #default="{ row }">
            <span class="article-no">{{ row.articleNo }}</span>
            <el-button text type="primary" size="small" @click.stop="copyText(row.articleNo)">复制</el-button>
          </template>
        </el-table-column>
        <el-table-column label="尺码范围" width="100">
          <template #default="{ row }">{{ row.minSize }}-{{ row.maxSize }}</template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="90" align="right">
          <template #default="{ row }">
            <span class="price">¥{{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" align="center">
          <template #default="{ row }">
            <span :class="{ 'stock-warning': row.stock < 10 }">{{ row.stock }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sales" label="销量" width="80" align="center" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.active"
              size="small"
              :active-text="''"
              :inactive-text="''"
              inline-prompt
              @change="handleToggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="180">
          <template #default="{ row }">
            <el-button type="primary" text size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button :type="row.status === 'active' ? 'warning' : 'success'" text size="small" @click="handleQuickToggle(row)">
              {{ row.status === 'active' ? '下架' : '上架' }}
            </el-button>
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

    <!-- 商品编辑对话框 -->
    <el-dialog v-model="editDialogVisible" :title="isEdit ? '编辑商品' : '添加商品'" width="600px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="商品名称" required>
          <el-input v-model="editForm.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="货号" required>
          <el-input v-model="editForm.articleNo" placeholder="如: S14A2020DM" />
        </el-form-item>
        <el-form-item label="商品图片">
          <el-upload
            class="img-uploader"
            action="#"
            :auto-upload="false"
            list-type="picture-card"
            :limit="3"
            :on-change="handleImageChange"
            :file-list="imageFileList"
          >
            <el-icon><Plus /></el-icon>
            <template #tip>
              <div class="el-upload__tip">支持 jpg/png 格式，最多 3 张</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="尺码范围">
          <el-input-number v-model="editForm.minSize" :min="20" :max="40" style="width: 100px" />
          <span style="margin: 0 8px">-</span>
          <el-input-number v-model="editForm.maxSize" :min="20" :max="40" style="width: 100px" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="价格" required>
              <el-input-number v-model="editForm.price" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select v-model="editForm.category" style="width: 100%">
                <el-option label="童鞋" value="shoe" />
                <el-option label="配件" value="accessory" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="商品详情">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="商品描述、材质说明等..." />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="editForm.status">
            <el-radio value="active">在售</el-radio>
            <el-radio value="inactive">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="批量导入商品" width="500px">
      <el-upload drag :auto-upload="false" accept=".xlsx,.xls,.csv" :on-change="handleImportFileChange">
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">将商品Excel文件拖到此处，或<em>点击选择</em></div>
        <template #tip>
          <div class="el-upload__tip">
            支持 .xlsx / .xls / .csv 格式<br>
            Excel需包含：商品名称、货号、价格、库存 列
          </div>
        </template>
      </el-upload>
      <div class="import-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>可先<a href="#" class="link" @click.stop="downloadTemplate">下载导入模板</a>，填写后导入</span>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport" :loading="importing">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Search, Refresh, Plus, Picture, Upload, Download, UploadFilled, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const importing = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const pagination = reactive({ currentPage: 1, pageSize: 20, total: 0 })
const searchForm = reactive({ keyword: '', category: '', status: '' })

const editDialogVisible = ref(false)
const isEdit = ref(false)
const editForm = reactive({
  name: '', articleNo: '', minSize: 25, maxSize: 35,
  price: 0, category: 'shoe', status: 'active', description: '', image: ''
})
const imageFileList = ref([])

const importDialogVisible = ref(false)
const importFile = ref(null)

// 统计
const productStats = reactive([
  { label: '全部商品', value: '', count: 0, class: 'stat-total' },
  { label: '在售', value: 'active', count: 0, class: 'stat-active' },
  { label: '下架', value: 'inactive', count: 0, class: 'stat-inactive' },
  { label: '库存预警', value: 'low_stock', count: 0, class: 'stat-warning' },
])

onMounted(() => { fetchData() })

async function fetchData() {
  loading.value = true
  try {
    const articles = [
      { articleNo: 'S14A2020DM', name: '江博士童鞋 学步鞋S14A2020DM', minSize: 25, maxSize: 32, price: 158, category: 'shoe' },
      { articleNo: 'B1404559', name: '江博士童鞋 休闲鞋B1404559', minSize: 27, maxSize: 36, price: 198, category: 'shoe' },
      { articleNo: 'S14A2025AM', name: '江博士童鞋 运动鞋S14A2025AM', minSize: 28, maxSize: 35, price: 228, category: 'shoe' },
      { articleNo: 'B1404580', name: '江博士童鞋 凉鞋B1404580', minSize: 25, maxSize: 34, price: 168, category: 'shoe' },
      { articleNo: 'S14A2030DM', name: '江博士童鞋 雪地靴S14A2030DM', minSize: 26, maxSize: 33, price: 258, category: 'shoe' },
      { articleNo: 'B1404600', name: '江博士童鞋 帆布鞋B1404600', minSize: 25, maxSize: 34, price: 138, category: 'shoe' },
      { articleNo: 'S14A2040DM', name: '江博士童鞋 板鞋S14A2040DM', minSize: 27, maxSize: 36, price: 188, category: 'shoe' },
      { articleNo: 'ACC001', name: '儿童鞋垫-透气型', minSize: 0, maxSize: 0, price: 28, category: 'accessory' },
      { articleNo: 'ACC002', name: '儿童袜子-纯棉（3双装）', minSize: 0, maxSize: 0, price: 38, category: 'accessory' },
    ]
    tableData.value = articles.map((a, i) => ({
      ...a,
      id: i + 1,
      active: true,
      stock: i === 0 ? 3 : i === 1 ? 5 : Math.floor(Math.random() * 100) + 5,
      sales: Math.floor(Math.random() * 500) + 20,
      status: i === 7 ? 'inactive' : 'active',
      image: i === 0 ? 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children%20sneaker%20product%20photo%20on%20white%20background&image_size=square' : '',
      description: ''
    }))

    updateStats()
  } catch { /* fail silently */ }
  finally { loading.value = false }
}

function updateStats() {
  productStats[0].count = tableData.value.length
  productStats[1].count = tableData.value.filter(p => p.status === 'active').length
  productStats[2].count = tableData.value.filter(p => p.status === 'inactive').length
  productStats[3].count = tableData.value.filter(p => p.stock < 10).length
}

// 筛选
const filteredTableData = computed(() => {
  let list = tableData.value
  if (searchForm.keyword) {
    const kw = searchForm.keyword.toLowerCase()
    list = list.filter(p =>
      p.name.toLowerCase().includes(kw) ||
      p.articleNo.toLowerCase().includes(kw)
    )
  }
  if (searchForm.category) list = list.filter(p => p.category === searchForm.category)
  if (searchForm.status) list = list.filter(p => p.status === searchForm.status)
  pagination.total = list.length
  const start = (pagination.currentPage - 1) * pagination.pageSize
  return list.slice(start, start + pagination.pageSize)
})

function handleSearch() { pagination.currentPage = 1 }
function handleReset() {
  searchForm.keyword = ''; searchForm.category = ''; searchForm.status = ''
  pagination.currentPage = 1
}
function handleSizeChange() { pagination.currentPage = 1 }
function handleCurrentChange() {}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

function handleSelectAll() {
  tableData.value.forEach(row => {
    row.checked = true
  })
  ElMessage.success('已全选')
}

function handleInvertSelect() {
  // Re-fetch would be needed for proper invert with el-table selection
  ElMessage.info('请在表格中手动反选')
}

function handleCancelSelect() {
  selectedRows.value = []
}

function copyText(text) {
  navigator.clipboard?.writeText(text)
  ElMessage.success('已复制')
}

function handleAdd() {
  isEdit.value = false
  Object.assign(editForm, {
    name: '', articleNo: '', minSize: 25, maxSize: 35,
    price: 0, category: 'shoe', status: 'active', description: '', image: ''
  })
  imageFileList.value = []
  editDialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  Object.assign(editForm, { ...row })
  imageFileList.value = row.image ? [{ name: '图片', url: row.image }] : []
  editDialogVisible.value = true
}

function handleImageChange(file, fileList) {
  imageFileList.value = fileList
  // In production, upload to server and get URL
  if (file.raw) {
    editForm.image = URL.createObjectURL(file.raw)
  }
}

function confirmEdit() {
  if (!editForm.name || !editForm.articleNo) { ElMessage.warning('请填写完整信息'); return }
  if (editForm.price <= 0) { ElMessage.warning('请输入有效价格'); return }

  if (isEdit.value) {
    const idx = tableData.value.findIndex(p => p.id === editForm.id)
    if (idx !== -1) {
      Object.assign(tableData.value[idx], editForm)
    }
    ElMessage.success('编辑成功')
  } else {
    const newId = Math.max(0, ...tableData.value.map(p => p.id)) + 1
    tableData.value.unshift({
      ...editForm,
      id: newId,
      active: true,
      stock: 0,
      sales: 0
    })
    ElMessage.success('添加成功')
  }
  updateStats()
  editDialogVisible.value = false
}

function handleToggleStatus(row) {
  row.status = row.active ? 'active' : 'inactive'
  ElMessage.success(`${row.name} 已${row.active ? '上架' : '下架'}`)
  updateStats()
}

function handleQuickToggle(row) {
  row.status = row.status === 'active' ? 'inactive' : 'active'
  row.active = row.status === 'active'
  ElMessage.success(`${row.name} 已${row.status === 'active' ? '上架' : '下架'}`)
  updateStats()
}

function handleDelete(row) {
  ElMessageBox.confirm(`确认删除商品 "${row.name}"？此操作不可恢复。`, '确认删除', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    tableData.value = tableData.value.filter(p => p.id !== row.id)
    updateStats()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 批量操作
function handleBatchOnSale() {
  if (selectedRows.value.length === 0) { ElMessage.warning('请选择商品'); return }
  selectedRows.value.forEach(p => { p.status = 'active'; p.active = true })
  ElMessage.success(`已上架 ${selectedRows.value.length} 个商品`)
  selectedRows.value = []
  updateStats()
}

function handleBatchOffSale() {
  if (selectedRows.value.length === 0) { ElMessage.warning('请选择商品'); return }
  selectedRows.value.forEach(p => { p.status = 'inactive'; p.active = false })
  ElMessage.success(`已下架 ${selectedRows.value.length} 个商品`)
  selectedRows.value = []
  updateStats()
}

function handleBatchDelete() {
  if (selectedRows.value.length === 0) { ElMessage.warning('请选择商品'); return }
  ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 个商品？`, '批量删除', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const ids = selectedRows.value.map(p => p.id)
    tableData.value = tableData.value.filter(p => !ids.includes(p.id))
    ElMessage.success(`已删除 ${ids.length} 个商品`)
    selectedRows.value = []
    updateStats()
  }).catch(() => {})
}

// 批量导入
function handleBatchImport() { importDialogVisible.value = true }
function handleImportFileChange(file) { importFile.value = file.raw }
function confirmImport() {
  if (!importFile.value) { ElMessage.warning('请选择文件'); return }
  importing.value = true
  setTimeout(() => {
    const newProducts = [
      { id: Date.now(), articleNo: 'S14A2050DM', name: '导入商品-学步鞋', minSize: 25, maxSize: 32, price: 158, category: 'shoe', status: 'active', active: true, stock: 50, sales: 0, image: '', description: '' },
      { id: Date.now() + 1, articleNo: 'B1404610', name: '导入商品-休闲鞋', minSize: 27, maxSize: 36, price: 178, category: 'shoe', status: 'active', active: true, stock: 30, sales: 0, image: '', description: '' },
    ]
    tableData.value.unshift(...newProducts)
    ElMessage.success(`成功导入 ${newProducts.length} 个商品`)
    importDialogVisible.value = false
    importFile.value = null
    importing.value = false
    updateStats()
  }, 1000)
}

function downloadTemplate() {
  const csvContent = '\ufeff商品名称,货号,最小尺码,最大尺码,价格,分类,库存\n江博士童鞋 学步鞋,S14A2020DM,25,32,158,shoe,100'
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = '商品导入模板.csv'
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('模板已下载')
}

// 导出
function handleExport() {
  const data = tableData.value.map(p => ({
    商品名称: p.name,
    货号: p.articleNo,
    最小尺码: p.minSize || '-',
    最大尺码: p.maxSize || '-',
    价格: p.price,
    库存: p.stock,
    销量: p.sales,
    分类: p.category === 'shoe' ? '童鞋' : '配件',
    状态: p.status === 'active' ? '在售' : '下架',
  }))

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `商品列表_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('导出成功')
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';
.pagination-container { display: flex; justify-content: flex-end; margin-top: $spacing-lg; }

.stat-row { margin-bottom: 16px; }
.stat-card {
  padding: 14px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
}
.stat-value { font-size: 24px; font-weight: 700; }
.stat-label { font-size: 12px; margin-top: 4px; }
.stat-total { background: #f5f7fa; .stat-value { color: #303133; } }
.stat-active { background: #f0f9eb; .stat-value { color: #67C23A; } }
.stat-inactive { background: #f4f4f5; .stat-value { color: #909399; } }
.stat-warning { background: #fef0f0; .stat-value { color: #F56C6C; } }

.product-img-wrapper { display: flex; align-items: center; justify-content: center; }
.product-img { width: 50px; height: 50px; border-radius: 8px; }
.product-img-placeholder {
  width: 50px;
  height: 50px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
}
.stock-warning { color: #F56C6C; font-weight: 600; }
.article-no { font-family: monospace; color: #E6A23C; font-size: 12px; }
.price { color: #F56C6C; font-weight: 600; }

.product-name-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.search-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 12px;
}

.batch-bar { display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: #f0f9eb; border-radius: 6px; margin-bottom: 12px; border: 1px solid #c2e7b0; }
.selected-count { font-size: 13px; color: #666; strong { color: #67C23A; } }

.import-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
  margin-top: 12px;
  .link { color: #409EFF; text-decoration: underline; cursor: pointer; }
}
</style>
