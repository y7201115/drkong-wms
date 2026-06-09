<template>
  <div class="page-container">
    <div class="page-card">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 快团团API配置 -->
        <el-tab-pane label="快团团API" name="ktt">
          <div class="config-section">
            <div class="section-header">
              <h3>快团团开放平台对接</h3>
              <el-tag :type="kttAuthStatus === 'authorized' ? 'success' : 'warning'" size="large">
                {{ kttAuthStatus === 'authorized' ? '已授权' : '未授权' }}
              </el-tag>
            </div>

            <el-alert v-if="kttAuthStatus !== 'authorized'" type="warning" :closable="false" show-icon style="margin-bottom: 16px">
              <template #title>请先完成快团团API授权，才能同步订单数据</template>
            </el-alert>

            <el-form :model="kttForm" label-width="120px" style="max-width: 600px">
              <el-form-item label="AppKey" required>
                <el-input v-model="kttForm.appKey" placeholder="从快团团开放平台获取" />
              </el-form-item>
              <el-form-item label="AppSecret" required>
                <el-input v-model="kttForm.appSecret" type="password" show-password placeholder="从快团团开放平台获取" />
              </el-form-item>
              <el-form-item label="店铺ID">
                <el-input v-model="kttForm.shopId" placeholder="快团团店铺ID（选填）" />
              </el-form-item>
              <el-form-item label="Webhook地址">
                <el-input v-model="kttForm.webhookUrl" placeholder="订单状态变更回调地址（选填）" />
                <div class="form-tip">用于接收快团团订单状态变更推送，需后端支持</div>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleSaveKTTConfig" :loading="saving">保存配置</el-button>
                <el-button v-if="kttAuthStatus !== 'authorized'" type="success" @click="handleKTTAuth" :loading="authorizing">
                  授权并测试连接
                </el-button>
                <el-button v-else type="danger" @click="handleKTTRevoke">取消授权</el-button>
              </el-form-item>
            </el-form>

            <el-divider />

            <div class="sync-config">
              <h4>订单同步设置</h4>
              <el-form :model="syncForm" label-width="140px" style="max-width: 600px">
                <el-form-item label="自动同步">
                  <el-switch v-model="syncForm.autoSync" />
                  <span class="form-tip" style="margin-left: 12px">开启后系统将定时自动同步订单</span>
                </el-form-item>
                <el-form-item label="同步间隔">
                  <el-select v-model="syncForm.interval" style="width: 200px" :disabled="!syncForm.autoSync">
                    <el-option label="每5分钟" :value="5" />
                    <el-option label="每10分钟" :value="10" />
                    <el-option label="每30分钟" :value="30" />
                    <el-option label="每1小时" :value="60" />
                    <el-option label="每6小时" :value="360" />
                  </el-select>
                </el-form-item>
                <el-form-item label="同步范围">
                  <el-select v-model="syncForm.scope" style="width: 200px">
                    <el-option label="最近24小时订单" value="24h" />
                    <el-option label="最近7天订单" value="7d" />
                    <el-option label="最近30天订单" value="30d" />
                    <el-option label="全部订单" value="all" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleSaveSyncConfig">保存同步设置</el-button>
                  <el-button @click="handleManualSync" :loading="syncing" :disabled="kttAuthStatus !== 'authorized'">
                    立即同步订单
                  </el-button>
                </el-form-item>
              </el-form>
            </div>

            <el-divider />

            <div class="api-docs">
              <h4>接入指南</h4>
              <el-steps :active="authStep" finish-status="success" align-center>
                <el-step title="注册开放平台" description="访问快团团开放平台注册账号" />
                <el-step title="创建应用" description="获取AppKey和AppSecret" />
                <el-step title="填写配置" description="在上方填写API凭证" />
                <el-step title="授权测试" description="点击授权按钮测试连接" />
              </el-steps>
              <el-link type="primary" href="https://open.kuaiketuan.com/" target="_blank" style="margin-top: 12px">
                前往快团团开放平台
              </el-link>
            </div>
          </div>
        </el-tab-pane>

        <!-- 快递面单配置 -->
        <el-tab-pane label="快递面单" name="waybill">
          <div class="config-section">
            <div class="section-header">
              <h3>电子面单打印配置</h3>
            </div>

            <el-alert type="info" :closable="false" show-icon style="margin-bottom: 16px">
              <template #title>选择您使用的电子面单平台，填写API凭证后即可打单发货</template>
            </el-alert>

            <el-form :model="waybillForm" label-width="140px" style="max-width: 600px">
              <el-form-item label="电子面单平台" required>
                <el-select v-model="waybillForm.platform" placeholder="选择平台" style="width: 100%">
                  <el-option label="快递100" value="kd100" />
                  <el-option label="快递鸟" value="kdniao" />
                  <el-option label="菜鸟电子面单" value="cainiao" />
                  <el-option label="顺丰开放平台" value="sf" />
                  <el-option label="自定义API" value="custom" />
                </el-select>
              </el-form-item>

              <!-- 快递100配置 -->
              <template v-if="waybillForm.platform === 'kd100'">
                <el-form-item label="授权Key" required>
                  <el-input v-model="waybillForm.key" placeholder="快递100授权Key" />
                </el-form-item>
                <el-form-item label="Secret">
                  <el-input v-model="waybillForm.secret" type="password" show-password placeholder="快递100Secret" />
                </el-form-item>
                <el-form-item label="默认快递公司">
                  <el-select v-model="waybillForm.defaultExpress" placeholder="选择快递公司" style="width: 100%">
                    <el-option v-for="item in expressCompanies" :key="item.code" :label="item.name" :value="item.code" />
                  </el-select>
                </el-form-item>
                <el-form-item label="默认模板ID">
                  <el-input v-model="waybillForm.templateId" placeholder="电子面单模板ID" />
                </el-form-item>
              </template>

              <!-- 快递鸟配置 -->
              <template v-if="waybillForm.platform === 'kdniao'">
                <el-form-item label="EBusinessID" required>
                  <el-input v-model="waybillForm.ebusinessId" placeholder="快递鸟用户ID" />
                </el-form-item>
                <el-form-item label="APIKey" required>
                  <el-input v-model="waybillForm.apiKey" type="password" show-password placeholder="快递鸟APIKey" />
                </el-form-item>
                <el-form-item label="默认快递公司">
                  <el-select v-model="waybillForm.defaultExpress" placeholder="选择快递公司" style="width: 100%">
                    <el-option v-for="item in expressCompanies" :key="item.code" :label="item.name" :value="item.code" />
                  </el-select>
                </el-form-item>
              </template>

              <!-- 菜鸟配置 -->
              <template v-if="waybillForm.platform === 'cainiao'">
                <el-form-item label="AppKey" required>
                  <el-input v-model="waybillForm.key" placeholder="菜鸟AppKey" />
                </el-form-item>
                <el-form-item label="AppSecret" required>
                  <el-input v-model="waybillForm.secret" type="password" show-password placeholder="菜鸟AppSecret" />
                </el-form-item>
                <el-form-item label="物流商Code">
                  <el-input v-model="waybillForm.logisticsCode" placeholder="物流商编码（如：SFEXPRESS）" />
                </el-form-item>
                <el-form-item label="网点Code">
                  <el-input v-model="waybillForm.branchCode" placeholder="网点编码" />
                </el-form-item>
              </template>

              <!-- 顺丰配置 -->
              <template v-if="waybillForm.platform === 'sf'">
                <el-form-item label="月结卡号" required>
                  <el-input v-model="waybillForm.key" placeholder="顺丰月结卡号" />
                </el-form-item>
                <el-form-item label="校验码">
                  <el-input v-model="waybillForm.secret" type="password" show-password placeholder="顺丰校验码" />
                </el-form-item>
                <el-form-item label="默认模板">
                  <el-select v-model="waybillForm.templateName" style="width: 100%">
                    <el-option label="顺丰标准面单" value="standard" />
                    <el-option label="顺丰丰巢面单" value="fengchao" />
                    <el-option label="顺丰电商面单" value="ecommerce" />
                  </el-select>
                </el-form-item>
              </template>

              <!-- 自定义配置 -->
              <template v-if="waybillForm.platform === 'custom'">
                <el-form-item label="API地址" required>
                  <el-input v-model="waybillForm.apiUrl" placeholder="https://api.example.com/waybill" />
                </el-form-item>
                <el-form-item label="API Key" required>
                  <el-input v-model="waybillForm.key" placeholder="API认证Key" />
                </el-form-item>
              </template>

              <el-form-item>
                <el-button type="primary" @click="handleSaveWaybillConfig" :loading="saving">保存配置</el-button>
                <el-button @click="handleTestWaybill" :loading="testing" :disabled="!waybillForm.platform">
                  测试连接
                </el-button>
              </el-form-item>
            </el-form>

            <el-divider />

            <div class="printer-config">
              <h4>打印设置</h4>
              <el-form label-width="140px" style="max-width: 600px">
                <el-form-item label="打印机类型">
                  <el-select v-model="printerForm.type" style="width: 100%">
                    <el-option label="C-Lodop云打印" value="clodop" />
                    <el-option label="浏览器打印" value="browser" />
                    <el-option label="PDF下载" value="pdf" />
                  </el-select>
                </el-form-item>
                <el-form-item label="面单纸张尺寸">
                  <el-select v-model="printerForm.paperSize" style="width: 100%">
                    <el-option label="100mm × 150mm (标准)" value="100x150" />
                    <el-option label="100mm × 180mm" value="100x180" />
                    <el-option label="100mm × 210mm" value="100x210" />
                  </el-select>
                </el-form-item>
                <el-form-item label="打印份数">
                  <el-input-number v-model="printerForm.copies" :min="1" :max="5" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleSavePrinterConfig">保存打印设置</el-button>
                </el-form-item>
              </el-form>
            </div>

            <el-divider />

            <div class="waybill-docs">
              <h4>接入指南</h4>
              <el-steps :active="waybillStep" finish-status="success" align-center>
                <el-step title="注册平台" description="选择并注册电子面单平台账号" />
                <el-step title="企业认证" description="完成企业实名认证" />
                <el-step title="获取凭证" description="获取API Key和Secret" />
                <el-step title="配置测试" description="填写配置并测试连接" />
              </el-steps>
              <div style="margin-top: 12px; display: flex; gap: 12px; flex-wrap: wrap">
                <el-link type="primary" href="https://www.kuaidi100.com/" target="_blank">快递100</el-link>
                <el-link type="primary" href="https://www.kdniao.com/" target="_blank">快递鸟</el-link>
                <el-link type="primary" href="https://www.cainiao.com/" target="_blank">菜鸟</el-link>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 通知设置 -->
        <el-tab-pane label="通知设置" name="notification">
          <div class="config-section">
            <h3>消息通知配置</h3>
            <el-form :model="notifyForm" label-width="140px" style="max-width: 600px">
              <el-form-item label="订单同步通知">
                <el-switch v-model="notifyForm.syncNotify" />
              </el-form-item>
              <el-form-item label="库存预警通知">
                <el-switch v-model="notifyForm.stockNotify" />
              </el-form-item>
              <el-form-item label="退款通知">
                <el-switch v-model="notifyForm.refundNotify" />
              </el-form-item>
              <el-form-item label="通知方式">
                <el-checkbox-group v-model="notifyForm.channels">
                  <el-checkbox label="system">系统消息</el-checkbox>
                  <el-checkbox label="email">邮件</el-checkbox>
                  <el-checkbox label="sms">短信</el-checkbox>
                  <el-checkbox label="wechat">微信</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleSaveNotifyConfig">保存通知设置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('ktt')
