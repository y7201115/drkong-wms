<template>
  <view class="container">
    <view class="welcome-card card">
      <view class="flex-between">
        <view>
          <text class="welcome-text">你好，{{ displayName }}</text>
          <text class="welcome-sub">欢迎使用江博士仓库管理系统</text>
        </view>
        <view class="avatar-area" @click="handleLogout">
          <text class="avatar-text">{{ displayName[0] }}</text>
        </view>
      </view>
    </view>
    <view class="stats-grid">
      <view class="stat-card" @click="goInventory">
        <text class="stat-num text-primary">{{ stats.totalInventory || 0 }}</text>
        <text class="stat-label">库存总量</text>
      </view>
      <view class="stat-card" @click="goInbound">
        <text class="stat-num text-success">{{ stats.todayInbound || 0 }}</text>
        <text class="stat-label">今日入库</text>
      </view>
      <view class="stat-card" @click="goOutbound">
        <text class="stat-num text-warning">{{ stats.todayOutbound || 0 }}</text>
        <text class="stat-label">今日出库</text>
      </view>
      <view class="stat-card" @click="goReturns">
        <text class="stat-num text-danger">{{ stats.pendingReturns || 0 }}</text>
        <text class="stat-label">待处理退件</text>
      </view>
    </view>
    <view class="section-title">快捷操作</view>
    <view class="quick-actions">
      <view class="action-item" @click="goInbound">
        <view class="action-icon action-icon-blue"><text class="icon-char">入</text></view>
        <text class="action-text">扫码入库</text>
      </view>
      <view class="action-item" @click="goOutbound">
        <view class="action-icon action-icon-green"><text class="icon-char icon-green">出</text></view>
        <text class="action-text">扫码出库</text>
      </view>
      <view class="action-item" @click="goInventory">
        <view class="action-icon action-icon-orange"><text class="icon-char icon-orange">查</text></view>
        <text class="action-text">库存查询</text>
      </view>
      <view class="action-item" @click="goReturns">
        <view class="action-icon action-icon-red"><text class="icon-char icon-red">退</text></view>
        <text class="action-text">退件处理</text>
      </view>
    </view>
    <view class="section-title">最近操作</view>
    <view class="card" v-if="recentRecords.length > 0">
      <view class="record-item" v-for="item in recentRecords" :key="item.id">
        <view class="flex-between">
          <view>
            <text class="record-barcode">{{ item.barcode }}</text>
            <text class="record-info">{{ item.item_code }} / {{ item.size }}码 x {{ item.quantity }}</text>
          </view>
          <view class="record-tag" :class="item.type === 'inbound' ? 'tag-blue' : 'tag-green'">
            {{ item.type === 'inbound' ? '入库' : '出库' }}
          </view>
        </view>
      </view>
    </view>
    <view class="card empty-card" v-else><text class="text-secondary">暂无操作记录</text></view>
  </view>
</template>

<script>
import request from '../../api/request'
export default {
  data() {
    return { userInfo: {}, stats: {}, recentRecords: [], displayName: '管理员' }
  },
  onShow() {
    this.loadUserInfo()
    this.loadStats()
    this.loadRecentRecords()
  },
  methods: {
    loadUserInfo: function(){
      try {
        var info = uni.getStorageSync('userInfo')
        if(info) {
          this.userInfo = JSON.parse(info)
          this.displayName = this.userInfo.name || this.userInfo.username || '管理员'
        }
      } catch(e) { this.userInfo = {} }
    },
    loadStats: function(){
      var self = this
      request.get('/api/dashboard/stats').then(function(res){ self.stats = res || {} }).catch(function(){ self.stats = { totalInventory:0, todayInbound:0, todayOutbound:0, pendingReturns:0 } })
    },
    loadRecentRecords: function(){
      var self = this
      request.get('/api/dashboard/recent-records', { limit: 5 }).then(function(res){ self.recentRecords = res || [] }).catch(function(){ self.recentRecords = [] })
    },
    goInbound: function(){ uni.navigateTo({ url: '/pages/inbound/index' }) },
    goOutbound: function(){ uni.navigateTo({ url: '/pages/outbound/index' }) },
    goInventory: function(){ uni.switchTab({ url: '/pages/inventory/index' }) },
    goReturns: function(){ uni.navigateTo({ url: '/pages/returns/index' }) },
    handleLogout: function(){
      var self = this
      uni.showModal({ title:'提示', content:'确认退出登录？', success:function(res){ if(res.confirm){ uni.removeStorageSync('token'); uni.removeStorageSync('userInfo'); uni.reLaunch({url:'/pages/login/index'}) }}})
    }
  }
}
</script>

<style lang="scss">
.welcome-card { background:linear-gradient(135deg,#1890ff 0%,#096dd9 100%); color:#fff }
.welcome-text { display:block; font-size:20px; font-weight:bold; color:#fff }
.welcome-sub { display:block; font-size:12px; color:rgba(255,255,255,0.8); margin-top:4px }
.avatar-area { width:44px; height:44px; border-radius:50%; background:rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center }
.avatar-text { color:#fff; font-size:18px; font-weight:bold }
.stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px }
.stat-card { background:#fff; border-radius:12px; padding:16px; text-align:center; box-shadow:0 2px 8px rgba(0,0,0,0.06) }
.stat-num { display:block; font-size:28px; font-weight:bold }
.stat-label { display:block; font-size:12px; color:#8c8c8c; margin-top:4px }
.section-title { font-size:16px; font-weight:600; color:#333; margin-bottom:12px; margin-top:8px }
.quick-actions { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:12px; margin-bottom:16px }
.action-item { text-align:center }
.action-icon { width:56px; height:56px; border-radius:16px; display:flex; align-items:center; justify-content:center; margin:0 auto 8px }
.action-icon-blue { background:#e6f7ff }
.action-icon-green { background:#f6ffed }
.action-icon-orange { background:#fff7e6 }
.action-icon-red { background:#fff1f0 }
.icon-char { font-size:24px; color:#1890ff }
.icon-green { color:#52c41a }
.icon-orange { color:#faad14 }
.icon-red { color:#ff4d4f }
.action-text { font-size:12px; color:#333 }
.record-item { padding:12px 0; border-bottom:1px solid #f0f0f0 }
.record-item:last-child { border-bottom:none }
.record-barcode { display:block; font-size:14px; font-weight:500; color:#333; font-family:monospace }
.record-info { display:block; font-size:12px; color:#8c8c8c; margin-top:2px }
.record-tag { font-size:12px; padding:2px 8px; border-radius:4px }
.tag-blue { background:#e6f7ff; color:#1890ff }
.tag-green { background:#f6ffed; color:#52c41a }
.empty-card { text-align:center; padding:32px }
</style>
