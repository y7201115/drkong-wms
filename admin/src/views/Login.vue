<template>
  <div class="login-container">
    <canvas ref="canvasRef" class="particle-canvas"></canvas>
    <div class="login-overlay"></div>
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">
          <div class="logo-icon">
            <span class="logo-text">W</span>
          </div>
        </div>
        <h2 class="login-title">仓库管理系统</h2>
        <p class="login-subtitle">WAREHOUSE MANAGEMENT SYSTEM</p>
      </div>

      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            class="custom-input"
          >
            <template #prefix>
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            class="custom-input"
            show-password
          >
            <template #prefix>
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            class="login-btn"
            size="large"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>

        <div class="login-links">
          <span class="link-item" @click="showRegisterDialog = true">注册账号</span>
          <span class="link-divider">|</span>
          <span class="link-item" @click="showForgotDialog = true">忘记密码</span>
        </div>
      </el-form>
    </div>

    <!-- 注册对话框 -->
    <el-dialog
      v-model="showRegisterDialog"
      width="480px"
      :show-close="false"
      :close-on-click-modal="false"
      class="dark-dialog register-dialog"
    >
      <div class="dialog-content">
        <button class="dialog-close" @click="showRegisterDialog = false">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="dialog-header">
          <div class="dialog-icon-wrap register-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </div>
          <h3 class="dialog-title">注册账号</h3>
          <p class="dialog-subtitle">创建您的管理后台账号</p>
        </div>

        <el-form
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          class="dialog-form"
          @keyup.enter="handleRegister"
        >
          <el-form-item prop="username">
            <div class="custom-field">
              <label class="field-label">用户名</label>
              <el-input v-model="registerForm.username" placeholder="请输入用户名" size="large" />
            </div>
          </el-form-item>

          <el-form-item prop="password">
            <div class="custom-field">
              <label class="field-label">密码</label>
              <el-input v-model="registerForm.password" type="password" placeholder="至少6位密码" size="large" show-password />
            </div>
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <div class="custom-field">
              <label class="field-label">确认密码</label>
              <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" size="large" show-password />
            </div>
          </el-form-item>

          <el-form-item class="form-actions">
            <el-button class="btn-cancel" size="large" @click="showRegisterDialog = false">取消</el-button>
            <el-button class="btn-primary" size="large" :loading="registerLoading" @click="handleRegister">
              {{ registerLoading ? '注册中...' : '注 册' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-dialog>

    <!-- 忘记密码对话框 -->
    <el-dialog
      v-model="showForgotDialog"
      width="480px"
      :show-close="false"
      :close-on-click-modal="false"
      class="dark-dialog forgot-dialog"
    >
      <div class="dialog-content">
        <button class="dialog-close" @click="showForgotDialog = false">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="dialog-header">
          <div class="dialog-icon-wrap forgot-icon">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              <circle cx="12" cy="16" r="1"/>
            </svg>
          </div>
          <h3 class="dialog-title">忘记密码</h3>
          <p class="dialog-subtitle">通过注册邮箱重置您的密码</p>
        </div>

        <el-form
          ref="forgotFormRef"
          :model="forgotForm"
          :rules="forgotRules"
          class="dialog-form"
          @keyup.enter="handleForgot"
        >
          <el-form-item prop="username">
            <div class="custom-field">
              <label class="field-label">用户名</label>
              <el-input v-model="forgotForm.username" placeholder="请输入用户名" size="large" />
            </div>
          </el-form-item>

          <el-form-item prop="email">
            <div class="custom-field">
              <label class="field-label">注册邮箱</label>
              <el-input v-model="forgotForm.email" placeholder="请输入注册时的邮箱地址" size="large" />
            </div>
          </el-form-item>

          <el-form-item class="form-actions">
            <el-button class="btn-cancel" size="large" @click="showForgotDialog = false">取消</el-button>
            <el-button class="btn-primary" size="large" :loading="forgotLoading" @click="handleForgot">
              {{ forgotLoading ? '发送中...' : '发送重置邮件' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const formRef = ref(null)
const canvasRef = ref(null)
const loading = ref(false)

// 注册
const showRegisterDialog = ref(false)
const registerFormRef = ref(null)
const registerLoading = ref(false)
const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      registerLoading.value = true
      try {
        // TODO: 调用注册API
        await new Promise(resolve => setTimeout(resolve, 1000))
        ElMessage.success('注册成功，请登录')
        showRegisterDialog.value = false
        registerForm.username = ''
        registerForm.password = ''
        registerForm.confirmPassword = ''
      } catch (error) {
        console.error('注册失败', error)
      } finally {
        registerLoading.value = false
      }
    }
  })
}

