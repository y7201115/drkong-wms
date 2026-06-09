<template>
  <view class="container">
    <view class="card">
      <view class="scan-area">
        <button class="btn-primary scan-btn btn-green" @click="handleScan">&#128247; 扫码出库</button>
      </view>
      <view class="form-section" v-if="barcodeResult">
        <view class="form-item"><text class="form-label">条形码</text><text class="form-value mono">{{ barcodeResult }}</text></view>
        <view class="form-item"><text class="form-label">货号</text><text class="form-value">{{ parsedInfo.articleNo || '-' }}</text></view>
        <view class="form-item"><text class="form-label">尺码</text><text class="form-value">{{ parsedInfo.size || '-' }}</text></view>
        <view class="stock-info" v-if="stockInfo !== null">
          <text class="stock-label">当前库存:</text>
          <text class="stock-num" :class="stockInfo < Number(quantity) ? 'text-danger' : ''">{{ stockInfo }}</text>
        </view>
        <view class="form-item">
          <text class="form-label">数量</text>
          <view class="qty-control">
            <button class="qty-btn" @click="decreaseQty">-</button>
            <input class="qty-input" type="number" :value="quantity" @input="onQtyInput" />
            <button class="qty-btn" @click="increaseQty">+</button>
          </view>
        </view>
        <view class="form-item"><text class="form-label">备注</text><input class="form-input" v-model="remark" placeholder="选填" /></view>
        <button class="btn-primary btn-green" :loading="submitting" @click="handleSubmit">确认出库</button>
      </view>
    </view>
    <view class="section-title" v-if="history.length > 0">今日出库记录</view>
    <view class="card" v-if="history.length > 0">
      <view class="history-item" v-for="(item, idx) in history" :key="idx">
        <view class="flex-between">
          <view><text class="history-barcode">{{ item.barcode }}</text><text class="history-info">{{ item.articleNo }} / {{ item.size }}码 x {{ item.quantity }}</text></view>
          <text class="history-time">{{ item.time }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { parseBarcode } from '../../utils/barcode'
import request from '../../api/request'
export default {
  data() {
    return { barcodeResult:'', parsedInfo:{}, quantity:1, remark:'', submitting:false, history:[], stockInfo:null }
  },
  methods: {
    handleScan: function() {
      var self = this
      uni.scanCode({ onlyFromCamera:false, scanType:['barCode','qrCode'], success:function(res){
        self.barcodeResult=res.result; self.parsedInfo=parseBarcode(res.result)||{}; self.quantity=1; self.remark=''; self.stockInfo=null
        if(self.parsedInfo.articleNo && self.parsedInfo.size) {
          request.get('/api/inventory/stock', { item_code:self.parsedInfo.articleNo, size:self.parsedInfo.rawSize||self.parsedInfo.size }).then(function(stock){ self.stockInfo = (stock && (stock.quantity||stock.stock))||null }).catch(function(){ self.stockInfo=null })
        }
      }, fail:function(){ uni.showToast({title:'扫码取消',icon:'none'}) }})
    },
    increaseQty: function(){ this.quantity = Number(this.quantity) + 1 },
    decreaseQty: function(){ if(this.quantity > 1) this.quantity = Number(this.quantity) - 1 },
    onQtyInput: function(e){ this.quantity = Number(e.detail.value) || 1 },
    handleSubmit: function() {
      var self = this
      if(!this.barcodeResult) { uni.showToast({title:'请先扫码',icon:'none'}); return }
      if(!this.parsedInfo.articleNo) { uni.showToast({title:'无法识别条形码',icon:'none'}); return }
      if(this.stockInfo !== null && this.stockInfo < Number(this.quantity)) { uni.showToast({title:'库存不足，当前仅 '+this.stockInfo+' 件',icon:'none'}); return }
      this.submitting = true
      request.post('/api/inventory/outbound', { barcode:this.barcodeResult, item_code:this.parsedInfo.articleNo, size:this.parsedInfo.rawSize||this.parsedInfo.size, quantity:Number(this.quantity), remark:this.remark }).then(function(){
        uni.showToast({ title:'出库成功', icon:'success' })
        var t = new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})
        self.history.unshift({ barcode:self.barcodeResult, articleNo:self.parsedInfo.articleNo, size:self.parsedInfo.size, quantity:Number(self.quantity), time:t })
        self.barcodeResult=''; self.parsedInfo={}; self.quantity=1; self.remark=''; self.stockInfo=null
      }).catch(function(e){ console.error('出库失败:',e) }).finally(function(){ self.submitting = false })
    }
  }
}
</script>

<style lang="scss">
.scan-area { margin-bottom:16px }
.scan-btn { font-size:18px; height:56px }
.btn-green { background:#52c41a; border-color:#52c41a }
.form-section { border-top:1px solid #f0f0f0; padding-top:16px }
.form-item { margin-bottom:16px }
.form-label { display:block; font-size:13px; color:#8c8c8c; margin-bottom:4px }
.form-value { font-size:16px; color:#333; font-weight:500 }
.form-value.mono { font-family:monospace; font-size:14px; word-break:break-all }
.form-input { width:100%; height:40px; border:1px solid #e8e8e8; border-radius:8px; padding:0 12px; font-size:14px; box-sizing:border-box }
.stock-info { display:flex; align-items:center; gap:8px; margin-bottom:16px; padding:8px 12px; background:#f6ffed; border-radius:8px }
.stock-label { font-size:13px; color:#8c8c8c }
.stock-num { font-size:20px; font-weight:bold; color:#52c41a }
.qty-control { display:flex; align-items:center; gap:12px }
.qty-btn { width:40px; height:40px; border-radius:8px; background:#f5f5f5; border:1px solid #e8e8e8; font-size:20px; display:flex; align-items:center; justify-content:center; padding:0; margin:0; line-height:1 }
.qty-input { width:80px; height:40px; text-align:center; border:1px solid #e8e8e8; border-radius:8px; font-size:18px; font-weight:bold }
.section-title { font-size:15px; font-weight:600; color:#333; margin:16px 0 8px }
.history-item { padding:10px 0; border-bottom:1px solid #f5f5f5 }
.history-item:last-child { border-bottom:none }
.history-barcode { display:block; font-size:13px; font-family:monospace; color:#333 }
.history-info { display:block; font-size:12px; color:#8c8c8c; margin-top:2px }
.history-time { font-size:12px; color:#bfbfbf }
</style>
