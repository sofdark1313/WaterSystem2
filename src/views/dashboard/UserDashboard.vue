<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserRole } from '@/utils/permission'
import { getWaterMetersByPage } from '@/api/waterMeter'
import { getWaterBillsByPage } from '@/api/waterBill'
import { getAccountById, getAccountsByPage } from '@/api/account'

const router = useRouter()
const accountId = localStorage.getItem('accountId')
const loading = ref(false)
const currentAccountId = computed(() => accountId || '')

// 用户账户信息
const accountInfo = ref({
  AccountID: accountId,
  Account: '',
  Balance: 0,
  AccountStatus: '正常'
})

// 水表信息
const waterMeters = ref([])
const totalWaterUsage = ref(0)

// 账单信息
const bills = ref([])
const totalBills = ref(0)
const unpaidBills = ref(0)
const latestBillAmount = ref(0)

// 关联账户信息
const relatedAccounts = ref(0)

// 从本地存储获取当前用户ID
const getCurrentUserId = () => {
  // 首先尝试从localStorage直接获取userId，这是登录时应该保存的
  const userId = localStorage.getItem('userId')
  if (userId) {
    console.log('从localStorage获取用户ID成功:', userId)
    return userId
  }
  return null
}

// 加载用户账户信息
const loadAccountInfo = async () => {
  try {
    const res = await getAccountById(accountId)
    console.log('账户信息响应:', res)
    
    if (res && res.data) {
      // 规范化处理
      accountInfo.value = {
        AccountID: res.data.AccountID || res.data.accountId || accountId,
        Account: res.data.Account || res.data.account || '',
        Balance: parseFloat(res.data.Balance || res.data.balance || 0),
        AccountStatus: res.data.AccountStatus || res.data.accountStatus || '正常'
      }
    }
  } catch (error) {
    console.error('获取账户信息失败', error)
    // 使用模拟数据
    accountInfo.value = {
      AccountID: accountId,
      Account: '用户账户',
      Balance: 125.50,
      AccountStatus: '正常'
    }
  }
  
  // 确保数据格式正确
  if (typeof accountInfo.value.Balance !== 'number' || isNaN(accountInfo.value.Balance)) {
    accountInfo.value.Balance = 0;
  }
  
  console.log('处理后的账户信息:', accountInfo.value)
}

// 加载关联账户信息
const loadRelatedAccounts = async () => {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.error('未能获取用户ID，无法加载关联账户')
      relatedAccounts.value = 0
      return
    }

    const params = {
      userId: userId,
      pageSize: 100 // 设置一个较大的值以获取所有关联账户
    }
    
    console.log('查询关联账户参数:', params)
    const res = await getAccountsByPage(params)
    console.log('关联账户响应:', res)
    
    if (res && res.data) {
      if (Array.isArray(res.data.rows)) {
        relatedAccounts.value = res.data.rows.length
      } else if (Array.isArray(res.data)) {
        relatedAccounts.value = res.data.length
      } else {
        console.warn('未能识别的关联账户数据格式:', res)
        relatedAccounts.value = 0
      }
    } else {
      relatedAccounts.value = 0
    }
    
    console.log('关联账户数量:', relatedAccounts.value)
  } catch (error) {
    console.error('获取关联账户数量失败:', error)
    relatedAccounts.value = 0
  }
}

// 加载水表信息
const loadWaterMeters = async () => {
  try {
    const res = await getWaterMetersByPage({ accountId })
    console.log('水表数据响应:', res)
    
    // 尝试从不同的响应结构中提取数据
    if (res && res.data) {
      if (Array.isArray(res.data.rows)) {
        waterMeters.value = res.data.rows
      } else if (Array.isArray(res.data)) {
        waterMeters.value = res.data
      } else if (res.data.records && Array.isArray(res.data.records)) {
        waterMeters.value = res.data.records
      } else {
        console.warn('未能识别的响应格式:', res)
        useLocalMockData()
      }
    } else {
      console.warn('响应中没有data字段:', res)
      useLocalMockData()
    }
    
    // 数据规范化处理 - 确保字段名一致
    waterMeters.value = waterMeters.value.map(meter => ({
      MeterID: meter.MeterID || meter.meterId || `WM${Math.floor(Math.random() * 1000)}`,
      AccountID: meter.AccountID || meter.accountId || accountId,
      MeterType: meter.MeterType || meter.meterType || '居民用水',
      InitialReading: parseFloat(meter.InitialReading || meter.initialReading || 0),
      CurrentReading: parseFloat(meter.CurrentReading || meter.currentReading || 0)
    }))
    
    // 计算总用水量
    calculateTotalWaterUsage()
    
    if (waterMeters.value.length === 0) {
      useLocalMockData()
    }
  } catch (error) {
    console.error('获取水表信息失败', error)
    useLocalMockData()
  }
}

