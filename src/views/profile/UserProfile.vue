<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { getUserById } from '@/api/user'
import { getAccountById, updateAccountPassword, updateAccount, getAccountsByPage } from '@/api/account'
import { getWaterBillsByPage } from '@/api/waterBill'
import { getWaterMetersByPage } from '@/api/waterMeter'
import { ElMessage } from 'element-plus'

// 获取当前登录用户的账户ID
const currentAccountId = computed(() => localStorage.getItem('accountId') || '')

// 用户和账户数据
const userInfo = ref({
  userId: '',
  userName: '',
  userType: '',
  contactInfo: '',
  address: ''
})

const accountInfo = ref({
  accountId: '',
  account: '',
  accountStatus: '',
  balance: 0,
  userId: ''
})

// 统计数据
const statisticsData = ref({
  unpaidBillsCount: 0,
  waterMetersCount: 0,
  linkedAccountsCount: 0, // 初始值设为0，而不是硬编码的3
  unreadNotificationsCount: 5 // 通知数量暂时使用静态数据
})

// 加载状态
const statisticsLoading = ref(false)

// 修改密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 充值对话框和表单
const rechargeDialogVisible = ref(false)
const rechargeForm = reactive({
  amount: 0,
  paymentMethod: '微信支付'
})

const userLoading = ref(false)
const accountLoading = ref(false)
const rechargeLoading = ref(false)
const activeTab = ref('basic')

// 获取当前登录用户的信息
const loadUserProfile = async () => {
  if (!currentAccountId.value) {
    ElMessage.warning('未找到账户ID，请重新登录')
    return
  }

  // 直接获取账户信息，避免多余请求
  await getAccountInfo()
  
  // 加载统计数据
  await loadStatisticsData()
}

// 获取账户信息
const getAccountInfo = async () => {
  if (!currentAccountId.value) {
    ElMessage.warning('未找到账户ID，请重新登录')
    return
  }

  accountLoading.value = true
  try {
    const res = await getAccountById(currentAccountId.value)
    console.log('获取账户信息响应:', res)
    
    // 适配API返回的数据结构
    if (res.data) {
      // 转换字段名为小写
      const data = res.data
      accountInfo.value = {
        accountId: data.accountId || data.AccountId || data.AccountID || '',
        account: data.account || data.Account || '',
        accountStatus: data.accountStatus || data.AccountStatus || '欠费',
        balance: data.balance || data.Balance || 0,
        userId: data.userId || data.UserId || data.UserID || ''
      }
      
      // 存储用户ID到localStorage，以便关联账户查询使用
      if (accountInfo.value.userId) {
        localStorage.setItem('userId', accountInfo.value.userId)
        console.log('已将用户ID存入localStorage:', accountInfo.value.userId)
        
        // 获取用户信息
        getUserInfo(accountInfo.value.userId)
      } else {
        console.warn('账户信息中没有找到用户ID')
      }
    }
  } catch (error) {
    console.error('获取账户信息失败', error)
    ElMessage.error('获取账户信息失败')
  } finally {
    accountLoading.value = false
  }
}

// 获取统计数据
const loadStatisticsData = async () => {
  if (!currentAccountId.value) {
    return
  }

  statisticsLoading.value = true
  try {
    // 并行加载所有统计数据
    await Promise.all([
      loadUnpaidBillsCount(),
      loadWaterMetersCount(),
      loadLinkedAccounts() // 添加加载关联账户的方法
    ])
  } catch (error) {
    console.error('加载统计数据失败', error)
  } finally {
    statisticsLoading.value = false
  }
}

