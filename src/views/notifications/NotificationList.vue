<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Delete, Message, Tickets, Bell, Warning, Money, User, Odometer, InfoFilled } from '@element-plus/icons-vue'

// 通知列表
const notifications = ref([
  { id: 1, title: '系统更新通知', content: '系统将于今晚22:00-23:00进行维护更新，请做好相关工作安排，在此期间系统功能将暂时不可用。', time: '2023-06-10 15:30:00', type: 'system', read: false },
  { id: 2, title: '账单生成提醒', content: '您有3个新账单已生成，请及时查看并处理相关缴费事宜，以免影响用户用水。', time: '2023-06-09 10:15:00', type: 'bill', read: false },
  { id: 3, title: '欠费通知', content: '有5个用户账户处于欠费状态，需要发送通知提醒用户及时缴费，以免影响正常用水。', time: '2023-06-08 14:20:00', type: 'reminder', read: true },
  { id: 4, title: '流量异常警告', content: '检测到部分水表数据异常，请及时检查相关水表设备和记录数据，确保计量准确。', time: '2023-06-07 09:45:00', type: 'warning', read: true },
  { id: 5, title: '系统公告', content: '新版本水务管理系统已上线，新增了多项功能，包括数据分析报表、用户行为跟踪和自动对账等功能，欢迎使用。', time: '2023-06-06 11:00:00', type: 'system', read: true },
  { id: 6, title: '缴费成功通知', content: '用户李明（账户ID：10023）已成功缴纳水费￥256.80，交易流水号：PAY20230605001。', time: '2023-06-05 16:40:00', type: 'payment', read: true },
  { id: 7, title: '新用户注册', content: '新用户王芳已成功注册系统，用户ID：812，请及时审核用户信息并分配相关账户权限。', time: '2023-06-04 13:50:00', type: 'user', read: true },
  { id: 8, title: '水表安装完成', content: '用户张小刚（用户ID：789）的新水表已安装完成，水表编号：WM20230603001，初始读数：0。', time: '2023-06-03 11:30:00', type: 'meter', read: true }
])

// 通知类型
const notificationTypes = [
  { value: '', label: '全部通知' },
  { value: 'system', label: '系统通知' },
  { value: 'bill', label: '账单通知' },
  { value: 'reminder', label: '欠费通知' },
  { value: 'warning', label: '异常警告' },
  { value: 'payment', label: '缴费通知' },
  { value: 'user', label: '用户通知' },
  { value: 'meter', label: '水表通知' }
]

// 查询参数
const queryParams = reactive({
  type: '',
  readStatus: '',
  page: 1,
  pageSize: 10
})

// 计算总数
const total = ref(notifications.value.length)

// 标记为已读
const markAsRead = (notification) => {
  notification.read = true
  ElMessage.success('已标记为已读')
}

// 标记为未读
const markAsUnread = (notification) => {
  notification.read = false
  ElMessage.success('已标记为未读')
}

// 标记全部为已读
const markAllAsRead = () => {
  notifications.value.forEach(item => {
    item.read = true
  })
  ElMessage.success('已将全部通知标记为已读')
}

// 删除通知
const deleteNotification = (id) => {
  notifications.value = notifications.value.filter(item => item.id !== id)
  ElMessage.success('删除成功')
}

// 清空所有通知
const clearAllNotifications = () => {
  notifications.value = []
  total.value = 0
  ElMessage.success('已清空所有通知')
}

// 过滤通知
const filteredNotifications = computed(() => {
  let result = [...notifications.value]
  
  if (queryParams.type) {
    result = result.filter(item => item.type === queryParams.type)
  }
  
  if (queryParams.readStatus === 'read') {
    result = result.filter(item => item.read)
  } else if (queryParams.readStatus === 'unread') {
    result = result.filter(item => !item.read)
  }
  
  return result
})

// 查询
const handleQuery = () => {
  queryParams.page = 1
}

// 重置
const handleReset = () => {
  queryParams.type = ''
  queryParams.readStatus = ''
  queryParams.page = 1
}

// 分页事件
const handleSizeChange = (size) => {
  queryParams.pageSize = size
}

const handleCurrentChange = (current) => {
  queryParams.page = current
}

onMounted(() => {
  // 此处可以请求后端通知数据
  console.log('通知页面已加载')
})
</script>

