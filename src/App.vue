<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowDown, Bell, Message, SwitchButton, User, Fold, Expand } from '@element-plus/icons-vue'
import { ElMessage, ElBadge } from 'element-plus'
import { getUserRole, UserRoles, isAdmin } from '@/utils/permission'

const router = useRouter()
const route = useRoute()
const activeMenu = ref(route.path)
const isCollapse = ref(false)
const notificationCount = ref(5)

// 判断当前是否为登录页面或找回密码页面
const isLoginPage = computed(() => {
  return route.path === '/login' || route.path === '/forgot-password' || route.path === '/register'
})

// 判断用户角色
const userRole = computed(() => getUserRole())
const isAdminUser = computed(() => userRole.value === UserRoles.ADMIN)

// 监听路由变化，更新激活的菜单项
watch(() => route.path, (newPath) => {
  // 对于详情页面，保持其父级菜单激活
  if (newPath.includes('/users/')) {
    activeMenu.value = '/users'
  } else if (newPath.includes('/water-meters/')) {
    activeMenu.value = '/water-meters'
  } else if (newPath.includes('/accounts/')) {
    activeMenu.value = '/accounts'
  } else {
    activeMenu.value = newPath
  }
})

// 获取用户身份信息
const accountIdentity = computed(() => {
  return localStorage.getItem('accountIdentity') || '管理员'
})

// 获取用户账户ID
const currentAccountId = computed(() => {
  return localStorage.getItem('accountId') || ''
})

// 切换侧边栏折叠状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

// 进入个人中心
const goToProfile = () => {
  router.push('/profile')
}

// 进入系统通知页面
const goToNotifications = () => {
  router.push('/notifications')
}

// 退出登录处理
const handleLogout = () => {
  // 清除本地存储的所有登录信息
  localStorage.removeItem('token')
  localStorage.removeItem('accountId')
  localStorage.removeItem('accountIdentity')
  localStorage.removeItem('rememberLogin')
  localStorage.removeItem('userId')
  localStorage.removeItem('userRole')
  
  ElMessage.success('已退出登录')
  
  // 跳转到登录页
  router.push('/login')
}

// 根据用户角色获取菜单项
const getMenuItems = () => {
  // 管理员菜单
  if (isAdminUser.value) {
    return [
      {
        index: '1',
        title: '首页',
        icon: 'HomeFilled',
        children: [
          { index: '/dashboard', title: '首页信息' }
        ]
      },
      {
        index: '2',
        title: '用户管理',
        icon: 'UserFilled',
        children: [
          { index: '/users', title: '用户信息' },
          { index: '/accounts', title: '账户信息' }
        ]
      },
      {
        index: '3',
        title: '水表管理',
        icon: 'Odometer',
        children: [
          { index: '/water-meters', title: '水表信息' }
        ]
      },
      {
        index: '4',
        title: '缴费管理',
        icon: 'Money',
        children: [
          { index: '/water-bills', title: '水费账单' },
          { index: '/payment-records', title: '缴费记录' },
          { index: '/reminder-notices', title: '欠费通知' }
        ]
      }
    ]
  } 
  // 普通用户菜单
  else {
    return [
      {
        index: '1',
        title: '首页',
        icon: 'HomeFilled',
        children: [
          { index: '/user-dashboard', title: '我的水务' }
        ]
      },
      {
        index: '2',
        title: '我的水表',
        icon: 'Odometer',
        children: [
          { index: '/water-meters', title: '水表信息' }
        ]
      },
      {
        index: '3',
        title: '我的账户',
        icon: 'CreditCard',
        children: [
          { index: '/my-accounts', title: '关联账户' }
        ]
      },
      {
        index: '4',
        title: '我的账单',
        icon: 'Money',
        children: [
          { index: `/water-bills?accountId=${currentAccountId.value}`, title: '水费账单' },
          { index: `/payment-records?accountId=${currentAccountId.value}`, title: '缴费记录' }
        ]
      }
    ]
  }
}

// 根据用户角色动态生成菜单
const menuItems = computed(() => getMenuItems())

// 模拟系统通知
const systemNotifications = ref([
  { id: 1, title: '系统更新通知', content: '系统将于今晚22:00-23:00进行维护更新', time: '10分钟前', read: false },
  { id: 2, title: '账单生成提醒', content: '您有3个新账单已生成，请及时查看', time: '30分钟前', read: false },
  { id: 3, title: '欠费通知', content: '有5个用户账户处于欠费状态，需要发送通知', time: '1小时前', read: false },
  { id: 4, title: '流量异常警告', content: '检测到部分水表数据异常，请检查', time: '2小时前', read: false },
  { id: 5, title: '系统公告', content: '新版本水务管理系统已上线，新增多项功能', time: '1天前', read: false }
])

// 标记为已读
const markAsRead = (notification) => {
  notification.read = true
  notificationCount.value = systemNotifications.value.filter(item => !item.read).length
}

// 标记所有为已读
const markAllAsRead = () => {
  systemNotifications.value.forEach(notification => {
    notification.read = true
  })
  notificationCount.value = 0
}

// 显示/隐藏通知面板
const showNotificationPanel = ref(false)

// 切换通知面板显示状态
const toggleNotificationPanel = () => {
  showNotificationPanel.value = !showNotificationPanel.value
}

// 关闭通知面板
const closeNotificationPanel = () => {
  showNotificationPanel.value = false
}

// 监听点击事件，点击面板外部时关闭面板
const handleClickOutside = (event) => {
  const panel = document.querySelector('.notification-panel')
  const bell = document.querySelector('.notification-bell')
  if (panel && bell && !panel.contains(event.target) && !bell.contains(event.target)) {
    closeNotificationPanel()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // 计算未读通知数量
  notificationCount.value = systemNotifications.value.filter(item => !item.read).length
})
</script>