// 加载未付账单数量
const loadUnpaidBillsCount = async () => {
  try {
    const params = {
      accountId: currentAccountId.value,
      billStatus: '未缴',
      page: 1,
      pageSize: 1 // 只获取总数，不需要具体数据
    }
    
    const res = await getWaterBillsByPage(params)
    console.log('获取未付账单数量响应:', res)
    
    if (res.data) {
      if (res.data.total !== undefined) {
        statisticsData.value.unpaidBillsCount = res.data.total
      } else if (Array.isArray(res.data)) {
        // 如果API直接返回数组，使用数组长度作为总数
        statisticsData.value.unpaidBillsCount = res.data.filter(bill => 
          bill.billStatus === '未缴' || bill.BillStatus === '未缴'
        ).length
      } else if (res.data.rows && Array.isArray(res.data.rows)) {
        statisticsData.value.unpaidBillsCount = res.data.total || res.data.rows.length
      }
    }
  } catch (error) {
    console.error('获取未付账单数量失败', error)
    ElMessage.error('获取未付账单数量失败')
  }
}

// 加载水表数量
const loadWaterMetersCount = async () => {
  try {
    const params = {
      accountId: currentAccountId.value,
      page: 1,
      pageSize: 1 // 只获取总数，不需要具体数据
    }
    
    const res = await getWaterMetersByPage(params)
    console.log('获取水表数量响应:', res)
    
    if (res.data) {
      if (res.data.total !== undefined) {
        statisticsData.value.waterMetersCount = res.data.total
      } else if (Array.isArray(res.data)) {
        // 如果API直接返回数组，使用数组长度作为总数
        statisticsData.value.waterMetersCount = res.data.length
      } else if (res.data.rows && Array.isArray(res.data.rows)) {
        statisticsData.value.waterMetersCount = res.data.total || res.data.rows.length
      }
    }
  } catch (error) {
    console.error('获取水表数量失败', error)
    ElMessage.error('获取水表数量失败')
  }
}

// 加载关联账户数量
const loadLinkedAccounts = async () => {
  try {
    // 从本地存储获取当前用户ID
    const userId = localStorage.getItem('userId')
    if (!userId) {
      console.error('未能获取用户ID，无法加载关联账户')
      return
    }

    // 设置查询参数
    const params = {
      userId: userId,
      page: 1,
      pageSize: 100 // 设置一个较大的值以获取所有关联账户
    }
    
    console.log('查询关联账户参数:', params)
    const res = await getAccountsByPage(params)
    console.log('关联账户响应:', res)
    
    // 根据返回格式解析数据
    if (res && res.data) {
      if (Array.isArray(res.data.rows)) {
        statisticsData.value.linkedAccountsCount = res.data.rows.length
      } else if (Array.isArray(res.data)) {
        statisticsData.value.linkedAccountsCount = res.data.length
      } else if (res.data.total !== undefined) {
        statisticsData.value.linkedAccountsCount = res.data.total
      } else {
        console.warn('未能识别的关联账户数据格式:', res)
        statisticsData.value.linkedAccountsCount = 0
      }
    } else {
      statisticsData.value.linkedAccountsCount = 0
    }
    
    console.log('关联账户数量:', statisticsData.value.linkedAccountsCount)
  } catch (error) {
    console.error('获取关联账户数量失败:', error)
    statisticsData.value.linkedAccountsCount = 0
  }
}

