<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAccountsByPage, getAccountById } from '@/api/account'
import { ElMessage } from 'element-plus'
import { isAdmin } from '@/utils/permission'
import http from '@/api/http'

const router = useRouter()

// 表格数据
const tableData = ref([])
const total = ref(0)
const loading = ref(false)

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

// 当前用户ID和账号ID
const userId = ref(getCurrentUserId() || '')

// 查询参数 - 不要在初始化时就设置userId，而是在每次请求前设置
const queryParams = reactive({
  userId: '',  // 初始不设置，而是在API请求前设置
  accountStatus: '',
  page: 1,
  pageSize: 10
})

// 账户状态选项
const accountStatusOptions = [
  { value: '正常', label: '正常' },
  { value: '欠费', label: '欠费' }
]

// 获取当前用户信息
const getCurrentUserInfo = async () => {
  try {
    loading.value = true
    
    // 先从localStorage获取userId
    const storedUserId = getCurrentUserId()
    if (storedUserId) {
      userId.value = storedUserId
      return
    }
    
    // 如果localStorage中没有userId，从账户信息获取
    const accountId = localStorage.getItem('accountId')
    if (!accountId) {
      ElMessage.error('未找到当前登录用户信息，请重新登录')
      return
    }
    
    // 根据账户ID获取用户信息
    console.log('正在获取账户信息，账户ID:', accountId)
    const res = await getAccountById(accountId)
    console.log('获取到的账户信息:', res)
    
    if (res.data && res.data.userId) {
      userId.value = res.data.userId
      // 保存到localStorage中以便下次使用
      localStorage.setItem('userId', res.data.userId)
      console.log('成功获取用户ID:', userId.value)
    } else if (res.data && res.data.UserID) {
      userId.value = res.data.UserID
      localStorage.setItem('userId', res.data.UserID)
    } else {
      ElMessage.warning('未能获取到用户ID，请联系管理员')
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

// 加载表格数据
const loadTableData = async () => {
  loading.value = true
  try {
    if (!userId.value) {
      // 如果没有用户ID，尝试重新获取
      await getCurrentUserInfo()
    }
    
    if (!userId.value) {
      ElMessage.error('未能获取用户ID，无法加载关联账户')
      return
    }
    
    // 确保发送请求前设置正确的userId
    queryParams.userId = userId.value
    
    console.log('发送查询参数:', JSON.stringify(queryParams))
    
    const res = await getAccountsByPage(queryParams)
    console.log('关联账户列表响应数据:', res)
    
    // 根据后端实际返回的数据结构进行处理
    if (res.data && Array.isArray(res.data.rows)) {
      // 标准格式：{code: 1, data: {rows: [...], total: 100}}
      tableData.value = res.data.rows
      total.value = res.data.total || res.data.rows.length
    } else if (Array.isArray(res.data)) {
      // 后端直接返回数组：{code: 1, data: [...]}
      tableData.value = res.data
      total.value = res.data.length
    } else {
      // 其他情况
      console.warn('未识别的数据格式:', res)
      tableData.value = []
      total.value = 0
      ElMessage.warning('数据格式异常，请检查接口返回')
    }
    
    // 确保数据格式一致，处理字段名可能的不同情况
    tableData.value = tableData.value.map(item => ({
      accountId: item.accountId || item.AccountID || '',
      userId: item.userId || item.UserID || '',
      accountName: item.accountName || item.Account || '',
      balance: item.balance || item.Balance || 0,
      accountStatus: item.accountStatus || item.AccountStatus || '正常',
      createTime: item.createTime || item.CreateTime || ''
    }))
    
    // 额外的安全措施：过滤数据，确保只显示当前用户的账户
    if (userId.value) {
      console.log('过滤前数据条数:', tableData.value.length)
      tableData.value = tableData.value.filter(item => 
        String(item.userId) === String(userId.value)
      )
      total.value = tableData.value.length
      console.log('过滤后数据条数:', tableData.value.length)
    }
    
    if(tableData.value.length === 0) {
      ElMessage.info('暂无关联账户数据')
    }
  } catch (error) {
    console.error('加载关联账户数据失败', error)
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 查询按钮点击
const handleQuery = () => {
  // 确保每次查询时都设置正确的userId
  queryParams.userId = userId.value
  queryParams.page = 1
  loadTableData()
}

// 重置按钮点击
const handleReset = () => {
  queryParams.accountStatus = ''
  // 重置时保留userId
  queryParams.userId = userId.value
  queryParams.page = 1
  loadTableData()
}

// 查看账户详情
const handleViewDetail = (row) => {
  const accountId = row.accountId
  router.push(`/accounts/${accountId}`)
}

// 分页改变事件
const handleSizeChange = (size) => {
  queryParams.pageSize = size
  loadTableData()
}

const handleCurrentChange = (current) => {
  queryParams.page = current
  loadTableData()
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 组件挂载时先获取用户信息，再加载数据
onMounted(async () => {
  await getCurrentUserInfo()
  loadTableData()
})
</script>

<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-card class="search-card">
      <el-form :model="queryParams" ref="queryForm" :inline="true" class="search-form">
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="userId" placeholder="当前用户ID" disabled />
        </el-form-item>
        <el-form-item label="账户状态" prop="accountStatus">
          <el-select v-model="queryParams.accountStatus" placeholder="请选择账户状态" clearable style="width: 100%">
            <el-option
              v-for="item in accountStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格工具栏 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">我的关联账户</span>
        </div>
      </template>
      
      <!-- 表格区域 - 增强账户数据显示 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        highlight-current-row
        style="width: 100%;"
        height="calc(100% - 70px)"
        :header-cell-style="{background:'#f5f7fa', color:'#606266', fontWeight: 'bold'}"
      >
        <el-table-column prop="accountId" label="账户ID" min-width="90" align="center" />
        <el-table-column prop="accountName" label="账户名称" min-width="120" show-overflow-tooltip />
        <el-table-column label="账户余额" min-width="120" align="right">
          <template #default="scope">
            <span class="amount-value" :class="{'positive-balance': Number(scope.row.balance) > 0, 'zero-balance': Number(scope.row.balance) === 0}">
              ¥ {{ Number(scope.row.balance || 0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="账户状态" min-width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.accountStatus === '正常' ? 'success' : 'danger'" effect="light">
              {{ scope.row.accountStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="120" align="center">
          <template #default="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="150" fixed="right" align="center">
          <template #default="scope">
            <el-button 
              type="primary" 
              link
              @click="handleViewDetail(scope.row)"
              size="small"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页区域 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 无数据提示 -->
    <el-empty v-if="tableData.length === 0 && !loading" description="暂无关联账户数据"></el-empty>
  </div>
</template>

<style scoped>
.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  box-sizing: border-box;
  gap: 16px;
}

.search-card {
  margin-bottom: 0;
  flex-shrink: 0;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
}

.search-card :deep(.el-card__body) {
  padding: 10px;
  overflow: visible;
}

/* 搜索表单样式 */
.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
  z-index: 10;
  position: relative;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 0;
  flex: 1 1 200px;
}

.search-form :deep(.el-form-item__label) {
  padding-right: 8px;
  font-size: 14px;
}

.search-form :deep(.el-form-item__content) {
  width: 100%;
  display: flex;
}

.search-form :deep(.el-input),
.search-form :deep(.el-select) {
  width: 100%;
}

.search-buttons {
  flex: 0 0 auto !important;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 5;
  margin-top: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

/* 确保el-card__body占满高度 */
:deep(.el-card__body) {
  height: calc(100% - 60px);
  display: flex;
  flex-direction: column;
  padding: 15px;
  overflow: visible;
}

.pagination-container {
  margin-top: 20px;
  padding: 10px 0;
  display: flex !important;
  justify-content: flex-end;
  align-items: center;
}

/* 确保表格占满空间 */
:deep(.el-table) {
  flex: 1;
  overflow: auto;
}

/* 表格行鼠标悬停效果 */
:deep(.el-table tr:hover) {
  background-color: #f0f9ff !important;
}

/* 余额显示样式 */
.amount-value {
  font-weight: 500;
  color: #606266;
}

.positive-balance {
  color: #67c23a;
  font-weight: bold;
}

.zero-balance {
  color: #909399;
}

/* 表格行样式增强 */
:deep(.el-table__row) {
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.el-table__row:hover) {
  background-color: #ecf5ff !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 确保分页组件总是可见 */
:deep(.el-pagination) {
  display: flex !important;
  visibility: visible !important;
  box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  padding: 5px 10px;
  background: #fff;
}

/* 响应式布局优化 */
@media screen and (max-width: 768px) {
  .app-container {
    padding: 10px;
    gap: 20px;
  }
  
  .search-form {
    flex-direction: column;
    gap: 10px;
  }
  
  .search-form :deep(.el-form-item) {
    flex: 1 1 100%;
    margin-bottom: 10px;
  }

  .search-buttons {
    justify-content: flex-start;
    margin-top: 5px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style> 