import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/',
    component: () => import('@/components/Layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' }
      },
      {
        path: 'inventory',
        name: 'Inventory',
        redirect: '/inventory/list',
        meta: { title: '库存管理', icon: 'Box' },
        children: [
          {
            path: 'list',
            name: 'InventoryList',
            component: () => import('@/views/Inventory/List.vue'),
            meta: { title: '库存列表' }
          },
          {
            path: 'adjust',
            name: 'InventoryAdjust',
            component: () => import('@/views/Inventory/Adjust.vue'),
            meta: { title: '库存调整' }
          }
        ]
      },
      {
        path: 'stock-records',
        name: 'StockRecords',
        redirect: '/stock-records/list',
        meta: { title: '出入库管理', icon: 'Tickets' },
        children: [
          {
            path: 'list',
            name: 'StockRecordsList',
            component: () => import('@/views/StockRecords/List.vue'),
            meta: { title: '出入库记录' }
          },
          {
            path: 'batch-scan',
            name: 'BatchScan',
            component: () => import('@/views/StockRecords/BatchScan.vue'),
            meta: { title: '批量扫码' }
          }
        ]
      },
      {
        path: 'returns',
        name: 'Returns',
        redirect: '/returns/list',
        meta: { title: '退件管理', icon: 'RefreshLeft' },
        children: [
          {
            path: 'list',
            name: 'ReturnsList',
            component: () => import('@/views/Returns/List.vue'),
            meta: { title: '退件列表' }
          },
          {
            path: 'create',
            name: 'ReturnsCreate',
            component: () => import('@/views/Returns/Create.vue'),
            meta: { title: '退件登记' }
          },
          {
            path: 'detail/:id',
            name: 'ReturnsDetail',
            component: () => import('@/views/Returns/Detail.vue'),
            meta: { title: '退件详情', hidden: true }
          }
        ]
      },
      {
        path: 'reports',
        name: 'Reports',
        redirect: '/reports/inventory',
        meta: { title: '报表统计', icon: 'DataAnalysis' },
        children: [
          {
            path: 'inventory',
            name: 'InventoryReport',
            component: () => import('@/views/Reports/Inventory.vue'),
            meta: { title: '库存报表' }
          },
          {
            path: 'returns',
            name: 'ReturnsReport',
            component: () => import('@/views/Reports/Returns.vue'),
            meta: { title: '退件报表' }
          }
        ]
      },
      {
        path: 'erp',
        name: 'ERP',
        redirect: '/erp/dashboard',
        meta: { title: '快团团ERP', icon: 'Shop' },
        children: [
          {
            path: 'dashboard',
            name: 'ERPDashboard',
            component: () => import('@/views/ERP/Dashboard.vue'),
            meta: { title: 'ERP仪表盘' }
          },
          {
            path: 'orders',
            name: 'ERPOrders',
            component: () => import('@/views/ERP/Orders.vue'),
            meta: { title: '订单管理' }
          },
          {
            path: 'products',
            name: 'ERPProducts',
            component: () => import('@/views/ERP/Products.vue'),
            meta: { title: '商品管理' }
          },
          {
            path: 'logistics',
            name: 'ERPLogistics',
            component: () => import('@/views/ERP/Logistics.vue'),
            meta: { title: '物流管理' }
          },
          {
            path: 'sku',
            name: 'ERPSKU',
            component: () => import('@/views/ERP/SKUMgmt.vue'),
            meta: { title: 'SKU管理' }
          },
          {
            path: 'refund',
            name: 'ERPRefund',
            component: () => import('@/views/ERP/Refund.vue'),
            meta: { title: '售后退款' }
          },
          {
            path: 'settings',
            name: 'ERPSettings',
            component: () => import('@/views/ERP/Settings.vue'),
            meta: { title: 'API设置' }
          }
        ]
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 江博士童鞋仓库管理系统`
  }
  
  // 检查是否需要登录
  if (to.meta.public) {
    next()
  } else {
    if (authStore.isLoggedIn) {
      next()
    } else {
      next({ path: '/login', query: { redirect: to.fullPath } })
    }
  }
})

export default router
