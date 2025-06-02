import { createRouter, createWebHistory } from 'vue-router'
import { getUserRole, isAdmin, isUser, UserRoles } from '@/utils/permission'
import { ElMessage } from 'element-plus'

// 定义路由
const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/Login.vue'),
    meta: { title: '登录', noAuth: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPassword.vue'), // 修正路径
    meta: { title: '找回密码', noAuth: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/dashboard/Dashboard.vue'),
    meta: { title: '首页信息', requiredRole: UserRoles.ADMIN }
  },
  {
    path: '/user-dashboard',
    name: 'UserDashboard',
    component: () => import('../views/dashboard/UserDashboard.vue'),
    meta: { title: '我的水务', requiredRole: UserRoles.USER }
  },
  {
    path: '/users',
    name: 'Users',
    component: () => import('../views/users/UserList.vue'),
    meta: { title: '用户信息', requiredRole: UserRoles.ADMIN }
  },
  {
    path: '/users/:id',
    name: 'UserDetail',
    component: () => import('../views/users/UserDetail.vue'),
    meta: { title: '用户详情', requiredRole: UserRoles.ADMIN }
  },
  {
    path: '/water-meters',
    name: 'WaterMeters',
    component: () => import('../views/waterMeters/WaterMeterList.vue'),
    meta: { title: '水表信息' }
  },
  {
    path: '/water-meters/:id',
    name: 'WaterMeterDetail',
    component: () => import('../views/waterMeters/WaterMeterDetail.vue'),
    meta: { title: '水表详情' }
  },
  {
    path: '/water-bills',
    name: 'WaterBills',
    component: () => import('../views/waterBills/WaterBillList.vue'),
    meta: { title: '水费账单' }
  },
  {
    path: '/payment-records',
    name: 'PaymentRecords',
    component: () => import('../views/payments/PaymentRecords.vue'),
    meta: { title: '缴费记录' }
  },
  {
    path: '/reminder-notices',
    name: 'ReminderNotices',
    component: () => import('../views/notices/ReminderNoticeList.vue'),
    meta: { title: '欠费通知', requiredRole: UserRoles.ADMIN }
  },
  {
    path: '/accounts',
    name: 'Accounts',
    component: () => import('../views/accounts/AccountList.vue'),
    meta: { title: '账户信息', requiredRole: UserRoles.ADMIN }
  },
  {
    path: '/my-accounts',
    name: 'UserAccounts',
    component: () => import('../views/accounts/UserAccountList.vue'),
    meta: { title: '我的关联账户', requiredRole: UserRoles.USER }
  },
  {
    path: '/accounts/:id',
    name: 'AccountDetail',
    component: () => import('../views/accounts/AccountDetail.vue'),
    meta: { title: '账户详情' }
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: () => import('../views/profile/UserProfile.vue'),
    meta: { title: '个人中心' }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('../views/notifications/NotificationList.vue'),
    meta: { title: '系统通知' }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由前置守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `水务管理系统 - ${to.meta.title}` : '水务管理系统'
  
  // 检查是否需要登录权限
  const token = localStorage.getItem('token')
  if (!to.meta.noAuth && !token) {
    // 如果没有登录且该页面需要登录，则重定向到登录页
    ElMessage.warning('请先登录')
    next('/login')
    return
  }
  
  // 检查路由权限
  if (to.meta.requiredRole && token) {
    const userRole = getUserRole()
    
    // 管理员可以访问所有页面
    if (userRole === UserRoles.ADMIN) {
      next()
      return
    }

    // 普通用户访问需要管理员权限的页面，重定向到用户首页
    if (to.meta.requiredRole === UserRoles.ADMIN && userRole === UserRoles.USER) {
      ElMessage.warning('权限不足，无法访问该页面')
      next('/user-dashboard')
      return
    }
    
    // 管理员访问用户页面，重定向到管理员首页
    if (to.meta.requiredRole === UserRoles.USER && userRole === UserRoles.ADMIN) {
      next('/dashboard')
      return
    }
  }
  
  next()
})

export default router