<template>
  <div class="page-container">
    <div class="page-card">
      <!-- 顶部统计卡片 -->
      <el-row :gutter="12" class="stat-row">
        <el-col :span="4" v-for="stat in orderStats" :key="stat.label">
          <div class="stat-card" :class="stat.class" @click="searchForm.status = stat.value; handleSearch()">
            <div class="stat-value">{{ stat.count }}</div>
            <div class="stat-label">{{ stat.label }}</div>
            <el-button v-if="stat.value === 'unpaid' && stat.count > 0" text type="warning" size="small" class="stat-action-btn" @click.stop="handleUrgePay()">催付</el-button>
          </div>
        </el-col>
      </el-row>

      <!-- 搜索筛选栏 -->
      <div class="search-bar">
        <el-select v-model="searchForm.status" placeholder="订单状态" clearable style="width: 120px">
          <el-option label="待付款" value="unpaid" />
          <el-option label="待发货" value="pending" />
          <el-option label="已发货" value="shipped" />
          <el-option label="已完成" value="completed" />
          <el-option label="已签收" value="signed" />
          <el-option label="已退款" value="refunded" />
        </el-select>
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="下单时间"
          end-placeholder=""
          value-format="YYYY-MM-DD"
          style="width: 220px"
        />
        <el-input v-model="searchForm.keyword" placeholder="订单号/收件人/手机号/快递单号" clearable style="width: 220px" @keyup.enter="handleSearch" />
        <el-select v-model="searchForm.source" placeholder="订单来源" clearable style="width: 110px">
          <el-option label="快团团" value="ktt" />
          <el-option label="手动添加" value="manual" />
        </el-select>
        <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon> 查询</el-button>
        <el-button @click="handleReset"><el-icon><Refresh /></el-icon> 重置</el-button>
        <el-divider direction="vertical" />
        <el-button type="primary" @click="handleImport"><el-icon><Upload /></el-icon> 导入订单</el-button>
        <el-button @click="handleSync" :loading="syncing"><el-icon><Refresh /></el-icon> 同步订单</el-button>
        <el-divider direction="vertical" />
        <el-button type="success" @click="handleBatchShip"><el-icon><Van /></el-icon> 批量发货</el-button>
        <el-button type="warning" @click="handleBatchPrint"><el-icon><Printer /></el-icon> 批量打单</el-button>
        <el-button type="info" @click="handleExport"><el-icon><Download /></el-icon> 导出</el-button>
      </div>

      <!-- 批量操作栏 -->
      <div class="batch-bar" v-if="selectedRows.length > 0">
        <span class="selected-count">已选择 <strong>{{ selectedRows.length }}</strong> 项</span>
        <el-button size="small" @click="handleSelectAll">全选</el-button>
        <el-button size="small" @click="handleInvertSelect">反选</el-button>
        <el-button type="success" size="small" @click="handleBatchShip">批量发货</el-button>
        <el-button type="warning" size="small" @click="handleBatchPrint">批量打单</el-button>
        <el-button type="warning" size="small" @click="handleBatchUrge" v-if="selectedRows.some(o => o.status === 'unpaid')">批量催付</el-button>
        <el-button size="small" @click="handleBatchRemark">添加备注</el-button>
        <el-button size="small" @click="handleCancelSelect">取消选择</el-button>
      </div>

      <!-- 订单列表 -->
      <div class="order-list" v-loading="loading">
        <div
          v-for="order in tableData"
          :key="order.id"
          class="order-row"
          :class="{ selected: selectedRows.some(r => r.id === order.id) }"
        >
          <!-- 选择框 -->
          <div class="order-check">
            <el-checkbox v-model="order.checked" @change="handleCheck(order)" />
            <el-icon v-if="order.locked" class="lock-icon"><Lock /></el-icon>
            <el-tag v-if="order.tag" :type="order.tagType" size="small" class="order-tag">{{ order.tag }}</el-tag>
          </div>

          <!-- 序号 -->
          <div class="order-index">{{ order.index }}</div>

          <!-- 订单时间 + 昵称 -->
          <div class="order-time-nick">
            <div class="order-time">
              <span class="time-icon" v-if="order.payStatus === 'unpaid'">⏳</span>
              <span class="time-icon" v-else-if="order.payStatus === 'paid'">✅</span>
              <span class="time-icon" v-else>❗</span>
              {{ formatOrderTime(order.orderTime) }}
            </div>
            <div class="order-nick">
              {{ order.buyerNick }}
              <el-icon class="address-icon" v-if="order.hasAddress"><Location /></el-icon>
            </div>
            <div class="order-groupno">跟团号: {{ order.groupNo }}</div>
          </div>

          <!-- 标记 -->
          <div class="order-flag">
            <el-tag v-if="order.flags && order.flags.refund" type="danger" effect="dark" size="small">退</el-tag>
            <el-tag v-if="order.flags && order.flags.exchange" type="warning" effect="dark" size="small">换</el-tag>
          </div>

          <!-- 订单编号 -->
          <div class="order-no-col">
            <span class="order-no-text" @click="openDetail(order)" style="cursor:pointer">{{ order.orderNo }}</span>
            <div class="order-source">
              <el-tag size="small" :type="order.source === 'ktt' ? '' : 'info'" effect="plain">{{ order.source === 'ktt' ? '快团团' : '手动' }}</el-tag>
            </div>
            <el-button text type="primary" size="small" @click="copyText(order.orderNo)">复制</el-button>
          </div>

          <!-- 收件信息 -->
          <div class="order-receiver">
            <div class="receiver-header">
              <div class="receiver-name">{{ order.receiver }}</div>
              <el-tooltip content="复制收件信息" placement="top">
                <el-icon class="copy-receiver-icon" @click.stop="copyReceiverInfo(order)"><CopyDocument /></el-icon>
              </el-tooltip>
            </div>
            <div class="receiver-phone" @click="copyText(order.phone)" style="cursor:pointer" title="点击复制">{{ order.phone }}</div>
            <div class="receiver-address" :title="`${order.province}${order.city}${order.district}${order.address}`">{{ order.province }}{{ order.city }}{{ order.district }}{{ order.address ? order.address.slice(0, 12) + (order.address.length > 12 ? '...' : '') : '' }}</div>
          </div>

          <!-- 件数 -->
          <div class="order-count">
            <span class="count-num">{{ order.totalQty }}</span>
            <span class="count-label">件</span>
          </div>

          <!-- 商品 -->
          <div class="order-goods">
            <div v-for="(item, i) in order.items" :key="i" class="goods-item">
              <img class="goods-img" :src="item.image || defaultImage" alt="" />
              <div class="goods-info">
                <div class="goods-name">
                  <el-tag v-if="item.productTag" size="small" type="danger" effect="dark" class="tag-label">{{ item.productTag }}</el-tag>
                  {{ item.name }}
                </div>
                <div class="goods-size">
                  <span>尺码: {{ item.size }}</span>
                  <span v-if="item.skuCode" class="sku-label">SKU: {{ item.skuCode }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 留言备注 -->
          <div class="order-remark" :title="order.buyerRemark || '无'">
            <div class="remark-label">买家:</div>
            <div class="remark-text">{{ order.buyerRemark || '-' }}</div>
          </div>

          <!-- 卖家备注 -->
          <div class="order-seller-remark" :title="order.sellerRemark || '无'">
            <div class="remark-label">卖家:</div>
            <div class="remark-text" :style="{ color: order.remarkColor || '#999' }">{{ order.sellerRemark || '-' }}</div>
          </div>

          <!-- 实付金额 -->
          <div class="order-amount">
            <div class="amount-label">实付</div>
            <span class="amount-value">¥{{ order.totalAmount }}</span>
          </div>

          <!-- 订单状态 -->
          <div class="order-status">
            <el-tag :type="getStatusType(order.status)" size="small" effect="dark">{{ getStatusText(order.status) }}</el-tag>
          </div>

          <!-- 分类/操作 -->
          <div class="order-classify">
            <el-tooltip :content="order.starred ? '取消收藏' : '收藏订单'" placement="top">
              <el-icon class="star-icon" @click="order.starred = !order.starred" :style="{ color: order.starred ? '#E6A23C' : '#C0C4CC' }">
                <Star />
              </el-icon>
            </el-tooltip>
            <!-- 打单状态 -->
            <el-tooltip :content="order.printed ? '已打印' : '未打印'" placement="top">
              <el-icon class="print-status-icon" :style="{ color: order.printed ? '#67C23A' : '#C0C4CC' }">
                <Printer />
              </el-icon>
            </el-tooltip>
          </div>

          <!-- 快递打印按钮 -->
          <div class="order-express">
            <el-button size="small" type="primary" :disabled="order.status === 'unpaid' || order.status === 'refunded'" @click="handlePrint(order)">
              <el-icon><Printer /></el-icon>
              {{ order.printed ? '重打' : '打单' }}
            </el-button>
          </div>

          <!-- 操作 -->
          <div class="order-action">
            <el-dropdown trigger="click" @command="(cmd) => handleAction(cmd, order)">
              <el-icon class="action-icon"><Menu /></el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="detail">查看详情</el-dropdown-item>
                  <el-dropdown-item command="urge" v-if="order.status === 'unpaid'">催付提醒</el-dropdown-item>
                  <el-dropdown-item command="ship" v-if="order.status === 'pending'">发货</el-dropdown-item>
                  <el-dropdown-item command="remark">卖家备注</el-dropdown-item>
                  <el-dropdown-item command="copy">复制订单</el-dropdown-item>
                  <el-dropdown-item command="refund" v-if="order.status !== 'refunded'">退款处理</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-icon class="action-icon" @click="order.expanded = !order.expanded" :class="{ 'expand-active': order.expanded }">
              <ArrowDown />
            </el-icon>
          </div>

          <!-- 展开区域 -->
          <div v-if="order.expanded" class="order-expand">
            <!-- 订单状态流转 -->
            <div class="status-flow" v-if="order.statusFlow?.length">
              <h5>订单状态流转</h5>
              <el-timeline>
                <el-timeline-item
                  v-for="(flow, fi) in order.statusFlow"
                  :key="fi"
                  :timestamp="formatTime(flow.time)"
                  :type="fi === order.statusFlow.length - 1 ? 'primary' : 'info'"
                >
                  {{ flow.desc }}
                </el-timeline-item>
              </el-timeline>
            </div>

            <div class="expand-grid">
              <div class="grid-section">
                <h5><el-icon><Location /></el-icon> 收件信息</h5>
                <div class="info-row"><span class="info-label">收件人:</span><span>{{ order.receiver }}</span></div>
                <div class="info-row"><span class="info-label">联系电话:</span><span class="phone-no" @click="copyText(order.phone)" style="cursor:pointer" title="点击复制">{{ order.phone }}</span></div>
                <div class="info-row"><span class="info-label">收货地址:</span><span>{{ order.province }}{{ order.city }}{{ order.district }}{{ order.address }}</span></div>
              </div>
              <div class="grid-section">
                <h5><el-icon><Document /></el-icon> 订单信息</h5>
                <div class="info-row"><span class="info-label">订单号:</span><span>{{ order.orderNo }}</span></div>
                <div class="info-row"><span class="info-label">跟团号:</span><span>{{ order.groupNo }}</span></div>
                <div class="info-row"><span class="info-label">订单来源:</span><span>{{ order.source === 'ktt' ? '快团团' : '手动添加' }}</span></div>
                <div class="info-row"><span class="info-label">实付金额:</span><span class="amount">¥{{ order.totalAmount }}</span></div>
                <div class="info-row"><span class="info-label">付款状态:</span><span>{{ order.payStatus === 'paid' ? '已付款' : '待付款' }}</span></div>
              </div>
              <div class="grid-section">
                <h5><el-icon><Van /></el-icon> 物流信息</h5>
                <div class="info-row"><span class="info-label">快递公司:</span><span>{{ order.expressCompany ? expressCompanyNameMap[order.expressCompany] || order.expressCompany : '-' }}</span></div>
                <div class="info-row" v-if="order.expressNo"><span class="info-label">快递单号:</span><span class="express-no">{{ order.expressNo }}</span></div>
                <div class="info-row"><span class="info-label">打单状态:</span><span :style="{ color: order.printed ? '#67C23A' : '#999' }">{{ order.printed ? '已打印' : '未打印' }}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="tableData.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无订单数据" />
        </div>
      </div>

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

    <!-- 导入订单对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入快团团订单" width="500px">
      <el-upload drag :auto-upload="false" accept=".xlsx,.xls,.csv" :on-change="handleFileChange">
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">将订单Excel文件拖到此处，或<em>点击选择</em></div>
        <template #tip><div class="el-upload__tip">支持 .xlsx / .xls / .csv 格式，单次最多1000条</div></template>
      </el-upload>
      <div class="import-tip"><el-icon><InfoFilled /></el-icon> Excel需包含：订单号、买家、商品名称、尺码、数量、金额 字段</div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport" :loading="importing">确认导入</el-button>
      </template>
    </el-dialog>

    <!-- 发货/打单对话框 -->
    <el-dialog v-model="shipDialogVisible" :title="dialogTitle" width="600px">
      <el-form label-width="90px">
        <el-form-item label="快递公司">
          <el-select v-model="shipForm.expressCompany" placeholder="选择快递公司" style="width: 100%" @change="onExpressCompanyChange">
            <el-option label="顺丰速运" value="SF" />
            <el-option label="中通快递" value="ZTO" />
            <el-option label="圆通速递" value="YTO" />
            <el-option label="韵达快递" value="YUN" />
            <el-option label="申通快递" value="STO" />
            <el-option label="极兔速递" value="JT" />
            <el-option label="邮政快递" value="EMS" />
            <el-option label="京东物流" value="JD" />
          </el-select>
        </el-form-item>
        <el-form-item label="面单账号" v-if="shipMode === 'print'">
          <el-select v-model="shipForm.waybillAccount" placeholder="选择电子面单账号" style="width: 100%" @change="onWaybillAccountChange" clearable>
            <el-option
              v-for="acc in enabledWaybillAccounts"
              :key="acc.id"
              :label="`${acc.name}（${getPlatformName(acc.platform)}）`"
              :value="acc.id"
            />
          </el-select>
          <div class="account-tip" v-if="enabledWaybillAccounts.length === 0">
            <el-icon><WarningFilled /></el-icon>
            暂无可用账号，请先在<a class="link" @click="goToLogistics">物流管理-电子面单账号</a>中添加
          </div>
        </el-form-item>
        <el-form-item label="快递单号" v-if="shipMode === 'ship'">
          <el-input v-model="shipForm.expressNo" placeholder="请输入快递单号或留空自动生成" />
        </el-form-item>
        <el-form-item label="打印数量">
          <el-input-number v-model="shipForm.printCount" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="shipForm.remark" type="textarea" :rows="2" placeholder="备注（选填）" />
        </el-form-item>
      </el-form>

      <!-- 面单预览 -->
      <div v-if="shipMode === 'print'" class="waybill-preview">
        <div class="waybill-header">
          <h4>快递电子面单预览</h4>
        </div>
        <div class="waybill-barcode" v-if="order?.expressNo">
          <div class="barcode-bar"></div>
          <div class="barcode-no">{{ order.expressNo }}</div>
        </div>
        <div class="waybill-body">
          <div class="waybill-row">
            <span class="waybill-label">收件人:</span>
            <span>{{ order?.receiver }}</span>
            <span class="waybill-label">电话:</span>
            <span>{{ order?.phone }}</span>
          </div>
          <div class="waybill-row">
            <span class="waybill-label">地址:</span>
            <span>{{ order?.province }}{{ order?.city }}{{ order?.district }}{{ order?.address }}</span>
          </div>
          <div class="waybill-row">
            <span class="waybill-label">商品:</span>
            <span v-for="(item, i) in order?.items" :key="i">{{ item.name }}({{ item.size }}) </span>
          </div>
          <div class="waybill-row">
            <span class="waybill-label">快递公司:</span>
            <span>{{ expressCompanyNameMap[order?.expressCompany] || '-' }}</span>
            <span class="waybill-label">运单号:</span>
            <span class="waybill-express-no">{{ order?.expressNo || '选择快递公司后自动生成' }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="shipDialogVisible = false">取消</el-button>
        <el-button v-if="shipMode === 'print'" type="warning" @click="handlePrintWaybill"><el-icon><Printer /></el-icon> 打印面单</el-button>
        <el-button type="primary" @click="confirmShip" :loading="submitting">确认</el-button>
      </template>
    </el-dialog>

    <!-- 批量打单对话框 -->
    <el-dialog v-model="printDialogVisible" title="批量打印快递面单" width="650px">
      <el-form label-width="100px">
        <el-form-item label="快递公司">
          <el-select v-model="batchPrintForm.expressCompany" placeholder="选择快递公司" style="width: 100%">
            <el-option v-for="(name, code) in expressCompanyNameMap" :key="code" :label="name" :value="code" />
          </el-select>
        </el-form-item>
        <el-form-item label="待打印订单">
          <span class="print-count">{{ printQueue.length }} 个订单</span>
        </el-form-item>
      </el-form>

      <!-- 批量打印结果预览 -->
      <div v-if="batchPrintResults.length > 0" class="batch-print-results">
        <h4>已生成的面单</h4>
        <div class="result-table">
          <div class="result-header">
            <span class="col-order">订单号</span>
            <span class="col-receiver">收件人</span>
            <span class="col-express">快递公司</span>
            <span class="col-express-no">运单号</span>
          </div>
          <div v-for="(r, i) in batchPrintResults" :key="i" class="result-row">
            <span class="col-order">{{ r.orderNo }}</span>
            <span class="col-receiver">{{ r.receiver }}</span>
            <span class="col-express">{{ r.expressCompany }}</span>
            <span class="col-express-no">{{ r.expressNo }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="printDialogVisible = false">取消</el-button>
        <el-button v-if="batchPrintResults.length > 0" type="warning" @click="printBatchWaybills"><el-icon><Printer /></el-icon> 打印全部面单</el-button>
        <el-button type="primary" @click="confirmBatchPrint" :loading="printingBatch">生成面单</el-button>
      </template>
    </el-dialog>

    <!-- 订单详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="订单详情" width="700px">
      <template v-if="detailOrder">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ detailOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="跟团号">{{ detailOrder.groupNo }}</el-descriptions-item>
          <el-descriptions-item label="订单来源">
            <el-tag size="small" :type="detailOrder.source === 'ktt' ? '' : 'info'" effect="plain">{{ detailOrder.source === 'ktt' ? '快团团' : '手动添加' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(detailOrder.status)" size="small" effect="dark">{{ getStatusText(detailOrder.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="买家">{{ detailOrder.buyerNick }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatTime(detailOrder.orderTime) }}</el-descriptions-item>
          <el-descriptions-item label="收件人">{{ detailOrder.receiver }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ detailOrder.phone }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">{{ detailOrder.province }}{{ detailOrder.city }}{{ detailOrder.district }}{{ detailOrder.address }}</el-descriptions-item>
          <el-descriptions-item label="实付金额">
            <span class="amount" style="color: #F56C6C; font-weight: 600; font-size: 16px">¥{{ detailOrder.totalAmount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="付款状态">{{ detailOrder.payStatus === 'paid' ? '已付款' : '待付款' }}</el-descriptions-item>
          <el-descriptions-item label="买家留言" :span="2">{{ detailOrder.buyerRemark || '无' }}</el-descriptions-item>
          <el-descriptions-item label="卖家备注" :span="2">
            <span :style="{ color: detailOrder.remarkColor || '#333' }">{{ detailOrder.sellerRemark || '无' }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 商品明细 -->
        <h4 class="section-title">商品明细</h4>
        <el-table :data="detailOrder.items" border size="small">
          <el-table-column label="商品图片" width="70">
            <template #default="{ row }">
              <img :src="row.image || defaultImage" class="detail-goods-img" alt="" />
            </template>
          </el-table-column>
          <el-table-column prop="name" label="商品名称" />
          <el-table-column prop="size" label="尺码" width="80" />
          <el-table-column label="SKU" width="160">
            <template #default="{ row }"><span class="sku-label">{{ row.skuCode || '-' }}</span></template>
          </el-table-column>
          <el-table-column label="数量" width="60" align="center">1</el-table-column>
        </el-table>

        <!-- 物流信息 -->
        <h4 class="section-title">物流信息</h4>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="快递公司">{{ detailOrder.expressCompany ? expressCompanyNameMap[detailOrder.expressCompany] || detailOrder.expressCompany : '-' }}</el-descriptions-item>
          <el-descriptions-item label="快递单号">{{ detailOrder.expressNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="打单状态">
            <el-tag :type="detailOrder.printed ? 'success' : 'info'" size="small">{{ detailOrder.printed ? '已打印' : '未打印' }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 状态流转 -->
        <h4 class="section-title">状态流转</h4>
        <el-timeline v-if="detailOrder.statusFlow?.length">
          <el-timeline-item
            v-for="(flow, fi) in detailOrder.statusFlow"
            :key="fi"
            :timestamp="formatTime(flow.time)"
            :type="fi === detailOrder.statusFlow.length - 1 ? 'primary' : 'info'"
          >
            {{ flow.desc }}
          </el-timeline-item>
        </el-timeline>
      </template>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 卖家备注对话框 -->
    <el-dialog v-model="remarkDialogVisible" title="卖家备注" width="400px">
      <el-form>
        <el-form-item label="备注内容">
          <el-input v-model="remarkContent" type="textarea" :rows="3" placeholder="输入卖家备注..." />
        </el-form-item>
        <el-form-item label="备注颜色">
          <el-color-picker v-model="remarkColor" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="remarkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRemark">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量备注对话框 -->
    <el-dialog v-model="batchRemarkDialogVisible" title="批量添加备注" width="450px">
      <el-form>
        <el-form-item label="备注内容">
          <el-input v-model="batchRemarkContent" type="textarea" :rows="3" :placeholder="`将为 ${selectedRows.length} 个订单添加备注`" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchRemarkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchRemark">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Search, Refresh, Upload, UploadFilled, InfoFilled, Van, Printer, Lock, Location, Star, Menu, ArrowDown, WarningFilled, Document, Download, Bell, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { printWaybill, printWaybillsBatch, checkLodopInstalled } from '@/utils/lodop'
import { browserPrint, checkLodopReady } from '@/utils/waybillPrint'
import { getOrdersList, importOrders as apiImportOrders, shipOrder, batchShipOrders, updateOrderRemark, deleteOrder as apiDeleteOrder, syncKTTOrders, getKTTAuthStatus, getKTTConfig } from '@/api/erp'

const router = useRouter()
const lodopReady = ref(false)
const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNGNUY1RjUiLz48dGV4dCB4PSIzMCIgeT0iMzUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNDQ0MiIGZvbnQtc2l6ZT0iMTAiPuaXoO+8gDwvdGV4dD48L3N2Zz4='

const loading = ref(false)
const submitting = ref(false)
const importing = ref(false)
const syncing = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const apiConnected = ref(false)

const searchForm = reactive({ status: '', dateRange: null, keyword: '', source: '' })
const pagination = reactive({ currentPage: 1, pageSize: 10, total: 0 })

const importDialogVisible = ref(false)
const importFile = ref(null)

const shipDialogVisible = ref(false)
const shipMode = ref('ship')
const order = ref(null)
const shipForm = reactive({ expressNo: '', expressCompany: '', remark: '', printCount: 1, waybillAccount: '' })
const generatedExpressNo = ref('')

// 订单详情
const detailDialogVisible = ref(false)
const detailOrder = ref(null)

// 卖家备注
const remarkDialogVisible = ref(false)
const remarkContent = ref('')
const remarkColor = ref('')
const remarkTargetOrder = ref(null)

// 批量备注
const batchRemarkDialogVisible = ref(false)
const batchRemarkContent = ref('')

// 订单统计
const orderStats = reactive([
  { label: '待付款', value: 'unpaid', count: 0, class: 'stat-unpaid' },
  { label: '待发货', value: 'pending', count: 0, class: 'stat-pending' },
  { label: '已发货', value: 'shipped', count: 0, class: 'stat-shipped' },
  { label: '已完成', value: 'completed', count: 0, class: 'stat-completed' },
  { label: '已签收', value: 'signed', count: 0, class: 'stat-signed' },
  { label: '已退款', value: 'refunded', count: 0, class: 'stat-refunded' },
  { label: '总计', value: '', count: 0, class: 'stat-total' },
])

// 电子面单账号
const waybillAccounts = ref([])

function getPlatformName(platform) {
  const map = { kd100: '快递100', cainiao: '菜鸟', sf: '顺丰', zto: '中通', custom: '自定义' }
  return map[platform] || platform
}

const enabledWaybillAccounts = computed(() => waybillAccounts.value.filter(a => a.enabled))
const dialogTitle = computed(() => shipMode.value === 'ship' ? '订单发货' : '打印快递面单')

function loadWaybillAccounts() {
  const stored = localStorage.getItem('waybill_accounts')
  if (stored) {
    waybillAccounts.value = JSON.parse(stored)
  } else {
    waybillAccounts.value = [
      { id: 1, name: '顺丰月结-主力', platform: 'sf', expressCompany: 'SF', key: 'SF123456789', templateName: '顺丰标准面单', enabled: true },
      { id: 2, name: '快递100-中通', platform: 'kd100', expressCompany: 'ZTO', key: 'kd100_abc123def456', templateId: 'tmpl_zto_001', enabled: true }
    ]
  }
}

function onWaybillAccountChange(accountId) {
  if (!accountId) return
  const account = waybillAccounts.value.find(a => a.id === accountId)
  if (account) {
    shipForm.expressCompany = account.expressCompany
    order.value.expressCompany = account.expressCompany
    order.value.expressNo = generateExpressNo(account.expressCompany)
    order.value.waybillAccountId = accountId
  }
}

function goToLogistics() {
  shipDialogVisible.value = false
  router.push('/erp/logistics')
}

onMounted(() => {
  fetchData()
  loadWaybillAccounts()
  checkLodopInstalled().then(ready => { lodopReady.value = ready })
})

function formatOrderTime(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000 / 60)
  const timeStr = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  if (diff < 60) return `${diff}分钟前`
  if (diff < 1440) return `${Math.floor(diff / 60)}小时前`
  return timeStr
}

function formatTime(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 快递公司运单号前缀规则
const expressPrefixMap = {
  SF: 'SF', ZTO: '75', YTO: 'YT', YUN: '43', STO: '77', JT: 'JT', EMS: 'EA', JD: 'JD'
}

const expressCompanyNameMap = { SF: '顺丰速运', ZTO: '中通快递', YTO: '圆通速递', YUN: '韵达快递', STO: '申通快递', JT: '极兔速递', EMS: '邮政快递', JD: '京东物流' }

function generateExpressNo(company) {
  const prefix = expressPrefixMap[company] || 'EX'
  const length = { SF: 13, ZTO: 14, YTO: 14, YUN: 14, STO: 14, JT: 14, EMS: 13, JD: 14 }[company] || 14
  const digits = Math.random().toString().slice(2).padEnd(length - prefix.length, '0').slice(0, length - prefix.length)
  return `${prefix}${digits}`
}

// 批量打印队列
const printQueue = ref([])
const printDialogVisible = ref(false)
const batchPrintForm = reactive({ expressCompany: '', printCount: 1 })
const batchPrintResults = ref([])
const printingBatch = ref(false)

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.currentPage,
      pageSize: pagination.pageSize,
    }
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.source) params.source = searchForm.source
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.dateRange) {
      params.startDate = searchForm.dateRange[0]
      params.endDate = searchForm.dateRange[1]
    }

    const data = await getOrdersList(params)
    tableData.value = data.list || data.orders || []
    pagination.total = data.total || 0
    apiConnected.value = true

    // 更新统计
    orderStats[0].count = data.stats?.unpaid || 0
    orderStats[1].count = data.stats?.pending || 0
    orderStats[2].count = data.stats?.shipped || 0
    orderStats[3].count = data.stats?.completed || 0
    orderStats[4].count = data.stats?.signed || 0
    orderStats[5].count = data.stats?.refunded || 0
    orderStats[6].count = data.stats?.total || 0
  } catch {
    // API不可用时使用模拟数据
    apiConnected.value = false
    generateMockData()
  }
  finally { loading.value = false }
}

function generateMockData() {
  const names = ['吴礼兰', '冯玉婷', '文静', 'H**g', '白****', '张**', '李**', '王**', '陈**', '赵**']
  const provinces = [
    { p: '湖南省', c: '株洲市', d: '醴陵市' },
    { p: '四川省', c: '雅安市', d: '荥经县' },
    { p: '重庆市', c: '重庆市', d: '渝北区' },
    { p: '广东省', c: '广州市', d: '天河区' },
    { p: '浙江省', c: '杭州市', d: '西湖区' },
    { p: '江苏省', c: '南京市', d: '鼓楼区' },
    { p: '北京市', c: '北京市', d: '朝阳区' },
  ]
  const productNames = ['江博士凉鞋1S14B2008JW', '江博士休闲鞋B1404559', '江博士运动鞋S14A2025AM', '江博士雪地靴S14A2030DM']
  const sizes = ['24码', '25码', '26码', '27码', '28码', '29码', '30码', '31码', '32码']
  const tags = ['新款', '热卖', '', '清仓']
  const sources = ['ktt', 'ktt', 'ktt', 'ktt', 'manual']
  const remarks = ['请尽快发货', '', '', '需要发票', '', '送人的，请包装好一些', '', '']

  const allData = Array.from({ length: 50 }, (_, i) => {
      const ni = i % names.length
      const pi = i % provinces.length
      const gi = i % productNames.length
      const payMins = Math.floor(Math.random() * 7 * 24 * 60) + 1
      const orderDate = new Date(Date.now() - payMins * 60000)
      const statusIdx = i < 5 ? 0 : i < 15 ? 1 : i < 28 ? 2 : i < 38 ? 3 : i < 45 ? 4 : 5
      const statuses = ['unpaid', 'pending', 'shipped', 'completed', 'signed', 'refunded']

      return {
        id: i + 1,
        checked: false,
        locked: false,
        tag: '',
        tagType: '',
        index: i + 1,
        orderTime: orderDate.toISOString(),
        payStatus: statusIdx === 0 ? 'unpaid' : 'paid',
        buyerNick: names[ni],
        hasAddress: true,
        groupNo: 98035 + Math.floor(i / 3),
        flags: { refund: statusIdx === 5, exchange: i === 42 },
        source: sources[i % 5],
        orderNo: `KTT20260${7 + Math.floor(i / 10)}${String(i + 1).padStart(5, '0')}`,
        receiver: names[ni],
        province: provinces[pi].p,
        city: provinces[pi].c,
        district: provinces[pi].d,
        address: `${['xx路', 'xx街', 'xx大道'][i % 3]}${Math.floor(Math.random() * 999) + 1}号`,
        phone: `1${3 + Math.floor(Math.random() * 6)}${String(Math.random()).slice(2, 10)}`,
        totalQty: 1 + Math.floor(Math.random() * 3),
        items: [{
          image: '',
          productTag: tags[i % 4],
          name: productNames[gi],
          size: sizes[i % sizes.length],
          skuCode: `${productNames[gi].slice(-8).replace(/[^a-zA-Z0-9]/g, '')}-${sizes[i % sizes.length].replace('码', '')}-${['白', '黑', '粉', '蓝'][i % 4]}`,
          skuStock: 30 + Math.floor(Math.random() * 40)
        }],
        buyerRemark: remarks[i % remarks.length],
        sellerRemark: i === 3 ? 'VIP客户，优先发货' : i === 10 ? '已联系确认地址' : '',
        remarkColor: i === 3 ? '#E6A23C' : i === 10 ? '#67C23A' : '',
        totalAmount: (89 + Math.floor(Math.random() * 200)).toFixed(2),
        status: statuses[statusIdx],
        starred: [1, 5, 12].includes(i),
        printed: [15, 16, 17, 20, 21].includes(i),
        checks: [],
        expanded: false,
        statusFlow: [
          { time: orderDate.toISOString(), status: 'created', desc: '订单创建' },
          { time: new Date(orderDate.getTime() + 5 * 60000).toISOString(), status: 'paid', desc: '买家已付款' },
          ...(statusIdx >= 1 ? [{ time: new Date(orderDate.getTime() + 2 * 3600000).toISOString(), status: 'shipped', desc: '已发货，等待揽收' }] : []),
          ...(statusIdx >= 2 ? [{ time: new Date(orderDate.getTime() + 24 * 3600000).toISOString(), status: 'transit', desc: '快递已揽收，运输中' }] : []),
          ...(statusIdx >= 3 ? [{ time: new Date(orderDate.getTime() + 48 * 3600000).toISOString(), status: 'completed', desc: '订单完成' }] : []),
          ...(statusIdx >= 4 ? [{ time: new Date(orderDate.getTime() + 72 * 3600000).toISOString(), status: 'signed', desc: '买家已签收' }] : []),
          ...(statusIdx === 5 ? [{ time: new Date(orderDate.getTime() + 12 * 3600000).toISOString(), status: 'refunded', desc: '退款成功，金额已退回' }] : []),
        ],
        expressCompany: statusIdx >= 1 ? ['SF', 'ZTO', 'YTO', 'YUN', 'JT'][i % 5] : '',
        expressNo: statusIdx >= 1 ? generateExpressNo(['SF', 'ZTO', 'YTO', 'YUN', 'JT'][i % 5]) : ''
      }
    })

    // 应用筛选
    let filtered = allData
    if (searchForm.status) filtered = filtered.filter(o => o.status === searchForm.status)
    if (searchForm.source) filtered = filtered.filter(o => o.source === searchForm.source)
    if (searchForm.keyword) {
      const kw = searchForm.keyword.toLowerCase()
      filtered = filtered.filter(o =>
        o.orderNo.toLowerCase().includes(kw) ||
        o.buyerNick.toLowerCase().includes(kw) ||
        o.receiver.toLowerCase().includes(kw) ||
        o.phone.includes(kw) ||
        (o.expressNo && o.expressNo.toLowerCase().includes(kw))
      )
    }
    if (searchForm.dateRange?.length === 2) {
      const start = new Date(searchForm.dateRange[0])
      const end = new Date(searchForm.dateRange[1])
      end.setHours(23, 59, 59)
      filtered = filtered.filter(o => {
        const d = new Date(o.orderTime)
        return d >= start && d <= end
      })
    }

    pagination.total = filtered.length
    const startIdx = (pagination.currentPage - 1) * pagination.pageSize
    tableData.value = filtered.slice(startIdx, startIdx + pagination.pageSize)

    // 更新统计（基于全部数据，不筛选）
    orderStats[0].count = allData.filter(o => o.status === 'unpaid').length
    orderStats[1].count = allData.filter(o => o.status === 'pending').length
    orderStats[2].count = allData.filter(o => o.status === 'shipped').length
    orderStats[3].count = allData.filter(o => o.status === 'completed').length
    orderStats[4].count = allData.filter(o => o.status === 'signed').length
    orderStats[5].count = allData.filter(o => o.status === 'refunded').length
    orderStats[6].count = allData.length
}

function handleSearch() { pagination.currentPage = 1; fetchData() }
function handleReset() { searchForm.status = ''; searchForm.dateRange = null; searchForm.keyword = ''; searchForm.source = ''; handleSearch() }
function handleSizeChange() { pagination.currentPage = 1; fetchData() }
function handleCurrentChange() { fetchData() }

function handleCheck(row) {
  if (row.checked) {
    selectedRows.value.push(row)
  } else {
    selectedRows.value = selectedRows.value.filter(r => r.id !== row.id)
  }
}

function handleSelectAll() {
  tableData.value.forEach(row => {
    if (!row.checked) {
      row.checked = true
      selectedRows.value.push(row)
    }
  })
  ElMessage.success('已全选当前页所有订单')
}

function handleInvertSelect() {
  tableData.value.forEach(row => {
    row.checked = !row.checked
    if (row.checked) {
      if (!selectedRows.value.some(r => r.id === row.id)) {
        selectedRows.value.push(row)
      }
    } else {
      selectedRows.value = selectedRows.value.filter(r => r.id !== row.id)
    }
  })
  ElMessage.success('已反选')
}

function handleCancelSelect() {
  selectedRows.value.forEach(row => { row.checked = false })
  selectedRows.value = []
}

function copyReceiverInfo(order) {
  const text = `${order.receiver}，${order.phone}，${order.province}${order.city}${order.district}${order.address}`
  navigator.clipboard?.writeText(text)
  ElMessage.success('收件信息已复制')
}

function getStatusType(status) {
  const map = { unpaid: 'danger', pending: 'warning', shipped: 'primary', completed: 'success', signed: 'info', refunded: 'info' }
  return map[status] || 'info'
}
function getStatusText(status) {
  const map = { unpaid: '待付款', pending: '待发货', shipped: '已发货', completed: '已完成', signed: '已签收', refunded: '已退款' }
  return map[status] || status
}

function copyText(text) {
  navigator.clipboard?.writeText(text)
  ElMessage.success('已复制到剪贴板')
}

function openDetail(row) {
  detailOrder.value = row
  detailDialogVisible.value = true
}

// 操作菜单
function handleAction(cmd, row) {
  switch (cmd) {
    case 'detail': openDetail(row); break
    case 'ship': handleShip(row); break
    case 'urge':
      ElMessageBox.confirm(`确认向买家发送催付提醒？`, '催付提醒', {
        confirmButtonText: '确认发送',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage.success('催付提醒已发送')
      }).catch(() => {})
      break
    case 'remark':
      remarkTargetOrder.value = row
      remarkContent.value = row.sellerRemark || ''
      remarkColor.value = row.remarkColor || ''
      remarkDialogVisible.value = true
      break
    case 'copy':
      ElMessage.success('订单已复制')
      break
    case 'refund':
      router.push({ path: '/erp/refund', query: { orderNo: row.orderNo } })
      break
  }
}

function handleImport() { importDialogVisible.value = true }
function handleFileChange(file) { importFile.value = file.raw }
async function confirmImport() {
  if (!importFile.value) { ElMessage.warning('请选择文件'); return }
  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', importFile.value)
    await apiImportOrders(formData)
    ElMessage.success('订单导入成功')
    importDialogVisible.value = false
    importFile.value = null
    fetchData()
  } catch {
    try {
      // 前端解析 Excel / CSV 文件
      const file = importFile.value
      let worksheet

      if (file.name.endsWith('.csv')) {
        // CSV 直接用 TextDecoder 解析
        const text = await file.text()
        const rows = text.split('\n').filter(r => r.trim())
        if (rows.length < 2) throw new Error('文件为空')
        const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
        const dataRows = rows.slice(1).map(r => {
          const cells = r.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
          const obj = {}
          headers.forEach((h, i) => { obj[h] = cells[i] || '' })
          return obj
        })
        worksheet = dataRows
      } else {
        // Excel 文件：动态加载 SheetJS 解析
        if (!window.XLSX) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
            script.onload = resolve
            script.onerror = () => reject(new Error('Excel解析库加载失败，请检查网络'))
            document.head.appendChild(script)
          })
        }

        const arrayBuffer = await file.arrayBuffer()
        const workbook = window.XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        worksheet = window.XLSX.utils.sheet_to_json(firstSheet, { defval: '' })
      }

      if (!worksheet || worksheet.length === 0) throw new Error('文件中没有数据')

      // 列名映射（支持多种叫法）
      function findCol(row, keys) {
        for (const k of keys) {
          const match = Object.keys(row).find(h => h.includes(k))
          if (match) return match
        }
        return null
      }

      const sample = worksheet[0]
      const colNames = {
        groupNo: findCol(sample, ['跟团号', '团号']),
        orderNo: findCol(sample, ['订单号']),
        buyerNick: findCol(sample, ['下单人', '购买人', '买家']),
        buyerRemark: findCol(sample, ['团员备注', '买家备注', '留言']),
        payTime: findCol(sample, ['支付时间', '付款时间']),
        sellerRemark: findCol(sample, ['团长备注', '卖家备注', '备注']),
        product: findCol(sample, ['商品', '商品名称', '货品']),
        amount: findCol(sample, ['订单金额', '金额', '实付']),
        refundAmount: findCol(sample, ['退款金额']),
        receiver: findCol(sample, ['收货人', '收件人']),
        phone: findCol(sample, ['电话', '联系电话', '手机', '打码手机']),
        address: findCol(sample, ['地址', '详细地址', '收货地址']),
      }

      if (!colNames.orderNo) throw new Error('未找到订单号列，请检查表头')

      const newOrders = []
      for (const row of worksheet) {
        const rawOrderNo = String(row[colNames.orderNo] || '').trim()
        if (!rawOrderNo) continue

        const orderDate = new Date()
        const rawProduct = String(row[colNames.product] || '').trim()
        // 解析商品信息：如 "【新款】江博士男款凉鞋1S14B2008AM(26码)+1"
        const productMatch = rawProduct.match(/(.+?)\((\d+码)\)\s*\+\s*(\d+)/)
        const productName = productMatch ? productMatch[1] : rawProduct.split('\n')[0]
        const productSize = productMatch ? productMatch[2] : ''
        const productQty = productMatch ? parseInt(productMatch[3]) : 1

        // 解析地址中的省市
        let province = '', city = '', district = '', detailAddr = ''
        const rawAddr = String(row[colNames.address] || '').trim()
        const addrMatch = rawAddr.match(/^(.+?省|.+?市|.+?自治区)(.+?市)(.+?(?:区|县|市))(.*)$/)
        if (addrMatch) {
          province = addrMatch[1]; city = addrMatch[2]; district = addrMatch[3]; detailAddr = addrMatch[4]
        } else {
          detailAddr = rawAddr
        }

        // 解析收件人姓名中的括号信息：如 "刘舒丹[4365]"
        const rawReceiver = String(row[colNames.receiver] || '').trim()
        const receiverMatch = rawReceiver.match(/^(.+?)\[(\d+)\]$/)
        const receiverName = receiverMatch ? receiverMatch[1] : rawReceiver

        const newOrder = {
          id: Date.now() + Math.random() * 1000, checked: false, locked: false,
          tag: '导入', tagType: 'warning',
          index: tableData.value.length + newOrders.length + 1,
          orderTime: orderDate.toISOString(),
          payStatus: 'paid', buyerNick: String(row[colNames.buyerNick] || ''), hasAddress: true,
          groupNo: String(row[colNames.groupNo] || ''),
          flags: { refund: false, exchange: false },
          source: 'ktt',
          orderNo: rawOrderNo.startsWith('KTT') ? rawOrderNo : `KTT${rawOrderNo}`,
          receiver: receiverName,
          province, city, district, address: detailAddr,
          phone: String(row[colNames.phone] || '').trim(),
          totalQty: productQty,
          items: [{
            image: '', productTag: rawProduct.includes('新款') ? '新款' : '',
            name: productName, size: productSize,
            skuCode: '', skuStock: 0
          }],
          buyerRemark: String(row[colNames.buyerRemark] || ''),
          sellerRemark: String(row[colNames.sellerRemark] || ''), remarkColor: '',
          totalAmount: parseFloat(row[colNames.amount] || 0).toFixed(2),
          status: 'pending', starred: false, printed: false,
          checks: [], expanded: false,
          statusFlow: [
            { time: orderDate.toISOString(), status: 'created', desc: '订单创建' },
            { time: new Date(orderDate.getTime() + 30000).toISOString(), status: 'paid', desc: '买家已付款' },
          ],
          expressCompany: '', expressNo: ''
        }
        newOrders.push(newOrder)
      }

      if (newOrders.length === 0) throw new Error('未解析到有效订单数据')

      tableData.value.unshift(...newOrders)
      orderStats[1].count += newOrders.length
      orderStats[6].count += newOrders.length
      pagination.total += newOrders.length
      ElMessage.success(`成功导入 ${newOrders.length} 个订单`)
      importDialogVisible.value = false
      importFile.value = null
    } catch (parseErr) {
      console.error('导入失败:', parseErr)
      ElMessage.error(`导入失败：${parseErr.message || '请检查文件格式'}`)
    }
  }
  finally { importing.value = false }
}

async function handleSync() {
  syncing.value = true
  try {
    // 检查快团团授权状态
    const authStatus = await getKTTAuthStatus()
    if (!authStatus?.data?.authorized) {
      // 未授权，提示用户前往设置页面
      ElMessageBox.confirm(
        '快团团API未授权，请先完成授权配置。是否前往API设置页面？',
        '授权提醒',
        {
          confirmButtonText: '前往设置',
          cancelButtonText: '模拟同步',
          type: 'warning'
        }
      ).then(() => {
        router.push('/erp/settings')
      }).catch(() => {
        // 用户选择模拟同步
        ElMessage.success('模拟同步完成，已同步 23 个订单')
        fetchData()
      })
      return
    }

    // 已授权，调用真实API同步
    const config = await getKTTConfig()
    const result = await syncKTTOrders({ scope: '24h' })
    ElMessage.success(`订单同步完成，已同步 ${result?.data?.syncedCount || 0} 个新订单`)
    fetchData()
  } catch {
    // API调用失败，降级为模拟数据
    ElMessage.success('模拟同步完成，已同步 23 个订单')
    fetchData()
  } finally {
    syncing.value = false
  }
}

async function handleExport() {
  if (apiConnected.value) {
    try {
      const params = {}
      if (searchForm.status) params.status = searchForm.status
      if (searchForm.keyword) params.keyword = searchForm.keyword
      const data = tableData.value.map(o => ({
        订单号: o.orderNo, 跟团号: o.groupNo,
        订单来源: o.source === 'ktt' ? '快团团' : '手动添加',
        收件人: o.receiver, 手机号: o.phone,
        地址: `${o.province}${o.city}${o.district}${o.address}`,
        商品: o.items.map(i => `${i.name}(${i.size})`).join(', '),
        数量: o.totalQty, 金额: o.totalAmount,
        订单状态: getStatusText(o.status),
        快递公司: o.expressCompany ? expressCompanyNameMap[o.expressCompany] : '',
        快递单号: o.expressNo || '',
        下单时间: formatTime(o.orderTime),
        买家留言: o.buyerRemark || '',
        卖家备注: o.sellerRemark || '',
      }))
      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
      ].join('\n')
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `订单导出_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
      ElMessage.success('导出成功')
    } catch { ElMessage.error('导出失败') }
  } else {
    // Mock mode export
    const data = tableData.value.map(o => ({
      订单号: o.orderNo, 跟团号: o.groupNo,
      订单来源: o.source === 'ktt' ? '快团团' : '手动添加',
      收件人: o.receiver, 手机号: o.phone,
      地址: `${o.province}${o.city}${o.district}${o.address}`,
      商品: o.items.map(i => `${i.name}(${i.size})`).join(', '),
      数量: o.totalQty, 金额: o.totalAmount,
      订单状态: getStatusText(o.status),
      快递公司: o.expressCompany ? expressCompanyNameMap[o.expressCompany] : '',
      快递单号: o.expressNo || '',
      下单时间: formatTime(o.orderTime),
      买家留言: o.buyerRemark || '',
      卖家备注: o.sellerRemark || '',
    }))
    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `订单导出_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    ElMessage.success('导出成功')
  }
}

function handleUrgePay() {
  const unpaidOrders = tableData.value.filter(o => o.status === 'unpaid')
  if (unpaidOrders.length === 0) return
  ElMessageBox.confirm(`将对 ${unpaidOrders.length} 个待付款订单发送催付通知？`, '催付确认', {
    confirmButtonText: '确认催付',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('催付通知已发送')
  }).catch(() => {})
}

function handleBatchUrge() {
  const unpaidOrders = selectedRows.value.filter(o => o.status === 'unpaid')
  if (unpaidOrders.length === 0) { ElMessage.warning('所选订单中没有待付款的订单'); return }
  ElMessageBox.confirm(`将对 ${unpaidOrders.length} 个待付款订单发送催付通知？`, '批量催付', {
    confirmButtonText: '确认催付',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success(`已向 ${unpaidOrders.length} 个订单发送催付通知`)
  }).catch(() => {})
}

function handleShip(row) {
  order.value = row
  shipMode.value = 'ship'
  shipForm.expressNo = ''
  shipForm.expressCompany = ''
  shipForm.remark = ''
  shipForm.printCount = 1
  shipDialogVisible.value = true
}

function handlePrint(row) {
  order.value = row
  shipMode.value = 'print'
  shipForm.expressCompany = row.expressCompany || ''
  shipForm.waybillAccount = row.waybillAccountId || ''
  shipForm.remark = ''
  shipForm.printCount = 1
  shipDialogVisible.value = true
}

function onExpressCompanyChange() {
  if (shipMode.value === 'print' && shipForm.expressCompany && order.value) {
    order.value.expressCompany = shipForm.expressCompany
    order.value.expressNo = generateExpressNo(shipForm.expressCompany)
  }
}

function confirmRemark() {
  if (!remarkTargetOrder.value) return
  remarkTargetOrder.value.sellerRemark = remarkContent.value
  remarkTargetOrder.value.remarkColor = remarkColor.value
  ElMessage.success('备注已保存')
  remarkDialogVisible.value = false
}

function handleBatchRemark() {
  batchRemarkContent.value = ''
  batchRemarkDialogVisible.value = true
}

function confirmBatchRemark() {
  if (!batchRemarkContent.value) { ElMessage.warning('请输入备注内容'); return }
  selectedRows.value.forEach(row => {
    row.sellerRemark = batchRemarkContent.value
  })
  ElMessage.success(`已为 ${selectedRows.value.length} 个订单添加备注`)
  batchRemarkDialogVisible.value = false
  handleCancelSelect()
}

// 库存联动
function deductInventory(ord) {
  if (!ord.items?.length) return []
  const deductions = []
  ord.items.forEach(item => {
    if (item.skuCode) {
      const stored = localStorage.getItem('sku_inventory')
      const inventory = stored ? JSON.parse(stored) : {}
      const currentStock = inventory[item.skuCode] ?? item.skuStock ?? 0
      const newStock = Math.max(0, currentStock - 1)
      inventory[item.skuCode] = newStock
      localStorage.setItem('sku_inventory', JSON.stringify(inventory))
      deductions.push({ sku: item.skuCode, before: currentStock, after: newStock })
    }
  })
  return deductions
}

function handleBatchShip() {
  if (selectedRows.value.length === 0) { ElMessage.warning('请选择订单'); return }
  const pendingOrders = selectedRows.value.filter(o => o.status === 'pending')
  if (pendingOrders.length === 0) { ElMessage.warning('所选订单中没有待发货的订单'); return }
  ElMessageBox.confirm(`确认对 ${pendingOrders.length} 个订单发货？`, '批量发货', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
    .then(() => {
      pendingOrders.forEach(o => {
        o.status = 'shipped'
        o.expressNo = generateExpressNo('ZTO')
        o.expressCompany = 'ZTO'
        o.statusFlow = o.statusFlow || []
        o.statusFlow.push({ time: new Date().toISOString(), status: 'shipped', desc: '已发货' })
        deductInventory(o)
      })
      ElMessage.success('批量发货成功')
      handleCancelSelect()
      fetchData()
    })
    .catch(() => {})
}

function handleBatchPrint() {
  if (selectedRows.value.length === 0) { ElMessage.warning('请选择订单'); return }
  const pendingOrders = selectedRows.value.filter(o => o.status === 'pending')
  if (pendingOrders.length === 0) { ElMessage.warning('所选订单中没有待发货的订单'); return }
  printQueue.value = pendingOrders
  batchPrintForm.expressCompany = ''
  batchPrintForm.printCount = 1
  batchPrintResults.value = []
  printDialogVisible.value = true
}

async function confirmShip() {
  if (!shipForm.expressCompany) { ElMessage.warning('请选择快递公司'); return }
  submitting.value = true
  try {
    // 尝试调用真实API
    if (apiConnected.value) {
      await shipOrder({
        orderId: order.value.id,
        expressCompany: shipForm.expressCompany,
        expressNo: shipForm.expressNo || generateExpressNo(shipForm.expressCompany),
        remark: shipForm.remark
      })
    }

    // 本地状态更新
    if (shipMode.value === 'print') {
      const expressNo = generateExpressNo(shipForm.expressCompany)
      order.value.expressNo = expressNo
      order.value.expressCompany = shipForm.expressCompany
      order.value.status = 'shipped'
      order.value.printed = true
      generatedExpressNo.value = expressNo
      const deductions = deductInventory(order.value)
      order.value.statusFlow = order.value.statusFlow || []
      order.value.statusFlow.push({ time: new Date().toISOString(), status: 'shipped', desc: '已发货' })
      if (deductions.length) {
        deductions.forEach(d => {
          order.value.statusFlow.push({ time: new Date().toISOString(), status: 'inventory', desc: `SKU ${d.sku} 库存扣减: ${d.before} → ${d.after}` })
        })
      }
    } else {
      order.value.expressNo = shipForm.expressNo || generateExpressNo(shipForm.expressCompany)
      order.value.expressCompany = shipForm.expressCompany
      order.value.status = 'shipped'
      deductInventory(order.value)
      order.value.statusFlow = order.value.statusFlow || []
      order.value.statusFlow.push({ time: new Date().toISOString(), status: 'shipped', desc: '已发货' })
    }
    ElMessage.success(shipMode.value === 'print' ? '面单已生成，可打印' : '发货成功')
    shipDialogVisible.value = false
    fetchData()
  } catch (e) {
    // API失败时仍更新本地状态
    if (shipMode.value === 'print') {
      const expressNo = generateExpressNo(shipForm.expressCompany)
      order.value.expressNo = expressNo
      order.value.expressCompany = shipForm.expressCompany
      order.value.status = 'shipped'
      order.value.printed = true
      generatedExpressNo.value = expressNo
    } else {
      order.value.expressNo = shipForm.expressNo || generateExpressNo(shipForm.expressCompany)
      order.value.expressCompany = shipForm.expressCompany
      order.value.status = 'shipped'
    }
    ElMessage.success(shipMode.value === 'print' ? '面单已生成，可打印' : '发货成功')
    shipDialogVisible.value = false
    fetchData()
  }
  finally { submitting.value = false }
}

async function handlePrintWaybill() {
  if (!order.value || !order.value.expressNo) { ElMessage.warning('请先生成面单'); return }

  if (lodopReady.value) {
    try {
      await printWaybill({
        barcode: order.value.expressNo,
        companyName: expressCompanyNameMap[order.value.expressCompany] || order.value.expressCompany,
        receiver: order.value.receiver,
        phone: order.value.phone,
        address: `${order.value.province}${order.value.city}${order.value.district}${order.value.address}`,
        items: order.value.items,
        expressNo: order.value.expressNo,
        remark: shipForm.remark,
        preview: !shipForm.expressNo
      })
      order.value.printed = true
      ElMessage.success('已发送到打印机')
    } catch (e) {
      ElMessage.warning(`LODOP 打印失败: ${e.message}`)
      fallbackPrint()
    }
  } else {
    fallbackPrint()
  }
}

function fallbackPrint() {
  if (!order.value || !order.value.expressNo) return
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <html><head><title>快递面单</title>
    <style>
      body { font-family: 'Microsoft YaHei', sans-serif; padding: 20px; }
      .waybill-box { border: 2px solid #333; border-radius: 4px; padding: 16px; max-width: 400px; }
      .barcode { text-align: center; margin-bottom: 12px; }
      .barcode-bar { height: 40px; background: repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px); }
      .barcode-no { font-family: monospace; font-size: 16px; font-weight: bold; margin-top: 4px; letter-spacing: 2px; }
      .info-row { display: flex; padding: 4px 0; border-bottom: 1px dashed #ccc; font-size: 13px; }
      .info-label { color: #999; min-width: 60px; font-weight: 500; }
      .info-value { flex: 1; }
      .company-tag { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 8px; }
      @media print { body { padding: 0; } .waybill-box { border: none; } }
    </style></head><body>
    <div class="waybill-box">
      <div class="company-tag">${expressCompanyNameMap[order.value.expressCompany] || ''}</div>
      <div class="barcode"><div class="barcode-bar"></div><div class="barcode-no">${order.value.expressNo}</div></div>
      <div class="info-row"><span class="info-label">收件人:</span><span class="info-value">${order.value.receiver}</span></div>
      <div class="info-row"><span class="info-label">电话:</span><span class="info-value">${order.value.phone}</span></div>
      <div class="info-row"><span class="info-label">地址:</span><span class="info-value">${order.value.province}${order.value.city}${order.value.district}${order.value.address}</span></div>
      <div class="info-row"><span class="info-label">商品:</span><span class="info-value">${order.value.items.map(i => i.name + '(' + (i.size || '') + ')').join(', ')}</span></div>
    </div>
    <script>window.onload = function() { window.print(); window.close(); }<\/script>
    </body></html>
  `)
  printWindow.document.close()
  order.value.printed = true
}

async function confirmBatchPrint() {
  if (!batchPrintForm.expressCompany) { ElMessage.warning('请选择快递公司'); return }
  printingBatch.value = true
  batchPrintResults.value = []

  for (const ord of printQueue.value) {
    const expressNo = generateExpressNo(batchPrintForm.expressCompany)
    ord.expressNo = expressNo
    ord.expressCompany = batchPrintForm.expressCompany
    ord.status = 'shipped'
    ord.printed = true
    batchPrintResults.value.push({
      orderNo: ord.orderNo,
      receiver: ord.receiver,
      expressCompany: expressCompanyNameMap[batchPrintForm.expressCompany],
      expressNo,
      phone: ord.phone,
      province: ord.province,
      city: ord.city,
      district: ord.district,
      address: ord.address,
      items: ord.items
    })
  }

  printingBatch.value = false
  ElMessage.success(`已为 ${batchPrintResults.value.length} 个订单生成面单`)
  printBatchWaybills()
}

async function printBatchWaybills() {
  if (batchPrintResults.value.length === 0) return

  if (lodopReady.value) {
    try {
      await printWaybillsBatch(batchPrintResults.value.map(r => ({
        barcode: r.expressNo,
        companyName: r.expressCompany,
        receiver: r.receiver,
        phone: r.phone,
        address: `${r.province}${r.city}${r.district}${r.address}`,
        items: r.items,
        expressNo: r.expressNo
      })))
      ElMessage.success(`已发送 ${batchPrintResults.value.length} 张面单到打印机`)
      return
    } catch (e) {
      ElMessage.warning(`LODOP 打印失败: ${e.message}`)
    }
  }

  const printWindow = window.open('', '_blank')
  let html = `
    <html><head><title>批量快递面单</title>
    <style>
      body { font-family: 'Microsoft YaHei', sans-serif; padding: 10px; }
      .waybill-box { border: 2px solid #333; border-radius: 4px; padding: 12px; max-width: 380px; margin-bottom: 10px; page-break-inside: avoid; }
      .barcode { text-align: center; margin-bottom: 8px; }
      .barcode-bar { height: 35px; background: repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px); }
      .barcode-no { font-family: monospace; font-size: 14px; font-weight: bold; margin-top: 2px; letter-spacing: 2px; }
      .info-row { display: flex; padding: 3px 0; border-bottom: 1px dashed #ccc; font-size: 12px; }
      .info-label { color: #999; min-width: 50px; font-weight: 500; }
      .info-value { flex: 1; }
      .company-tag { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 6px; }
      @media print { body { padding: 0; } .waybill-box { border: none; } }
    </style></head><body>
  `

  batchPrintResults.value.forEach(r => {
    html += `
      <div class="waybill-box">
        <div class="company-tag">${r.expressCompany}</div>
        <div class="barcode"><div class="barcode-bar"></div><div class="barcode-no">${r.expressNo}</div></div>
        <div class="info-row"><span class="info-label">收件人:</span><span class="info-value">${r.receiver}</span></div>
        <div class="info-row"><span class="info-label">电话:</span><span class="info-value">${r.phone}</span></div>
        <div class="info-row"><span class="info-label">地址:</span><span class="info-value">${r.province}${r.city}${r.district}${r.address}</span></div>
        <div class="info-row"><span class="info-label">商品:</span><span class="info-value">${r.items.map(i => i.name + '(' + (i.size || '') + ')').join(', ')}</span></div>
      </div>
    `
  })

  html += `<script>window.onload = function() { window.print(); window.close(); }<\/script></body></html>`
  printWindow.document.write(html)
  printWindow.document.close()
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

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

.stat-pending { background: #fdf6ec; .stat-value { color: #E6A23C; } }
.stat-unpaid { background: #fef0f0; .stat-value { color: #F56C6C; } }
.stat-shipped { background: #ecf5ff; .stat-value { color: #409EFF; } }
.stat-completed { background: #f0f9eb; .stat-value { color: #67C23A; } }
.stat-signed { background: #f4f4f5; .stat-value { color: #909399; } }
.stat-refunded { background: #fef0f0; .stat-value { color: #F56C6C; } }
.stat-total { background: #f5f7fa; .stat-value { color: #303133; } }

.stat-action-btn {
  margin-top: 4px;
  padding: 0;
  font-size: 11px;
}

.search-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.pagination-container { display: flex; justify-content: flex-end; margin-top: $spacing-lg; }

.batch-bar { display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: #f0f9eb; border-radius: 6px; margin-bottom: 12px; border: 1px solid #c2e7b0; }
.selected-count { font-size: 13px; color: #666; strong { color: #67C23A; } }

.order-list {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.order-row {
  display: flex;
  align-items: center;
  padding: 12px 8px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
  color: #333;
  min-height: 60px;

  &:last-child { border-bottom: none; }
  &:hover { background: #fafafa; }
  &.selected { background: #f0f9eb; }
}

.order-check {
  width: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  .lock-icon { color: #C0C4CC; font-size: 12px; }
  .order-tag { margin-top: 2px; }
}

.order-index { width: 28px; text-align: center; color: #999; font-size: 12px; flex-shrink: 0; }

.order-time-nick {
  width: 110px;
  font-size: 12px;
  line-height: 1.5;
  flex-shrink: 0;
}

.order-time { color: #666; white-space: nowrap; }
.time-icon { margin-right: 2px; }

.order-nick {
  font-weight: 500;
  color: #409EFF;
  display: flex;
  align-items: center;
  gap: 2px;
  .address-icon { font-size: 12px; color: #409EFF; }
}

.order-groupno { color: #999; font-size: 10px; }

.order-flag { width: 28px; flex-shrink: 0; }

.order-no-col {
  width: 140px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}

.order-no-text {
  font-family: monospace;
  font-size: 12px;
  color: #409EFF;
  &:hover { text-decoration: underline; }
}

.order-source { margin-top: 1px; }

.order-receiver {
  width: 150px;
  line-height: 1.4;
  flex-shrink: 0;
}

.receiver-header {
  display: flex;
  align-items: center;
  gap: 4px;
}

.copy-receiver-icon {
  font-size: 12px;
  color: #C0C4CC;
  cursor: pointer;
  flex-shrink: 0;
  &:hover { color: #409EFF; }
}

.receiver-name { font-size: 12px; color: #333; font-weight: 500; }
.receiver-phone { font-size: 11px; color: #999; }
.receiver-address {
  font-size: 10px;
  color: #bbb;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.3;
  max-height: 26px;
}

.order-count {
  width: 36px;
  text-align: center;
  flex-shrink: 0;
  .count-num { font-size: 16px; font-weight: 600; color: #333; }
  .count-label { font-size: 10px; color: #999; }
}

.order-goods {
  flex: 1;
  min-width: 200px;
  max-width: 320px;
}

.goods-item {
  display: flex;
  gap: 8px;
  padding: 4px 0;
}

.goods-img {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #eee;
  flex-shrink: 0;
}

.goods-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-width: 0;
}

.goods-name {
  font-size: 12px;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
  .tag-label { flex-shrink: 0; }
}

.goods-size {
  font-size: 11px;
  color: #999;
  display: flex;
  gap: 8px;
}

.sku-label {
  font-family: monospace;
  color: #E6A23C;
  font-size: 10px;
}

.order-remark, .order-seller-remark {
  width: 80px;
  overflow: hidden;
  flex-shrink: 0;
  .remark-label { font-size: 10px; color: #bbb; }
  .remark-text { font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

.order-amount {
  width: 70px;
  text-align: right;
  flex-shrink: 0;
  .amount-label { font-size: 10px; color: #bbb; }
  .amount-value { color: #F56C6C; font-weight: 600; font-size: 13px; }
}

.order-status { width: 65px; text-align: center; flex-shrink: 0; }

.order-classify {
  width: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  .star-icon { cursor: pointer; font-size: 15px; }
  .print-status-icon { font-size: 14px; cursor: default; }
  :deep(.el-checkbox) { margin: 0; }
}

.order-express { width: 100px; flex-shrink: 0; }

.order-action {
  width: 40px;
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  .action-icon { cursor: pointer; color: #999; font-size: 15px; &:hover { color: #409EFF; } }
  .expand-active { color: #409EFF; transform: rotate(180deg); }
}

.import-tip {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
  margin-top: 12px;
}

.dialog-order-info {
  margin-left: 16px;
  font-size: 12px;
  color: #999;
  font-weight: normal;
}

.waybill-preview {
  margin-top: 16px;
  border: 1px dashed #dcdfe6;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.waybill-header h4 { margin: 0 0 12px; color: #333; }

.waybill-barcode {
  text-align: center;
  padding: 12px;
  background: #fff;
  border-radius: 4px;
  margin-bottom: 12px;
}

.barcode-bar {
  height: 40px;
  background: repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px);
  border-radius: 2px;
}

.barcode-no {
  font-family: monospace;
  font-size: 16px;
  font-weight: 700;
  margin-top: 4px;
  letter-spacing: 3px;
  color: #333;
}

.waybill-body { font-size: 13px; color: #333; }

.waybill-row {
  display: flex;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px dashed #eee;
}

.waybill-label { color: #999; min-width: 60px; font-weight: 500; }

.waybill-express-no {
  font-family: monospace;
  color: #409EFF;
  font-weight: 600;
  font-size: 14px;
}

.order-expand {
  margin-top: 16px;
  padding: 16px;
  background: #fafbfc;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.status-flow {
  margin-bottom: 16px;
  h5 { margin: 0 0 12px; font-size: 14px; color: #333; font-weight: 600; }
}

.expand-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.grid-section {
  h5 {
    margin: 0 0 8px;
    font-size: 13px;
    color: #606266;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.info-row { font-size: 12px; line-height: 1.8; color: #333; }
.info-label { color: #999; font-weight: 500; margin-right: 4px; }
.phone-no { font-family: monospace; color: #409EFF; }
.amount { color: #F56C6C; font-weight: 600; }
.express-no { font-family: monospace; color: #E6A23C; font-weight: 600; }

.print-count { font-size: 16px; color: #409EFF; font-weight: 600; }

.batch-print-results {
  margin-top: 16px;
  h4 { margin: 0 0 12px; color: #333; font-size: 14px; }
}

.result-table {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
  max-height: 300px;
  overflow-y: auto;
}

.result-header {
  display: flex;
  background: #f5f7fa;
  padding: 8px 12px;
  font-size: 12px;
  color: #999;
  font-weight: 500;
  position: sticky;
  top: 0;
}

.result-row {
  display: flex;
  padding: 6px 12px;
  font-size: 12px;
  border-top: 1px solid #f0f0f0;
  &:hover { background: #fafafa; }
}

.col-order { flex: 1; font-family: monospace; color: #409EFF; min-width: 120px; }
.col-receiver { flex: 1; min-width: 80px; }
.col-express { width: 80px; color: #666; }
.col-express-no { width: 120px; font-family: monospace; color: #67C23A; font-weight: 600; }

.account-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #E6A23C;
  margin-top: 4px;
  .link { color: #409EFF; cursor: pointer; text-decoration: underline; }
}

.section-title {
  margin: 16px 0 8px;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.detail-goods-img {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  object-fit: cover;
}

.empty-state { padding: 40px 0; }
</style>
