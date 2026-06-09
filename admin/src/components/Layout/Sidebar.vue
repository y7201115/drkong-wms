<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="appStore.sidebarCollapsed"
    :collapse-transition="true"
    background-color="#304156"
    text-color="#BFBDCC"
    active-text-color="#409EFF"
    class="sidebar-menu"
    router
  >
    <div class="logo-container">
      <img src="@/assets/logo.svg" class="logo" alt="logo" v-if="!appStore.sidebarCollapsed" />
      <h1 class="logo-title" v-if="!appStore.sidebarCollapsed">江博士仓库管理</h1>
      <h1 class="logo-title-short" v-else>JK</h1>
    </div>

    <el-menu-item index="/dashboard">
      <el-icon><Odometer /></el-icon>
      <template #title>仪表盘</template>
    </el-menu-item>

    <el-sub-menu index="inventory">
      <template #title>
        <el-icon><Box /></el-icon>
        <span>库存管理</span>
      </template>
      <el-menu-item index="/inventory/list">库存列表</el-menu-item>
      <el-menu-item index="/inventory/adjust">库存调整</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="stock-records">
      <template #title>
        <el-icon><Tickets /></el-icon>
        <span>出入库管理</span>
      </template>
      <el-menu-item index="/stock-records/list">出入库记录</el-menu-item>
      <el-menu-item index="/stock-records/batch-scan">批量扫码</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="returns">
      <template #title>
        <el-icon><RefreshLeft /></el-icon>
        <span>退件管理</span>
      </template>
      <el-menu-item index="/returns/list">退件列表</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="reports">
      <template #title>
        <el-icon><DataAnalysis /></el-icon>
        <span>报表统计</span>
      </template>
      <el-menu-item index="/reports/inventory">库存报表</el-menu-item>
      <el-menu-item index="/reports/returns">退件报表</el-menu-item>
    </el-sub-menu>

    <el-divider style="margin: 12px 20px; background-color: #465a73;" />

    <el-sub-menu index="erp">
      <template #title>
        <el-icon><Connection /></el-icon>
        <span>快团团ERP</span>
      </template>
      <el-menu-item index="/erp/dashboard">ERP仪表盘</el-menu-item>
      <el-menu-item index="/erp/orders">订单管理</el-menu-item>
      <el-menu-item index="/erp/products">商品管理</el-menu-item>
      <el-menu-item index="/erp/sku">SKU管理</el-menu-item>
      <el-menu-item index="/erp/logistics">物流管理</el-menu-item>
      <el-menu-item index="/erp/refund">售后退款</el-menu-item>
      <el-menu-item index="/erp/settings">API设置</el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/app'
import { Connection } from '@element-plus/icons-vue'

const route = useRoute()
const appStore = useAppStore()

const activeMenu = computed(() => route.path)
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.sidebar-menu {
  height: 100%;
  border-right: none;
  
  &:not(.el-menu--collapse) {
    width: $sidebar-width;
  }
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #263445;
  overflow: hidden;
}

.logo {
  width: 32px;
  height: 32px;
}

.logo-title {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  margin: 0;
}

.logo-title-short {
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  margin: 0;
}

.el-menu-item,
.el-sub-menu__title {
  &:hover {
    background-color: #263445 !important;
  }
}
</style>
