<template>
  <view class="container">
    <view class="filter-bar">
      <view class="filter-item" :class="filterType === 'all' ? 'active' : ''" @click="setType('all')">全部</view>
      <view class="filter-item" :class="filterType === 'inbound' ? 'active' : ''" @click="setType('inbound')">入库</view>
      <view class="filter-item" :class="filterType === 'outbound' ? 'active' : ''" @click="setType('outbound')">出库</view>
    </view>
    <view v-if="loading" class="loading-area"><text class="text-secondary">加载中...</text></view>
    <view v-else-if="records.length === 0" class="empty-area"><text class="text-secondary">暂无操作记录</text></view>
    <view v-else>
      <view class="card record-card" v-for="(item, idx) in records" :key="idx">
        <view class="flex-between">
          <view class="record-type-tag" :class="item.type === 'inbound' ? 'tag-blue' : 'tag-green'">{{ item.type === 'inbound' ? '入库' : '出库' }}</view>
          <text class="record-time">{{ formatTime(item.time) }}</text>
        </view>
        <view class="record-detail">
          <text class="record-barcode">{{ item.barcode }}</text>
          <text class="record-info">{{ item.articleNo || item.item_code }} / {{ item.size }}码 x {{ item.quantity }}</text>
        </view>
        <view class="record-footer">
          <text class="record-operator">操作人: {{ item.operator }}</text>
          <text class="record-remark" v-if="item.remark">{{ item.remark }}</text>
        </view>
      </view>
      <view class="load-more" v-if="hasMore && !loading" @click="loadMore"><text class="text-secondary">加载更多</text></view>
    </view>
  </view>
</template>

<script>
import request from '../../api/request'
export default {
  data() {
    return { records:[], loading:false, filterType:'all', page:1, pageSize:20, hasMore:false }
  },
  onShow: function() { this.refresh() },
  onPullDownRefresh: function() {
    var self = this
    self.refresh().then(function(){ uni.stopPullDownRefresh() })
  },
  methods: {
    setType: function(t) { this.filterType = t; this.refresh() },
    refresh: function() { this.page=1; this.records=[]; return this.fetchData() },
    loadMore: function() { this.page++; return this.fetchData() },
    fetchData: function() {
      var self = this
      this.loading = true
      return request.get('/api/records/list', { page:this.page, pageSize:this.pageSize, type: this.filterType==='all'?undefined:this.filterType }).then(function(res){
        var list = (res&&res.list) || []
        if(self.page===1) { self.records = list } else { self.records = self.records.concat(list) }
        self.hasMore = list.length >= self.pageSize
      }).catch(function(){ self.records = [] }).finally(function(){ self.loading = false })
    },
    formatTime: function(time) {
      if(!time) return ''
      var d = new Date(time)
      if(isNaN(d.getTime())) return time
      var month = String(d.getMonth()+1).padStart(2,'0')
      var day = String(d.getDate()).padStart(2,'0')
      var hour = String(d.getHours()).padStart(2,'0')
      var minute = String(d.getMinutes()).padStart(2,'0')
      return month+'-'+day+' '+hour+':'+minute
    }
  }
}
</script>

<style lang="scss">
.filter-bar { display:flex; gap:8px; margin-bottom:12px }
.filter-item { padding:6px 16px; border-radius:20px; font-size:13px; color:#8c8c8c; background:#f5f5f5 }
.filter-item.active { background:#1890ff; color:#fff }
.loading-area,.empty-area { text-align:center; padding:60px 0 }
.record-card { margin-bottom:8px }
.record-type-tag { font-size:12px; padding:2px 8px; border-radius:4px; font-weight:500 }
.tag-blue { background:#e6f7ff; color:#1890ff }
.tag-green { background:#f6ffed; color:#52c41a }
.record-time { font-size:12px; color:#bfbfbf }
.record-detail { margin-top:8px }
.record-barcode { display:block; font-size:14px; font-family:monospace; color:#333; font-weight:500 }
.record-info { display:block; font-size:13px; color:#8c8c8c; margin-top:2px }
.record-footer { margin-top:8px; padding-top:8px; border-top:1px solid #f5f5f5; display:flex; justify-content:space-between; align-items:center }
.record-operator { font-size:12px; color:#bfbfbf }
.record-remark { font-size:12px; color:#faad14; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
.load-more { text-align:center; padding:16px }
</style>
