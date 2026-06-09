<template>
  <view class="container">
    <view class="card">
      <view class="scan-area">
        <button class="btn-primary scan-btn btn-yellow" @click="handleScan">&#128247; 扫码登记退件</button>
      </view>
      <view class="form-section" v-if="expressNo">
        <view class="form-item"><text class="form-label">快递单号</text><text class="form-value mono">{{ expressNo }}</text></view>
        <view class="form-item" v-if="expressCompany"><text class="form-label">快递公司</text><text class="form-value">{{ expressCompany }}</text></view>
        <view class="form-item"><text class="form-label">退件货号</text><input class="form-input" v-model="itemCode" placeholder="扫码或手动输入" /></view>
        <view class="form-item">
          <text class="form-label">尺码</text>
          <picker @change="onSizeChange" :value="sizeIndex" :range="sizes"><view class="picker-value">{{ sizes[sizeIndex] || '请选择' }}</view></picker>
        </view>
        <view class="form-item">
          <text class="form-label">退件原因</text>
          <picker @change="onReasonChange" :value="reasonIndex" :range="reasons"><view class="picker-value">{{ reasons[reasonIndex] || '请选择' }}</view></picker>
        </view>
        <view class="form-item"><text class="form-label">备注</text><input class="form-input" v-model="remark" placeholder="选填" /></view>
        <button class="btn-primary btn-yellow" :loading="submitting" @click="handleSubmit">提交退件登记</button>
      </view>
    </view>
    <view class="section-title" v-if="returnList.length > 0">最近退件记录</view>
    <view class="card" v-if="returnList.length > 0">
      <view class="return-item" v-for="(item, idx) in returnList" :key="idx">
        <view class="flex-between">
          <view><text class="return-express">{{ item.express_no }}</text><text class="return-info">{{ item.item_code }} / {{ item.size }}码 - {{ item.return_reason }}</text></view>
          <view :class="item.status==='pending' ? 'tag-pending' : 'tag-done'">{{ item.status==='pending'?'待处理':'已处理' }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import request from '../../api/request'
export default {
  data() {
    return {
      expressNo:'', expressCompany:'', itemCode:'', remark:'', submitting:false, returnList:[],
      sizes:['26','26.5','27','27.5','28','28.5','29','29.5','30','30.5','31','31.5','32','32.5','33'],
      sizeIndex:0,
      reasons:['尺码不合','质量问题','发错货','客户取消','不喜欢','其他'],
      reasonIndex:5
    }
  },
  onShow: function() { this.loadReturnList() },
  methods: {
    onSizeChange: function(e){ this.sizeIndex = e.detail.value },
    onReasonChange: function(e){ this.reasonIndex = e.detail.value },
    handleScan: function() {
      var self = this
      uni.scanCode({ onlyFromCamera:false, scanType:['barCode','qrCode'], success: function(res){
        var result = res.result.trim()
        if(/^[A-Z0-9]{8,20}$/i.test(result) || /^SF\d{12,14}$/i.test(result) || /^YT\d{12,14}$/i.test(result)) {
          self.expressNo = result; self.itemCode = ''; self.sizeIndex = 0
          request.post('/api/returns/detect-express', { express_no:result }).then(function(det){ self.expressCompany = (det&&det.name)||'' }).catch(function(){ self.expressCompany='' })
        } else { self.itemCode = result; uni.showToast({title:'已识别商品条形码',icon:'none'}) }
      }, fail:function(){ uni.showToast({title:'扫码取消',icon:'none'}) }})
    },
    handleSubmit: function() {
      var self = this
      if(!this.expressNo) { uni.showToast({title:'请先扫描快递单号',icon:'none'}); return }
      if(!this.itemCode) { uni.showToast({title:'请输入退件货号',icon:'none'}); return }
      this.submitting = true
      request.post('/api/returns/submit', { express_no:this.expressNo, express_company:this.expressCompany, items:[{ barcode:'', item_code:this.itemCode, size:this.sizes[this.sizeIndex], reason:this.reasons[this.reasonIndex], remark:this.remark }] }).then(function(){
        uni.showToast({ title:'退件登记成功', icon:'success' })
        self.loadReturnList()
        self.expressNo=''; self.expressCompany=''; self.itemCode=''; self.remark=''
      }).catch(function(e){ console.error('退件登记失败:',e) }).finally(function(){ self.submitting = false })
    },
    loadReturnList: function() {
      var self = this
      request.get('/api/returns/list', { page:1, pageSize:10 }).then(function(res){ self.returnList = (res&&res.list||[]).slice(0,5) }).catch(function(){ self.returnList = [] })
    }
  }
}
</script>

<style lang="scss">
.scan-area { margin-bottom:16px }
.scan-btn { font-size:18px; height:56px }
.btn-yellow { background:#faad14; border-color:#faad14 }
.form-section { border-top:1px solid #f0f0f0; padding-top:16px }
.form-item { margin-bottom:16px }
.form-label { display:block; font-size:13px; color:#8c8c8c; margin-bottom:4px }
.form-value { font-size:16px; color:#333; font-weight:500 }
.form-value.mono { font-family:monospace; font-size:14px; word-break:break-all }
.form-input { width:100%; height:40px; border:1px solid #e8e8e8; border-radius:8px; padding:0 12px; font-size:14px; box-sizing:border-box }
.picker-value { width:100%; height:40px; border:1px solid #e8e8e8; border-radius:8px; padding:0 12px; font-size:14px; display:flex; align-items:center; box-sizing:border-box; color:#333 }
.section-title { font-size:15px; font-weight:600; color:#333; margin:16px 0 8px }
.return-item { padding:10px 0; border-bottom:1px solid #f5f5f5 }
.return-item:last-child { border-bottom:none }
.return-express { display:block; font-size:13px; font-family:monospace; color:#333 }
.return-info { display:block; font-size:12px; color:#8c8c8c; margin-top:2px }
.return-tag { font-size:12px; padding:2px 8px; border-radius:4px }
.tag-pending { background:#fff7e6; color:#faad14 }
.tag-done { background:#f6ffed; color:#52c41a }
</style>