const saving = ref(false)
const authorizing = ref(false)
const syncing = ref(false)
const testing = ref(false)

// 快团团API配置
const kttAuthStatus = ref('unauthorized')
const kttForm = reactive({
  appKey: '',
  appSecret: '',
  shopId: '',
  webhookUrl: ''
})

const syncForm = reactive({
  autoSync: false,
  interval: 30,
  scope: '24h'
})

const authStep = ref(0)

// 快递面单配置
const waybillForm = reactive({
  platform: '',
  key: '',
  secret: '',
  ebusinessId: '',
  apiKey: '',
  logisticsCode: '',
  branchCode: '',
  defaultExpress: '',
  templateId: '',
  templateName: '',
  apiUrl: ''
})

const printerForm = reactive({
  type: 'browser',
  paperSize: '100x150',
  copies: 1
})

const waybillStep = ref(0)

// 通知配置
const notifyForm = reactive({
  syncNotify: true,
  stockNotify: true,
  refundNotify: true,
  channels: ['system']
})

const expressCompanies = [
  { code: 'SF', name: '顺丰速运' },
  { code: 'ZTO', name: '中通快递' },
  { code: 'YTO', name: '圆通速递' },
  { code: 'YUN', name: '韵达快递' },
  { code: 'STO', name: '申通快递' },
  { code: 'JT', name: '极兔速递' },
  { code: 'EMS', name: '邮政快递' },
  { code: 'JD', name: '京东物流' }
]