<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="hover">
      <el-form :model="queryParams" ref="queryForm" :inline="true" class="search-form">
        <el-form-item label="通知类型" prop="type">
          <el-select v-model="queryParams.type" placeholder="选择通知类型" clearable style="width: 100%">
            <el-option
              v-for="item in notificationTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="阅读状态" prop="readStatus">
          <el-select v-model="queryParams.readStatus" placeholder="选择阅读状态" clearable style="width: 100%">
            <el-option label="全部" value="" />
            <el-option label="已读" value="read" />
            <el-option label="未读" value="unread" />
          </el-select>
        </el-form-item>
        <div class="search-buttons">
          <el-button type="primary" @click="handleQuery" icon="Search">查询</el-button>
          <el-button @click="handleReset" icon="Refresh">重置</el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 通知列表 -->
    <el-card class="notification-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">系统通知</span>
          <div class="header-buttons">
            <el-button type="success" @click="markAllAsRead" :disabled="!notifications.some(item => !item.read)">
              <el-icon><Check /></el-icon> 全部标为已读
            </el-button>
            <el-button type="danger" @click="clearAllNotifications" :disabled="notifications.length === 0">
              <el-icon><Delete /></el-icon> 清空所有通知
            </el-button>
          </div>
        </div>
      </template>

      <div class="notification-list">
        <el-empty v-if="filteredNotifications.length === 0" description="暂无通知" />
        
        <div v-for="notification in filteredNotifications" :key="notification.id" class="notification-item" :class="{ 'notification-read': notification.read }">
          <div class="notification-icon">
            <el-icon v-if="notification.type === 'system'" color="#409EFF"><Message /></el-icon>
            <el-icon v-else-if="notification.type === 'bill'" color="#67C23A"><Tickets /></el-icon>
            <el-icon v-else-if="notification.type === 'reminder'" color="#E6A23C"><Bell /></el-icon>
            <el-icon v-else-if="notification.type === 'warning'" color="#F56C6C"><Warning /></el-icon>
            <el-icon v-else-if="notification.type === 'payment'" color="#67C23A"><Money /></el-icon>
            <el-icon v-else-if="notification.type === 'user'" color="#409EFF"><User /></el-icon>
            <el-icon v-else-if="notification.type === 'meter'" color="#909399"><Odometer /></el-icon>
            <el-icon v-else color="#909399"><InfoFilled /></el-icon>
          </div>
          
          <div class="notification-content">
            <div class="notification-header">
              <h3 class="notification-title">{{ notification.title }}</h3>
              <span class="notification-time">{{ notification.time }}</span>
            </div>
            <div class="notification-body">
              {{ notification.content }}
            </div>
            <div class="notification-footer">
              <el-tag 
                :type="notification.type === 'warning' ? 'danger' : notification.type === 'system' ? 'primary' : notification.type === 'bill' ? 'success' : 'info'" 
                size="small" 
                effect="light"
              >
                {{ notificationTypes.find(t => t.value === notification.type)?.label || '其他通知' }}
              </el-tag>
              <div class="notification-actions">
                <el-button 
                  v-if="!notification.read" 
                  type="primary" 
                  link 
                  size="small" 
                  @click="markAsRead(notification)"
                >
                  标为已读
                </el-button>
                <el-button 
                  v-else 
                  type="info" 
                  link 
                  size="small" 
                  @click="markAsUnread(notification)"
                >
                  标为未读
                </el-button>
                <el-button 
                  type="danger" 
                  link 
                  size="small" 
                  @click="deleteNotification(notification.id)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </div>
          
          <div class="notification-status" v-if="!notification.read"></div>
        </div>
      </div>
      
      <!-- 分页区域 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredNotifications.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.app-container {
  padding: 20px;
  height: calc(100% - 40px);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-card {
  flex-shrink: 0;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
  flex: 1 1 230px;
  max-width: 350px;
}

.search-buttons {
  display: flex;
  gap: 10px;
  align-self: flex-end;
}

.notification-card {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-buttons {
  display: flex;
  gap: 10px;
}

.notification-list {
  padding: 10px 0;
  overflow-y: auto;
  flex: 1;
}

.notification-item {
  display: flex;
  margin-bottom: 15px;
  padding: 15px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  position: relative;
  border-left: 4px solid #409EFF;
}

.notification-item:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.notification-read {
  opacity: 0.8;
  border-left-color: #909399;
  background-color: #f9f9f9;
}

.notification-icon {
  margin-right: 15px;
  padding-top: 5px;
  font-size: 24px;
}

.notification-content {
  flex: 1;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.notification-title {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-body {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 15px;
}

.notification-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-actions {
  display: flex;
  gap: 10px;
}

.notification-status {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #f56c6c;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .app-container {
    padding: 10px;
  }
  
  .search-form {
    flex-direction: column;
  }
  
  .search-form :deep(.el-form-item) {
    max-width: 100%;
  }
  
  .search-buttons {
    width: 100%;
    justify-content: flex-end;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-buttons {
    width: 100%;
    justify-content: space-between;
  }
  
  .notification-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .notification-time {
    margin-top: 5px;
  }
  
  .notification-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .notification-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style> 