// 获取用户信息
const getUserInfo = async (userId) => {
  if (!userId) return

  userLoading.value = true
  try {
    const res = await getUserById(userId)
    console.log('获取用户信息响应:', res)
    
    // 适配API返回的数据结构
    if (res.data) {
      // 转换字段名为小写
      const data = res.data
      userInfo.value = {
        userId: data.userId || data.UserId || data.UserID || '',
        userName: data.userName || data.UserName || '',
        userType: data.userType || data.UserType || '',
        contactInfo: data.contactInfo || data.ContactInfo || '',
        address: data.address || data.Address || ''
      }
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
    ElMessage.error('获取用户信息失败')
  } finally {
    userLoading.value = false
  }
}

// 修改密码
const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  
  if (!currentAccountId.value) {
    ElMessage.warning('未找到账户ID，请重新登录')
    return
  }
  
  try {
    await updateAccountPassword(currentAccountId.value, {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword
    })
    ElMessage.success('密码修改成功')
    // 清空表单
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (error) {
    console.error('修改密码失败', error)
    ElMessage.error('修改密码失败')
  }
}

// 显示充值对话框
const showRechargeDialog = () => {
  rechargeForm.amount = 0
  rechargeForm.paymentMethod = '微信支付'
  rechargeDialogVisible.value = true
}

// 处理充值提交
const handleRechargeSubmit = async () => {
  if (rechargeForm.amount <= 0) {
    ElMessage.warning('充值金额必须大于0')
    return
  }

  if (!currentAccountId.value) {
    ElMessage.warning('未找到账户ID，请重新登录')
    return
  }

  rechargeLoading.value = true
  try {
    // 计算新的余额
    const newBalance = Number(accountInfo.value.balance) + Number(rechargeForm.amount)
    
    // 更新账户信息
    await updateAccount(currentAccountId.value, {
      balance: newBalance,
      // 保留原有的其他字段
      account: accountInfo.value.account,
      accountStatus: accountInfo.value.accountStatus
    })
    
    // 更新本地余额显示
    accountInfo.value.balance = newBalance
    
    ElMessage.success(`成功充值 ¥${rechargeForm.amount.toFixed(2)}`)
    rechargeDialogVisible.value = false
    
    // 如果余额已经大于0，更新账户状态为正常
    if (newBalance > 0 && accountInfo.value.accountStatus === '欠费') {
      accountInfo.value.accountStatus = '正常'
      ElMessage.success('账户状态已更新为正常')
    }
  } catch (error) {
    console.error('充值失败', error)
    ElMessage.error('充值失败，请稍后重试')
  } finally {
    rechargeLoading.value = false
  }
}

onMounted(() => {
  loadUserProfile()
})
</script>

<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!-- 左侧用户头像和基本信息 -->
      <el-col :xs="24" :sm="24" :md="8" :lg="6">
        <el-card class="user-info-card" v-loading="accountLoading" shadow="hover">
          <div class="avatar-container">
            <el-avatar :size="120" icon="UserFilled" class="user-avatar" />
            <h3 class="user-name">{{ userInfo.userName || '用户' }}</h3>
            <p class="user-role">{{ userInfo.userType || '普通用户' }}</p>
          </div>
          <el-divider />
          <div class="account-info">
            <div class="info-item">
              <div class="info-label">账户ID:</div>
              <div class="info-value">{{ accountInfo.accountId }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">账户名:</div>
              <div class="info-value">{{ accountInfo.account }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">账户余额:</div>
              <div class="info-value amount-value">¥ {{ Number(accountInfo.balance || 0).toFixed(2) }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">账户状态:</div>
              <div class="info-value">
                <el-tag :type="accountInfo.accountStatus === '正常' ? 'success' : 'danger'" effect="plain">
                  {{ accountInfo.accountStatus }}
                </el-tag>
              </div>
            </div>
          </div>
          <div class="action-buttons">
            <el-button type="primary" @click="showRechargeDialog" class="recharge-button">
              <el-icon><Money /></el-icon> 账户充值
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧详细信息和修改密码 -->
      <el-col :xs="24" :sm="24" :md="16" :lg="18">
        <el-card shadow="hover" class="detail-card">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本信息" name="basic">
              <!-- 统计卡片 -->
              <div class="stats-container" v-loading="statisticsLoading">
                <el-row :gutter="20">
                  <el-col :xs="12" :sm="12" :md="6">
                    <div class="stat-card blue">
                      <div class="stat-icon">
                        <el-icon><Wallet /></el-icon>
                      </div>
                      <div class="stat-info">
                        <div class="stat-value">¥ {{ Number(accountInfo.balance || 0).toFixed(2) }}</div>
                        <div class="stat-label">账户余额</div>
                      </div>
                    </div>
                  </el-col>
                  <el-col :xs="12" :sm="12" :md="6">
                    <div class="stat-card green">
                      <div class="stat-icon">
                        <el-icon><Tickets /></el-icon>
                      </div>
                      <div class="stat-info">
                        <div class="stat-value">{{ statisticsData.unpaidBillsCount }}</div>
                        <div class="stat-label">未付账单</div>
                      </div>
                    </div>
                  </el-col>
                  <el-col :xs="12" :sm="12" :md="6">
                    <div class="stat-card orange">
                      <div class="stat-icon">
                        <el-icon><Odometer /></el-icon>
                      </div>
                      <div class="stat-info">
                        <div class="stat-value">{{ statisticsData.waterMetersCount }}</div>
                        <div class="stat-label">水表数量</div>
                      </div>
                    </div>
                  </el-col>
                  <el-col :xs="12" :sm="12" :md="6">
                    <div class="stat-card purple">
                      <div class="stat-icon">
                        <el-icon><Connection /></el-icon>
                      </div>
                      <div class="stat-info">
                        <div class="stat-value">{{ statisticsData.linkedAccountsCount }}</div>
                        <div class="stat-label">关联账户</div>
                      </div>
                    </div>
                  </el-col>
                </el-row>
              </div>
              
              <div class="action-area">
                <el-button type="primary" @click="showRechargeDialog" class="recharge-button">
                  <el-icon><Money /></el-icon> 立即充值
                </el-button>
                <el-button type="info" @click="$router.push('/water-bills')">
                  <el-icon><Tickets /></el-icon> 查看账单
                </el-button>
                <el-button type="success" @click="$router.push('/payment-records')">
                  <el-icon><List /></el-icon> 缴费记录
                </el-button>
                <el-button type="warning" @click="$router.push('/my-accounts')">
                  <el-icon><Connection /></el-icon> 关联账户
                </el-button>
              </div>
              
              <div class="user-details">
                <h2 class="section-title">
                  <el-icon><UserFilled /></el-icon>
                  个人信息
                </h2>
                <el-descriptions 
                  :column="1" 
                  border
                  v-loading="userLoading"
                  class="detail-descriptions"
                >
                  <el-descriptions-item label="用户ID">{{ userInfo.userId }}</el-descriptions-item>
                  <el-descriptions-item label="用户姓名">{{ userInfo.userName }}</el-descriptions-item>
                  <el-descriptions-item label="用户类型">{{ userInfo.userType }}</el-descriptions-item>
                  <el-descriptions-item label="联系方式">{{ userInfo.contactInfo }}</el-descriptions-item>
                  <el-descriptions-item label="地址">{{ userInfo.address }}</el-descriptions-item>
                </el-descriptions>
              </div>

              <!-- 系统通知区域 -->
              <div class="notifications-container">
                <h2 class="section-title">
                  <el-icon><Message /></el-icon>
                  系统通知
                </h2>
                <div class="notification-list">
                  <div class="notification-item">
                    <div class="notification-icon">
                      <el-icon color="#409EFF"><Bell /></el-icon>
                    </div>
                    <div class="notification-content">
                      <div class="notification-title">系统更新通知</div>
                      <div class="notification-text">系统将于今晚22:00-23:00进行维护更新</div>
                      <div class="notification-time">10分钟前</div>
                    </div>
                    <div class="notification-status"></div>
                  </div>
                  <div class="notification-item">
                    <div class="notification-icon">
                      <el-icon color="#67C23A"><Money /></el-icon>
                    </div>
                    <div class="notification-content">
                      <div class="notification-title">账单生成提醒</div>
                      <div class="notification-text">您有3个新账单已生成，请及时查看</div>
                      <div class="notification-time">30分钟前</div>
                    </div>
                    <div class="notification-status"></div>
                  </div>
                  <div class="notification-item read">
                    <div class="notification-icon">
                      <el-icon color="#E6A23C"><Warning /></el-icon>
                    </div>
                    <div class="notification-content">
                      <div class="notification-title">欠费通知</div>
                      <div class="notification-text">有账单即将到期，请及时缴费</div>
                      <div class="notification-time">1小时前</div>
                    </div>
                  </div>
                </div>
                <div class="notification-more">
                  <el-button type="primary" link @click="$router.push('/notifications')">
                    查看更多通知 <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="修改密码" name="password">
              <div class="password-form-container">
                <h2 class="section-title">
                  <el-icon><Lock /></el-icon>
                  修改密码
                </h2>
                <el-form :model="passwordForm" label-width="120px" class="password-form">
                  <el-form-item label="原密码" required>
                    <el-input 
                      v-model="passwordForm.oldPassword" 
                      type="password"
                      placeholder="请输入原密码" 
                      show-password
                    />
                  </el-form-item>
                  <el-form-item label="新密码" required>
                    <el-input 
                      v-model="passwordForm.newPassword" 
                      type="password"
                      placeholder="请输入新密码" 
                      show-password
                    />
                  </el-form-item>
                  <el-form-item label="确认新密码" required>
                    <el-input 
                      v-model="passwordForm.confirmPassword" 
                      type="password"
                      placeholder="请再次输入新密码" 
                      show-password
                    />
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="changePassword" :disabled="!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword">
                      <el-icon><Check /></el-icon> 修改密码
                    </el-button>
                    <el-button @click="passwordForm.oldPassword = passwordForm.newPassword = passwordForm.confirmPassword = ''">
                      <el-icon><Refresh /></el-icon> 重置
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>

    <!-- 充值对话框 -->
    <el-dialog
      v-model="rechargeDialogVisible"
      title="账户充值"
      width="400px"
      :close-on-click-modal="false"
      center
    >
      <el-form :model="rechargeForm" label-width="100px" v-loading="rechargeLoading">
        <el-form-item label="充值金额" required>
          <el-input-number 
            v-model="rechargeForm.amount" 
            :min="1" 
            :max="10000" 
            :precision="2" 
            style="width: 100%"
          >
            <template #prefix>¥</template>
          </el-input-number>
        </el-form-item>
        <el-form-item label="支付方式" required>
          <el-select v-model="rechargeForm.paymentMethod" style="width: 100%">
            <el-option label="微信支付" value="微信支付" />
            <el-option label="支付宝" value="支付宝" />
            <el-option label="银行卡" value="银行卡" />
          </el-select>
        </el-form-item>
        <el-form-item label="当前余额">
          <el-input 
            :model-value="`¥ ${Number(accountInfo.balance || 0).toFixed(2)}`" 
            disabled
          />
        </el-form-item>
        <el-form-item label="充值后余额">
          <el-input 
            :model-value="`¥ ${(Number(accountInfo.balance || 0) + Number(rechargeForm.amount || 0)).toFixed(2)}`" 
            disabled
            class="after-recharge"
          />
        </el-form-item>
      </el-form>
      <div class="dialog-footer">
        <el-button @click="rechargeDialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleRechargeSubmit" 
          :disabled="rechargeForm.amount <= 0 || rechargeLoading"
        >
          确认充值
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.app-container {
  padding: 20px;
}

.user-info-card {
  margin-bottom: 20px;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.user-info-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 0;
  background: linear-gradient(to right, #1890ff, #36cfc9);
  color: white;
  border-radius: 4px;
  margin: -20px -20px 20px -20px;
}

.user-avatar {
  border: 4px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.user-name {
  margin-top: 15px;
  margin-bottom: 5px;
  font-size: 20px;
  font-weight: 600;
}

.user-role {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 10px;
  border-radius: 12px;
  margin-top: 8px;
}

.account-info {
  padding: 10px 0;
}

.info-item {
  display: flex;
  margin-bottom: 15px;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  transition: all 0.3s;
}

.info-item:hover {
  background-color: #f0f7ff;
  transform: translateX(5px);
}

.info-label {
  color: #606266;
  margin-right: 10px;
  min-width: 80px;
  font-weight: 500;
}

.info-value {
  color: #303133;
  font-weight: 500;
  flex: 1;
  word-break: break-all;
}

.amount-value {
  color: #f56c6c;
  font-weight: 600;
}

.detail-card {
  border-radius: 8px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-details, .account-details, .password-form-container, .notifications-container {
  margin-bottom: 30px;
}

.detail-descriptions {
  margin-bottom: 20px;
}

.detail-descriptions :deep(.el-descriptions__label) {
  width: 120px;
  font-weight: 500;
}

.detail-descriptions :deep(.el-descriptions__content) {
  padding: 12px 15px;
}

.password-form {
  max-width: 600px;
  margin: 0 auto;
}

.password-form :deep(.el-form-item__label) {
  font-weight: 500;
}

/* 统计卡片样式 */
.stats-container {
  margin-bottom: 30px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  color: white;
  margin-bottom: 15px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.stat-card.blue {
  background: linear-gradient(to right, #1890ff, #36cfc9);
}

.stat-card.green {
  background: linear-gradient(to right, #52c41a, #7cb305);
}

.stat-card.orange {
  background: linear-gradient(to right, #fa8c16, #fa541c);
}

.stat-card.purple {
  background: linear-gradient(to right, #722ed1, #2f54eb);
}

.stat-icon {
  font-size: 32px;
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

/* 通知列表样式 */
.notification-list {
  margin-bottom: 10px;
}

.notification-item {
  display: flex;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 6px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  position: relative;
  border-left: 3px solid #409EFF;
}

.notification-item:hover {
  background: #f5f7fa;
  transform: translateX(5px);
}

.notification-item.read {
  opacity: 0.7;
  border-left-color: #909399;
}

.notification-icon {
  margin-right: 15px;
  display: flex;
  align-items: flex-start;
  font-size: 20px;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 500;
  margin-bottom: 5px;
  color: #303133;
}

.notification-text {
  font-size: 13px;
  color: #606266;
  margin-bottom: 5px;
  line-height: 1.5;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-status {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #f56c6c;
}

.notification-more {
  text-align: center;
  margin-top: 10px;
}

/* 充值按钮样式 */
.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.recharge-button {
  width: 100%;
  padding: 12px 20px;
  font-size: 16px;
}

.action-area {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 30px;
  justify-content: center;
}

.action-area .el-button {
  flex: 1 1 200px;
  max-width: 200px;
  height: 45px;
}

/* 充值对话框样式 */
.dialog-footer {
  text-align: center;
  margin-top: 20px;
}

:deep(.el-input-number__decrease),
:deep(.el-input-number__increase) {
  border-color: #dcdfe6 !important;
}

.after-recharge {
  color: #67c23a;
  font-weight: bold;
}

.after-recharge :deep(.el-input__inner) {
  color: #67c23a;
  font-weight: bold;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .app-container {
    padding: 10px;
  }
  
  .user-info-card, .detail-card {
    margin-bottom: 15px;
  }
  
  .avatar-container {
    padding: 20px 0;
  }
  
  .user-name {
    font-size: 18px;
  }
  
  .section-title {
    font-size: 16px;
    margin-bottom: 15px;
  }
  
  .info-item {
    flex-direction: column;
    padding: 10px;
  }
  
  .info-label {
    margin-bottom: 5px;
  }
  
  .detail-descriptions :deep(.el-descriptions__label) {
    width: 100px;
  }
  
  .password-form :deep(.el-form-item__label) {
    width: 100px !important;
  }
  
  .action-area .el-button {
    flex: 1 1 100%;
    max-width: none;
  }
}
</style> 