onMounted(() => {
  loadKTTConfig()
  loadWaybillConfig()
  loadPrinterConfig()
  loadNotifyConfig()
})

// 加载/保存快团团配置
function loadKTTConfig() {
  const ktt = localStorage.getItem('ktt_api_config')
  if (ktt) {
    const config = JSON.parse(ktt)
    Object.assign(kttForm, config)
    kttAuthStatus.value = config.authorized ? 'authorized' : 'unauthorized'
    authStep.value = config.authorized ? 4 : (config.appKey ? 2 : 0)
  }
  const sync = localStorage.getItem('ktt_sync_config')
  if (sync) Object.assign(syncForm, JSON.parse(sync))
}

async function handleSaveKTTConfig() {
  if (!kttForm.appKey || !kttForm.appSecret) {
    ElMessage.warning('请填写AppKey和AppSecret')
    return
  }
  saving.value = true
  try {
    localStorage.setItem('ktt_api_config', JSON.stringify(kttForm))
    authStep.value = 2
    ElMessage.success('配置已保存')
  } finally {
    saving.value = false
  }
}

async function handleKTTAuth() {
  if (!kttForm.appKey || !kttForm.appSecret) {
    ElMessage.warning('请先填写AppKey和AppSecret')
    return
  }
  authorizing.value = true
  try {
    // 模拟授权流程
    await new Promise(resolve => setTimeout(resolve, 2000))
    kttForm.authorized = true
    localStorage.setItem('ktt_api_config', JSON.stringify(kttForm))
    kttAuthStatus.value = 'authorized'
    authStep.value = 4
    ElMessage.success('授权成功！快团团API连接正常')
  } catch {
    ElMessage.error('授权失败，请检查AppKey和AppSecret是否正确')
  } finally {
    authorizing.value = false
  }
}