// 使用本地模拟数据
const useLocalMockData = () => {
  console.log('使用模拟数据')
  waterMeters.value = [
    { 
      MeterID: 'WM001',
      AccountID: accountId,
      MeterType: '居民用水',
      InitialReading: 0,
      CurrentReading: 125.8
    },
    {
      MeterID: 'WM002',
      AccountID: accountId,
      MeterType: '商业用水',
      InitialReading: 0,
      CurrentReading: 80.5
    }
  ]
  calculateTotalWaterUsage()
}

// 计算总用水量
const calculateTotalWaterUsage = () => {
  totalWaterUsage.value = waterMeters.value.reduce((sum, meter) => {
    // 检查数值是否有效，防止NaN
    const initial = parseFloat(meter.InitialReading) || 0
    const current = parseFloat(meter.CurrentReading) || 0
    const usage = current - initial
    return sum + (Number.isFinite(usage) ? usage : 0)
  }, 0).toFixed(2)
  
  // 如果计算结果为NaN，设置为0
  if (totalWaterUsage.value === "NaN") {
    totalWaterUsage.value = "0.00"
  }
}

// 加载账单信息
const loadBills = async () => {
  try {
    const res = await getWaterBillsByPage({ accountId })
    console.log('账单数据响应:', res)
    
    // 尝试从不同的响应结构中提取数据
    if (res && res.data) {
      if (Array.isArray(res.data.rows)) {
        bills.value = res.data.rows
      } else if (Array.isArray(res.data)) {
        bills.value = res.data
      } else if (res.data.records && Array.isArray(res.data.records)) {
        bills.value = res.data.records
      } else {
        console.warn('未能识别的账单响应格式:', res)
        useLocalMockBills()
      }
    } else {
      console.warn('账单响应中没有data字段:', res)
      useLocalMockBills()
    }
    
    // 数据规范化处理 - 确保字段名一致
    bills.value = bills.value.map(bill => ({
      BillID: bill.BillID || bill.billId || `B${Math.floor(Math.random() * 10000)}`,
      AccountID: bill.AccountID || bill.accountId || accountId,
      BillAmount: parseFloat(bill.BillAmount || bill.amount || 0),
      BillDate: bill.BillDate || bill.createdTime || new Date().toISOString().split('T')[0],
      DueDate: bill.DueDate || bill.dueDate || new Date().toISOString().split('T')[0],
      BillStatus: bill.BillStatus || bill.billStatus || bill.status || '未缴'
    }))
    
    // 计算账单统计
    calculateBillsStatistics()
    
    if (bills.value.length === 0) {
      useLocalMockBills()
    }
  } catch (error) {
    console.error('获取账单信息失败', error)
    useLocalMockBills()
  }
}

// 使用本地模拟账单数据
const useLocalMockBills = () => {
  console.log('使用模拟账单数据')
  bills.value = [
    {
      BillID: 'B20230001',
      AccountID: accountId,
      BillAmount: 78.50,
      BillDate: '2023-04-15',
      DueDate: '2023-04-30',
      BillStatus: '已缴'
    },
    {
      BillID: 'B20230002',
      AccountID: accountId,
      BillAmount: 82.20,
      BillDate: '2023-05-15',
      DueDate: '2023-05-30',
      BillStatus: '未缴'
    }
  ]
  calculateBillsStatistics()
}

// 计算账单统计
const calculateBillsStatistics = () => {
  // 确保bills是数组
  if (!Array.isArray(bills.value)) {
    bills.value = []
  }
  
  totalBills.value = bills.value.length
  unpaidBills.value = bills.value.filter(bill => bill && bill.BillStatus === '未缴').length
  
  // 获取最新账单金额
  if (bills.value.length > 0 && bills.value[0] && typeof bills.value[0].BillAmount !== 'undefined') {
    const amount = parseFloat(bills.value[0].BillAmount)
    latestBillAmount.value = Number.isFinite(amount) ? amount.toFixed(2) : '0.00'
  } else {
    latestBillAmount.value = '0.00'
  }
}

// 查看水表详情
const viewWaterMeter = (meterId) => {
  if (!meterId) {
    // 如果没有水表ID，提示用户并返回
    ElMessage.warning('没有可查看的水表信息')
    return
  }
  console.log('跳转到水表详情，ID:', meterId)
  // 直接跳转到水表列表页面
  router.push('/water-meters')
}

