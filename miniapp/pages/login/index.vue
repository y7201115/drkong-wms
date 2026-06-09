<template>
  <view class="login-page">
    <view class="login-header">
      <view class="logo-area">
        <text class="logo-text">江博士</text>
        <text class="logo-sub">童鞋仓库管理系统</text>
      </view>
    </view>
    <view class="login-form">
      <view class="form-item">
        <text class="form-label">用户名</text>
        <input class="form-input" v-model="username" placeholder="请输入用户名" />
      </view>
      <view class="form-item">
        <text class="form-label">密码</text>
        <input class="form-input" v-model="password" type="password" placeholder="请输入密码" @confirm="handleLogin" />
      </view>
      <button class="btn-primary login-btn" :loading="loading" @click="handleLogin">登 录</button>
      <view class="login-tip"><text class="text-secondary">默认账号: admin / admin123</text></view>
    </view>
    <view class="login-footer"><text class="text-secondary">v1.0.0</text></view>
  </view>
</template>

<script>
import request from '../../api/request'
export default {
  data() {
    return { username: '', password: '', loading: false }
  },
  methods: {
    async handleLogin() {
      if (!this.username.trim()) { uni.showToast({ title: '请输入用户名', icon: 'none' }); return }
      if (!this.password.trim()) { uni.showToast({ title: '请输入密码', icon: 'none' }); return }
      this.loading = true
      try {
        var res = await request.post('/api/auth/login', { username: this.username.trim(), password: this.password }, { needToken: false })
        uni.setStorageSync('token', res.token)
        uni.setStorageSync('userInfo', JSON.stringify(res.user || { username: this.username }))
        uni.showToast({ title: '登录成功', icon: 'success', duration: 800 })
        setTimeout(function(){
          uni.switchTab({ url: '/pages/index/index' })
        }, 900)
      } catch (e) { console.error('登录失败:', e) }
      finally { this.loading = false }
    }
  }
}
</script>

<style lang="scss">
.login-page { min-height: 100vh; background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%); display: flex; flex-direction: column; padding: 0 32px; }
.login-header { flex: 1; display: flex; align-items: center; justify-content: center; padding-top: 80px; }
.logo-area { text-align: center; }
.logo-text { display: block; font-size: 42px; font-weight: bold; color: #fff; letter-spacing: 4px; }
.logo-sub { display: block; font-size: 14px; color: rgba(255,255,255,0.8); margin-top: 8px; }
.login-form { background: #fff; border-radius: 16px; padding: 32px 24px; margin-bottom: 40px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
.form-item { margin-bottom: 20px; }
.form-label { display: block; font-size: 14px; color: #333; margin-bottom: 8px; font-weight: 500; }
.form-input { width: 100%; height: 48px; border: 1px solid #e8e8e8; border-radius: 8px; padding: 0 16px; font-size: 15px; box-sizing: border-box; background: #fafafa; }
.login-btn { margin-top: 24px; width: 100%; }
.login-tip { text-align: center; margin-top: 16px; font-size: 12px; }
.login-footer { text-align: center; padding-bottom: 40px; font-size: 12px; color: rgba(255,255,255,0.6); }
</style>