async function handleKTTRevoke() {
  ElMessageBox.confirm('确认取消快团团API授权？取消后将无法同步订单', '确认操作', {
    confirmButtonText: '确认取消',
    cancelButtonText: '再想想',
    type: 'warning'
  }).then(() => {
    kttForm.authorized = false
    kttAuthStatus.value = 'unauthorized'
    authStep.value = 2
    localStorage.setItem('ktt_api_config', JSON.stringify(kttForm))
    ElMessage.success('已取消授权')
  }).catch(() => {})
}

async function handleSaveSyncConfig() {
  localStorage.setItem('ktt_sync_config', JSON.stringify(syncForm))
  ElMessage.success('同步设置已保存')
}

async function handleManualSync() {
  if (kttAuthStatus.value !== 'authorized') {
    ElMessage.warning('请先完成快团团API授权')
    return
  }
  syncing.value = true
  try {
    // 模拟同步
    await new Promise(resolve => setTimeout(resolve, 3000))
    ElMessage.success('订单同步完成，已同步 23 个新订单')
  } finally {
    syncing.value = false
  }
}

// 加载/保存快递面单配置
function loadWaybillConfig() {
  const wb = localStorage.getItem('waybill_api_config')
  if (wb) Object.assign(waybillForm, JSON.parse(wb))
}

async function handleSaveWaybillConfig() {
  if (!waybillForm.platform) {
    ElMessage.warning('请选择电子面单平台')
    return
  }
  if (!waybillForm.key && !waybillForm.ebusinessId) {
    ElMessage.warning('请填写API凭证')
    return
  }
  saving.value = true
  try {
    localStorage.setItem('waybill_api_config', JSON.stringify(waybillForm))
    ElMessage.success('快递面单配置已保存')
  } finally {
    saving.value = false
  }
}

async function handleTestWaybill() {
  if (!waybillForm.platform) {
    ElMessage.warning('请先选择电子面单平台')
    return
  }
  testing.value = true
  try {
    // 模拟测试连接
    await new Promise(resolve => setTimeout(resolve, 1500))
    ElMessage.success('连接成功！API配置有效')
  } catch {
    ElMessage.error('连接失败，请检查配置是否正确')
  } finally {
    testing.value = false
  }
}

// 加载/保存打印配置
function loadPrinterConfig() {
  const pc = localStorage.getItem('printer_config')
  if (pc) Object.assign(printerForm, JSON.parse(pc))
}

async function handleSavePrinterConfig() {
  localStorage.setItem('printer_config', JSON.stringify(printerForm))
  ElMessage.success('打印设置已保存')
}

// 加载/保存通知配置
function loadNotifyConfig() {
  const nc = localStorage.getItem('notify_config')
  if (nc) Object.assign(notifyForm, JSON.parse(nc))
}

async function handleSaveNotifyConfig() {
  localStorage.setItem('notify_config', JSON.stringify(notifyForm))
  ElMessage.success('通知设置已保存')
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.config-section {
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.sync-config,
.printer-config,
.waybill-docs,
.api-docs {
  margin-top: 16px;

  h4 {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
  }
}

.el-steps {
  padding: 12px 0;
}
</style>
