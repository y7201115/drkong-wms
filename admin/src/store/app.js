import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true' || false,
    pageTitle: '仪表盘'
  }),

  getters: {
    sidebarWidth: (state) => state.sidebarCollapsed ? '64px' : '220px'
  },

  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed)
    },

    setPageTitle(title) {
      this.pageTitle = title
    }
  }
})