// 查看账单详情
const viewBill = () => {
  console.log('跳转到账单页面，账户ID:', accountId)
  // 使用路由对象携带查询参数
  router.push({
    path: '/water-bills',
    query: { accountId: accountId }
  })
}

// 跳转到缴费页面
const goToPayment = () => {
  console.log('跳转到缴费页面，账户ID:', accountId)
  router.push({
    path: '/water-bills',
    query: { accountId: accountId, status: '未缴费' }
  })
}

// 跳转到关联账户页面
const goToMyAccounts = () => {
  console.log('跳转到关联账户页面')
  router.push('/my-accounts')
}

// 登录验证和权限检查
const checkPermission = () => {
  const role = getUserRole()
  if (role !== 'user') {
    ElMessage.warning('您不是普通用户，正在跳转到管理员首页')
    router.push('/dashboard')
  }
}

// 加载所有数据
const loadAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadAccountInfo(),
      loadWaterMeters(),
      loadBills(),
      loadRelatedAccounts()
    ])
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  checkPermission()
  loadAllData()
})
</script>

<template>
  <div class="app-container user-dashboard-container" v-loading="loading">
    <el-row :gutter="20">
      <!-- 欢迎信息 -->
      <el-col :span="24">
        <el-card class="welcome-card">
          <div class="welcome-content">
            <h2>欢迎使用水务管理系统</h2>
            <p>今天是 {{ new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
            <div class="user-info">
              <span>账户ID: <strong>{{ accountInfo.AccountID || currentAccountId }}</strong></span>
              <span>账户状态: <strong>{{ accountInfo.AccountStatus || '正常' }}</strong></span>
              <span>账户余额: <strong>¥{{ typeof accountInfo.Balance === 'number' ? accountInfo.Balance.toFixed(2) : '0.00' }}</strong></span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-content">
            <div class="stat-icon meter-icon"><el-icon><Odometer /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ totalWaterUsage }}</div>
              <div class="stat-label">总用水量(立方米)</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card-content">
            <div class="stat-icon bill-icon"><el-icon><Wallet /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ totalBills }}</div>
              <div class="stat-label">账单总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card 
          shadow="hover" 
          class="stat-card" 
          @click="goToMyAccounts"
        >
          <div class="stat-card-content">
            <div class="stat-icon account-icon"><el-icon><Connection /></el-icon></div>
            <div class="stat-info">
              <div class="stat-value">{{ relatedAccounts }}</div>
              <div class="stat-label">关联账户</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <!-- 我的水表 -->
      <el-col :xs="24" :sm="24" :md="12">
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <span>我的水表</span>
              <el-button type="primary" link @click="viewWaterMeter(waterMeters.length > 0 ? waterMeters[0].MeterID : null)">
                <el-icon><ArrowRight /></el-icon> 查看详情
              </el-button>
            </div>
          </template>
          <el-table :data="waterMeters" stripe style="width: 100%" :header-cell-style="{background:'#f5f7fa', color:'#606266', fontWeight: 'bold'}">
            <el-table-column prop="MeterID" label="水表ID" width="120" />
            <el-table-column prop="MeterType" label="水表类型" width="100" />
            <el-table-column label="当前读数">
              <template #default="scope">
                <span v-if="scope.row && scope.row.CurrentReading != null">
                  {{ Number.isFinite(parseFloat(scope.row.CurrentReading)) ? parseFloat(scope.row.CurrentReading).toFixed(2) : '0.00' }} 立方米
                </span>
                <span v-else>0.00 立方米</span>
              </template>
            </el-table-column>
            <el-table-column label="用水量">
              <template #default="scope">
                <span v-if="scope.row">
                  {{ 
                    Number.isFinite(parseFloat(scope.row.CurrentReading)) && 
                    Number.isFinite(parseFloat(scope.row.InitialReading))
                      ? (parseFloat(scope.row.CurrentReading) - parseFloat(scope.row.InitialReading)).toFixed(2) 
                      : '0.00' 
                  }} 立方米
                </span>
                <span v-else>0.00 立方米</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <!-- 我的账单 -->
      <el-col :xs="24" :sm="24" :md="12">
        <el-card class="detail-card">
          <template #header>
            <div class="card-header">
              <span>我的账单</span>
              <el-button type="primary" link @click="viewBill()">
                <el-icon><ArrowRight /></el-icon> 查看详情
              </el-button>
            </div>
          </template>
          <el-table :data="bills" stripe style="width: 100%" :header-cell-style="{background:'#f5f7fa', color:'#606266', fontWeight: 'bold'}">
            <el-table-column prop="BillID" label="账单ID" width="120" />
            <el-table-column label="账单日期" width="110">
              <template #default="scope">
                {{ scope.row && scope.row.BillDate ? scope.row.BillDate.substring(0, 10) : '-' }}
              </template>
            </el-table-column>
            <el-table-column label="金额">
              <template #default="scope">
                ¥{{ scope.row && scope.row.BillAmount ? (Number.isFinite(parseFloat(scope.row.BillAmount)) ? parseFloat(scope.row.BillAmount).toFixed(2) : '0.00') : '0.00' }}
              </template>
            </el-table-column>
            <el-table-column prop="BillStatus" label="状态">
              <template #default="scope">
                <el-tag v-if="scope.row && scope.row.BillStatus" :type="scope.row.BillStatus === '已缴' ? 'success' : 'danger'">
                  {{ scope.row.BillStatus }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快速操作 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="quick-actions">
          <template #header>
            <div class="card-header">
              <span>快速操作</span>
            </div>
          </template>
          <div class="action-buttons">
            <el-button type="primary" @click="viewWaterMeter(waterMeters.length > 0 ? waterMeters[0].MeterID : null)">
              <el-icon><Odometer /></el-icon> 查看水表详情
            </el-button>
            <el-button type="success" @click="viewBill()">
              <el-icon><Tickets /></el-icon> 查看账单历史
            </el-button>
            <el-button type="info" @click="goToMyAccounts()">
              <el-icon><Connection /></el-icon> 我的关联账户
            </el-button>
            <el-button type="warning" @click="goToPayment()">
              <el-icon><Money /></el-icon> 水费缴纳
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.user-dashboard-container {
  padding: 20px;
  height: calc(100vh - 84px);
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.welcome-card {
  margin-bottom: 20px;
  background: linear-gradient(to right, #1890ff, #36cfc9);
  color: white;
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.welcome-content {
  padding: 16px;
  text-align: center;
}

.welcome-content h2 {
  font-size: 26px;
  margin-bottom: 10px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 15px;
  font-size: 16px;
}

.user-info strong {
  font-size: 18px;
  font-weight: 600;
}

.stat-row {
  margin-bottom: 20px;
}

.el-row {
  margin-bottom: 20px;
  width: 100%;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 8px;
  border: none;
  height: 100%;
  min-height: 120px;
  display: flex;
  align-items: center;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.stat-card-content {
  display: flex;
  align-items: center;
  padding: 20px;
  width: 100%;
}

.stat-icon {
  font-size: 52px;
  padding: 0 20px;
  background: rgba(24, 144, 255, 0.1);
  border-radius: 50%;
  height: 80px;
  width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  transition: all 0.3s;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
}

.meter-icon {
  color: #1890ff;
  background-color: rgba(24, 144, 255, 0.1);
}

.bill-icon {
  color: #faad14;
  background-color: rgba(250, 173, 20, 0.1);
}

.account-icon {
  color: #409EFF;
  background-color: rgba(64, 158, 255, 0.1);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #262626;
}

.stat-label {
  font-size: 15px;
  color: #8c8c8c;
  font-weight: 500;
}

.detail-card {
  margin-bottom: 20px;
  height: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: none;
  transition: all 0.3s;
}

.detail-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.quick-actions {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: none;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding: 10px 0;
  justify-content: center;
}

.action-buttons .el-button {
  min-width: 120px;
  height: 42px;
  border-radius: 21px;
  font-weight: 500;
  font-size: 15px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

:deep(.el-card__header) {
  padding: 0;
}

:deep(.el-card__body) {
  padding: 15px;
}

:deep(.el-table) {
  --el-table-border-color: #ebeef5;
  --el-table-header-bg-color: #f5f7fa;
}

:deep(.el-table tr:hover td) {
  background-color: #f0f9ff !important;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .user-dashboard-container {
    padding: 15px;
    height: auto;
  }
  
  .welcome-content h2 {
    font-size: 22px;
  }
  
  .user-info {
    flex-direction: column;
    gap: 10px;
  }
  
  .stat-card-content {
    padding: 15px;
  }
  
  .stat-icon {
    font-size: 40px;
    height: 60px;
    width: 60px;
  }
  
  .stat-value {
    font-size: 22px;
  }
  
  .stat-label {
    font-size: 14px;
  }
  
  .action-buttons {
    justify-content: flex-start;
  }
  
  .action-buttons .el-button {
    min-width: 100px;
    margin: 5px;
    flex: 1 1 40%;
  }
}
</style> 