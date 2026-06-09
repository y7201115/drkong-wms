import { defineStore } from 'pinia'
import { login as loginApi, getUserInfo } from '@/api/auth'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    remember: localStorage.getItem('remember') === 'true' || false
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userName: (state) => state.user?.name || '',
    userRole: (state) => state.user?.role || ''
  },

  actions: {
    async login({ username, password, remember = false }) {
      try {
        const res = await loginApi({ username, password })
        this.token = res.token
        this.user = res.user
        this.remember = remember
        
        localStorage.setItem('token', res.token)
        localStorage.setItem('user', JSON.stringify(res.user))
        localStorage.setItem('remember', remember)
        
        ElMessage.success('登录成功')
        return res
      } catch (error) {
        ElMessage.error(error.message || '登录失败')
        throw error
      }
    },

    async fetchUserInfo() {
      try {
        const res = await getUserInfo()
        this.user = res
        localStorage.setItem('user', JSON.stringify(res))
      } catch (error) {
        console.error('获取用户信息失败', error)
      }
    },

    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})