// 忘记密码
const showForgotDialog = ref(false)
const forgotFormRef = ref(null)
const forgotLoading = ref(false)
const forgotForm = reactive({
  username: '',
  email: ''
})

const forgotRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

const handleForgot = async () => {
  if (!forgotFormRef.value) return
  
  await forgotFormRef.value.validate(async (valid) => {
    if (valid) {
      forgotLoading.value = true
      try {
        // TODO: 调用忘记密码API
        await new Promise(resolve => setTimeout(resolve, 1000))
        ElMessage.success('重置邮件已发送，请查收')
        showForgotDialog.value = false
        forgotForm.username = ''
        forgotForm.email = ''
      } catch (error) {
        console.error('发送失败', error)
      } finally {
        forgotLoading.value = false
      }
    }
  })
}

// 鼠标位置
const mouse = { x: null, y: null, radius: 150 }

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await authStore.login({
          username: loginForm.username,
          password: loginForm.password
        })
        
        const redirect = route.query.redirect || '/dashboard'
        router.push(redirect)
      } catch (error) {
        console.error('登录失败', error)
      } finally {
        loading.value = false
      }
    }
  })
}

// 粒子系统
let particles = []
let animationId = null

class Particle {
  constructor(canvas) {
    this.canvas = canvas
    this.x = Math.random() * canvas.width
    this.y = Math.random() * canvas.height
    this.size = Math.random() * 2 + 0.5
    this.baseX = this.x
    this.baseY = this.y
    this.density = (Math.random() * 30) + 1
    this.vx = (Math.random() - 0.5) * 0.5
    this.vy = (Math.random() - 0.5) * 0.5
  }

  update() {
    if (mouse.x !== null) {
      let dx = mouse.x - this.x
      let dy = mouse.y - this.y
      let distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < mouse.radius) {
        let forceDirectionX = dx / distance
        let forceDirectionY = dy / distance
        let force = (mouse.radius - distance) / mouse.radius
        let directionX = forceDirectionX * force * this.density
        let directionY = forceDirectionY * force * this.density
        
        this.x -= directionX * 2
        this.y -= directionY * 2
      } else {
        if (this.x !== this.baseX) {
          let dx = this.x - this.baseX
          this.x -= dx / 20
        }
        if (this.y !== this.baseY) {
          let dy = this.y - this.baseY
          this.y -= dy / 20
        }
      }
    } else {
      this.x += this.vx
      this.y += this.vy
      
      if (this.x < 0 || this.x > this.canvas.width) this.vx *= -1
      if (this.y < 0 || this.y > this.canvas.height) this.vy *= -1
    }
  }

  draw(ctx) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.closePath()
    ctx.fill()
  }
}

function initParticles() {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  
  particles = []
  let numberOfParticles = (canvas.width * canvas.height) / 9000
  
  for (let i = 0; i < numberOfParticles; i++) {
    particles.push(new Particle(canvas))
  }
  
  connect(ctx)
}

function connect(ctx) {
  let opacityValue = 1
  for (let a = 0; a < particles.length; a++) {
    for (let b = a; b < particles.length; b++) {
      let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x))
        + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y))
      
      if (distance < (canvasRef.value.width / 7) * (canvasRef.value.height / 7)) {
        opacityValue = 1 - (distance / 20000)
        ctx.strokeStyle = 'rgba(255, 255, 255,' + opacityValue * 0.2 + ')'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(particles[a].x, particles[a].y)
        ctx.lineTo(particles[b].x, particles[b].y)
        ctx.stroke()
      }
    }
  }
}

function animate() {
  const canvas = canvasRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  for (let i = 0; i < particles.length; i++) {
    particles[i].update()
    particles[i].draw(ctx)
  }
  connect(ctx)
  
  animationId = requestAnimationFrame(animate)
}

function handleMouseMove(event) {
  mouse.x = event.x
  mouse.y = event.y
}

function handleMouseLeave() {
  mouse.x = null
  mouse.y = null
}

function handleResize() {
  initParticles()
}

onMounted(() => {
  initParticles()
  animate()
  
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseout', handleMouseLeave)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseout', handleMouseLeave)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: #0a0a0a;
}

.particle-canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.login-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
  z-index: 2;
  pointer-events: none;
}

