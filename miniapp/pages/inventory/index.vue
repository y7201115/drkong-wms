<template>
  <view class="container">
    <view class="search-bar">
      <input class="search-input" v-model="keyword" placeholder="搜索货号" confirm-type="search" @confirm="handleSearch" />
      <button class="search-btn" @click="handleSearch">搜索</button>
    </view>
    <view class="stats-bar" v-if="totalStock > 0">
      <text class="stats-text">共 {{ inventoryList.length }} 个货号，总库存 {{ totalStock }} 件</text>
    </view>
    <view v-if="loading" class="loading-area"><text class="text-secondary">加载中...</text></view>
    <view v-else-if="inventoryList.length === 0" class="empty-area"><text class="text-secondary">暂无库存数据</text></view>
    <view v-else>
      <view class="card inventory-card" v-for="item in inventoryList" :key="item.item_code">
        <view class="item-header flex-between">
          <text class="item-code">{{ item.item_code }}</text>
          <text class="item-total">合计: {{ getTotalQty(item.sizes) }} 件</text>
        </view>
        <view class="size-grid">
          <view class="size-item" v-for="s in item.sizes" :key="s.size" :class="s.quantity < 5 ? 'low-stock' : ''">
            <text class="size-num">{{ s.size }}</text>
            <text class="size-qty" :class="s.quantity < 5 ? 'text-danger' : ''">{{ s.quantity }}</text>
          </view>
        </view>
      </view>
    </view>
    <view class="load-more" v-if="hasMore && !loading" @click="loadMore"><text class="text-secondary">加载更多</text></view>
  </view>
</template>

<script>
import request from '../../api/request'
export default {
  data() {
    return { keyword:'', inventoryList:[], loading:false, page:1, pageSize:20, hasMore:false }
  },
  computed: {
    totalStock: function() { return this.inventoryList.reduce(function(sum,item){ return sum+(item.sizes||[]).reduce(function(s,sz){return s+(sz.quantity||0)}, 0) }, 0) }
  },
  onShow: function() { this.refresh() },
  onPullDownRefresh: function() {
    var self = this
    self.refresh().then(function(){ uni.stopPullDownRefresh() })
  },
  methods: {
    refresh: function() { var self=this; this.page=1; this.inventoryList=[]; return this.fetchData() },
    handleSearch: function() { return this.refresh() },
    loadMore: function() { this.page++; return this.fetchData() },
    fetchData: function() {
      var self = this
      this.loading = true
      return request.get('/api/inventory/list', { page:this.page, pageSize:this.pageSize, item_code:this.keyword||undefined }).then(function(res){
        var list = (res&&res.list) || []
        if(self.page===1) { self.inventoryList = list } else { self.inventoryList = self.inventoryList.concat(list) }
        self.hasMore = list.length >= self.pageSize
      }).catch(function(){ self.inventoryList = [] }).finally(function(){ self.loading = false })
    },
    getTotalQty: function(sizes) { return (sizes||[]).reduce(function(sum,s){return sum+(s.quantity||0)}, 0) }
  }
}
</script>

<style lang="scss">
.search-bar { display:flex; gap:8px; margin-bottom:12px }
.search-input { flex:1; height:40px; border:1px solid #e8e8e8; border-radius:8px; padding:0 12px; font-size:14px; background:#fff }
.search-btn { height:40px; line-height:40px; padding:0 20px; background:#1890ff; color:#fff; border:none; border-radius:8px; font-size:14px }
.stats-bar { margin-bottom:12px }
.stats-text { font-size:13px; color:#8c8c8c }
.loading-area,.empty-area { text-align:center; padding:60px 0 }
.inventory-card { margin-bottom:12px }
.item-header { margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid #f5f5f5 }
.item-code { font-size:16px; font-weight:600; color:#333; font-family:monospace }
.item-total { font-size:13px; color:#1890ff; font-weight:500 }
.size-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:8px }
.size-item { text-align:center; padding:8px 4px; background:#f5f7fa; border-radius:8px }
.size-item.low-stock { background:#fff1f0 }
.size-num { display:block; font-size:12px; color:#8c8c8c }
.size-qty { display:block; font-size:16px; font-weight:bold; color:#333; margin-top:2px }
.load-more { text-align:center; padding:16px }
</style>
