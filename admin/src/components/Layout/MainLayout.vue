<template>
  <div class="main-layout">
    <el-aside :width="appStore.sidebarWidth" class="sidebar">
      <Sidebar />
    </el-aside>
    <el-container class="main-container">
      <el-header class="header">
        <Header />
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { useAppStore } from '@/store/app'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'

const appStore = useAppStore()
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.main-layout {
  display: flex;
  height: 100vh;
  width: 100%;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s ease;
  overflow: hidden;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  padding: 0;
  height: $header-height;
}

.main-content {
  background-color: $bg-color;
  overflow-y: auto;
  padding: $spacing-lg;
}
</style>
