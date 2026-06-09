<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('App Launch')
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
page {
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  color: #262626;
}

/* 通用样式 */
.container {
  padding: 16px;
}

.card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.btn-primary {
  background-color: #1890ff;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-primary:active {
  background-color: #096dd9;
}

.btn-success {
  background-color: #52c41a;
  color: #ffffff;
}

.btn-warning {
  background-color: #faad14;
  color: #ffffff;
}

.btn-danger {
  background-color: #ff4d4f;
  color: #ffffff;
}

.text-primary {
  color: #1890ff;
}

.text-success {
  color: #52c41a;
}

.text-warning {
  color: #faad14;
}

.text-danger {
  color: #ff4d4f;
}

.text-secondary {
  color: #8c8c8c;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mb-sm {
  margin-bottom: 8px;
}

.mb-md {
  margin-bottom: 16px;
}

.mb-lg {
  margin-bottom: 24px;
}
</style>