<template>
  <!-- 登录页使用独立布局，不显示侧边栏和顶部导航 -->
  <router-view v-if="isLoginPage" />
  
  <!-- 非登录页使用常规布局 -->
  <el-container v-else class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo-container">
        <img alt="水务管理系统Logo" class="logo" src="/logo.png" />
        <h2 v-if="!isCollapse">水务管理系统</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="side-menu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        :collapse="isCollapse"
      >
        <template v-for="(item, index) in menuItems" :key="index">
          <el-sub-menu :index="item.index">
            <template #title>
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.title }}</span>
            </template>
            <el-menu-item 
              v-for="(subItem, subIndex) in item.children" 
              :key="subIndex" 
              :index="subItem.index"
            >
              {{ subItem.title }}
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>
    
    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部通知栏和导航 -->
      <el-header>
        <div class="header-container">
          <div class="header-left">
            <el-button 
              type="primary" 
              text
              @click="toggleCollapse" 
              class="toggle-button"
            >
              <el-icon v-if="isCollapse"><Expand /></el-icon>
              <el-icon v-else><Fold /></el-icon>
            </el-button>
            <el-breadcrumb separator="/">
              <el-breadcrumb-item>首页</el-breadcrumb-item>
              <el-breadcrumb-item>{{ activeMenu }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <div class="header-right">
            <!-- 通知图标 -->
            <div class="notification-bell" @click="goToNotifications">
              <el-badge :value="notificationCount" :hidden="notificationCount === 0" class="badge-item">
                <el-icon size="22"><Bell /></el-icon>
              </el-badge>
            </div>
            
            <!-- 用户信息 -->
            <div class="user-info">
              <el-dropdown>
                <span class="el-dropdown-link">
                  <el-avatar :size="32" icon="UserFilled" class="user-avatar" />
                  <span class="user-name">{{ accountIdentity }}</span>
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="goToProfile">
                      <el-icon><User /></el-icon> 个人中心
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleLogout">
                      <el-icon><SwitchButton /></el-icon> 退出登录
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
        
        <!-- 通知面板 -->
        <div v-if="showNotificationPanel" class="notification-panel">
          <div class="notification-header">
            <h3>系统通知</h3>
            <el-button type="primary" text @click="markAllAsRead" :disabled="notificationCount === 0">
              全部标为已读
            </el-button>
          </div>
          <div class="notification-list">
            <div 
              v-for="notification in systemNotifications" 
              :key="notification.id" 
              class="notification-item"
              :class="{ 'notification-read': notification.read }"
              @click="markAsRead(notification)"
            >
              <div class="notification-icon">
                <el-icon :size="20"><Message /></el-icon>
              </div>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-text">{{ notification.content }}</div>
                <div class="notification-time">{{ notification.time }}</div>
              </div>
              <div class="notification-status" v-if="!notification.read"></div>
            </div>
            <div v-if="systemNotifications.length === 0" class="empty-notification">
              暂无通知
            </div>
          </div>
          <div class="notification-footer">
            <el-button type="primary" link @click="goToNotifications">查看所有通知</el-button>
          </div>
    </div>
      </el-header>
      
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100%;
}

.sidebar {
  transition: width .3s;
  background-color: #304156;
  overflow: hidden;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  background: #2b2f3a;
  color: #fff;
  padding: 0 10px;
  overflow: hidden;
}

.logo {
  width: 32px;
  height: 32px;
  margin-right: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.logo-container h2 {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.side-menu {
  border-right: none;
  height: calc(100% - 60px);
}

.el-header {
  background-color: #2196f3;
  color: white;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 0 20px;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.header-left {
  display: flex;
  align-items: center;
}

.toggle-button {
  margin-right: 10px;
  color: white;
  font-size: 20px;
}

.header-left :deep(.el-breadcrumb__item) {
  color: rgba(255, 255, 255, 0.8);
}

.header-left :deep(.el-breadcrumb__inner) {
  color: rgba(255, 255, 255, 0.8);
  font-weight: normal;
}

.header-left :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #ffffff;
  font-weight: bold;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-bell {
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.notification-bell:hover {
  background: rgba(255, 255, 255, 0.2);
}

.badge-item :deep(.el-badge__content) {
  background-color: #f56c6c;
  color: white;
  border: none;
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0 8px;
  border-radius: 20px;
  transition: all 0.3s;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.2);
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
}

.user-avatar {
  background: rgba(255, 255, 255, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.6);
}

.user-name {
  margin: 0 4px;
  font-weight: 500;
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow: auto;
}

/* 通知面板样式 */
.notification-panel {
  position: absolute;
  top: 60px;
  right: 120px;
  width: 380px;
  max-height: 500px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.notification-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.notification-list {
  overflow-y: auto;
  max-height: 350px;
  padding: 0;
}

.notification-item {
  display: flex;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-read {
  background-color: #f9f9f9;
  opacity: 0.8;
}

.notification-icon {
  margin-right: 15px;
    display: flex;
  align-items: center;
  justify-content: center;
  color: #409EFF;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 5px;
  font-size: 14px;
}

.notification-text {
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-time {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}

.notification-status {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #f56c6c;
}

.notification-footer {
  padding: 10px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.empty-notification {
  padding: 30px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .notification-panel {
    width: calc(100% - 20px);
    right: 10px;
    max-height: 450px;
  }
  
  .header-container {
    padding: 0 10px;
  }
  
  .user-name {
    display: none;
  }
  
  .el-dropdown-link {
    gap: 5px;
  }
}
</style>