.login-card {
  width: 420px;
  padding: 48px 40px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  z-index: 3;
  backdrop-filter: blur(10px);
  transform: translateY(0);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 
      0 24px 68px rgba(0, 0, 0, 0.35),
      0 0 0 1px rgba(255, 255, 255, 0.15);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-logo {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.logo-icon {
  width: 64px;
  height: 64px;
  background: #000;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  
  .logo-text {
    font-size: 32px;
    font-weight: 700;
    color: #fff;
    font-family: 'Georgia', serif;
  }
}

.login-title {
  font-size: 24px;
  color: #000;
  margin: 0 0 8px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.login-subtitle {
  font-size: 11px;
  color: #999;
  margin: 0;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.login-form {
  .el-form-item {
    margin-bottom: 20px;
  }
  
  :deep(.el-input__wrapper) {
    background: #f5f5f5;
    box-shadow: none;
    border: 1px solid transparent;
    transition: all 0.3s ease;
    
    &:hover {
      background: #f0f0f0;
    }
    
    &.is-focus {
      background: #fff;
      border-color: #000;
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
    }
  }
  
  :deep(.el-input__inner) {
    color: #000;
    font-size: 14px;
    
    &::placeholder {
      color: #999;
    }
  }
}

.input-icon {
  width: 18px;
  height: 18px;
  color: #666;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 15px;
  font-weight: 500;
  background: #000;
  border: none;
  border-radius: 8px;
  color: #fff;
  letter-spacing: 2px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #333;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.is-loading {
    opacity: 0.8;
  }
}

.login-links {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 16px;
  gap: 8px;
}

.link-item {
  color: #666;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s ease;
  user-select: none;
  
  &:hover {
    color: #000;
  }
}

.link-divider {
  color: #ddd;
  font-size: 12px;
}

// ===== 对话框全局样式（非scoped） =====
</style>

<style lang="scss">
// 对话框遮罩层
.el-overlay {
  backdrop-filter: blur(8px);
}

// 黑色主题对话框
.dark-dialog {
  .el-dialog {
    background: #141414;
    border-radius: 20px;
    box-shadow: 
      0 24px 80px rgba(0, 0, 0, 0.6),
      0 0 0 1px rgba(255, 255, 255, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    padding: 0;
    overflow: hidden;
    max-width: 90vw;
  }

  .el-dialog__header {
    display: none;
  }

  .el-dialog__body {
    padding: 0;
    background: #141414;
  }

  .el-dialog__footer {
    display: none;
  }
}

// 对话框内容区
.dialog-content {
  position: relative;
  padding: 40px 36px 32px;
}

.dialog-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  color: #888;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.dialog-header {
  text-align: center;
  margin-bottom: 32px;
}

.dialog-icon-wrap {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    color: #fff;
  }
}

.register-icon {
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.forgot-icon {
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.dialog-title {
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px;
  letter-spacing: -0.3px;
}

.dialog-subtitle {
  font-size: 13px;
  color: #666;
  margin: 0;
}

// 表单样式
.dialog-form {
  .el-form-item {
    margin-bottom: 20px;
    
    &.form-actions {
      margin-top: 28px;
      margin-bottom: 0;
    }
  }
  
  .el-form-item__content {
    display: block;
  }
}

.custom-field {
  .field-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #999;
    margin-bottom: 8px;
    letter-spacing: 0.3px;
  }
  
  .el-input__wrapper {
    background: #1e1e1e;
    box-shadow: none;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 10px 14px;
    transition: all 0.25s ease;
    
    &:hover {
      background: #252525;
      border-color: rgba(255, 255, 255, 0.15);
    }
    
    &.is-focus {
      background: #252525;
      border-color: rgba(255, 255, 255, 0.4);
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.08);
    }
  }
  
  .el-input__inner {
    color: #fff;
    font-size: 14px;
    
    &::placeholder {
      color: #555;
    }
  }
  
  .el-input__password {
    color: #888;
    
    &:hover {
      color: #bbb;
    }
  }
}

// 错误状态
.el-form-item.is-error {
  .custom-field {
    .el-input__wrapper {
      border-color: #ff4d4f;
      
      &.is-focus {
        box-shadow: 0 0 0 3px rgba(255, 77, 79, 0.15);
      }
    }
  }
  
  .el-form-item__error {
    color: #ff4d4f;
    font-size: 12px;
    margin-top: 6px;
  }
}

// 按钮
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 28px;
  
  .el-button {
    flex: 1;
    height: 46px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.25s ease;
  }
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #bbb;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: #fff;
  }
}

.btn-primary {
  background: #fff;
  border: none;
  color: #000;
  letter-spacing: 1px;
  
  &:hover {
    background: #e6e6e6;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.is-loading {
    opacity: 0.85;
  }
}
</style>
