<script setup>
import { ref, onMounted, reactive, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getPaymentRecords } from '@/api/waterBill'
import { ElMessage } from 'element-plus'
import { isAdmin } from '@/utils/permission'

const route = useRoute()
const billId = ref(route.query.billId || '')

// 控制用户是否为管理员
const isAdminUser = computed(() => isAdmin())
// 获取当前用户ID
const currentAccountId = computed(() => localStorage.getItem('accountId') || '')

// 表格数据
const tableData = ref([])
const loading = ref(false)

// 查询参数
const queryParams = reactive({
  billId: '',
  accountId: '',
  page: 1,
  pageSize: 10
})

// 表单验证规则
const rules = {
  billId: [
    { pattern: /^\d*$/, message: '账单ID必须为数字', trigger: 'blur' }
  ],
  accountId: [
    { pattern: /^\d*$/, message: '账户ID必须为数字', trigger: 'blur' }
  ]
}

// 表单ref
const formRef = ref(null)

// 总记录数
const total = ref(0)

// 监听路由参数变化
watch(() => route.query.billId, (newVal) => {
  if (newVal) {
    billId.value = newVal
    queryParams.billId = newVal
    loadPaymentRecords()
  }
})

// 加载缴费记录
const loadPaymentRecords = async () => {
  loading.value = true
  try {
    // 对于普通用户，强制只能查询自己的缴费记录
    const params = { ...queryParams }
    if (!isAdminUser.value) {
      params.accountId = currentAccountId.value
      console.log('非管理员用户，强制设置账户ID:', params.accountId)
    }
    
    console.log('缴费记录查询参数:', JSON.stringify(params))
    
    // 确保发送给API的参数格式正确
    const apiParams = {
      billId: params.billId || '',
      accountId: params.accountId || '',
      page: params.page,
      pageSize: params.pageSize
    }
    
    console.log('发送到API的参数:', JSON.stringify(apiParams))
    
    const res = await getPaymentRecords(apiParams)
    console.log('缴费记录API响应:', res)
    
    // 处理API响应数据
    if (res.data && Array.isArray(res.data.rows)) {
      tableData.value = res.data.rows
      total.value = res.data.total || res.data.rows.length
      console.log('使用标准格式数据：rows + total')
    } else if (res.data && Array.isArray(res.data)) {
      tableData.value = res.data
      total.value = res.data.length
      console.log('使用数组格式数据')
    } else if (res.data && res.data.records && Array.isArray(res.data.records)) {
      tableData.value = res.data.records
      total.value = res.data.total || res.data.records.length
      console.log('使用records格式数据')
    } else {
      console.warn('未识别的数据格式:', res)
      tableData.value = []
      total.value = 0
      ElMessage.warning('接收到的数据格式不正确')
    }

    console.log('原始表格数据条数:', tableData.value.length)

    // 数据规范化处理，确保字段名一致
    tableData.value = tableData.value.map(record => ({
      paymentID: record.paymentID || record.paymentId || '',
      billID: record.billID || record.billId || '',
      accountId: record.accountId || record.AccountID || '',
      paymentDate: record.paymentDate || record.PaymentDate || '',
      paymentAmount: parseFloat(record.paymentAmount || record.PaymentAmount || 0),
      paymentMethod: record.paymentMethod || record.PaymentMethod || '',
      invoice: record.invoice || record.Invoice || ''
    }))

    // 非管理员用户过滤数据，确保只显示自己的记录
    if (!isAdminUser.value) {
      console.log('过滤前数据条数:', tableData.value.length, '当前账户ID:', currentAccountId.value)
      
      tableData.value = tableData.value.filter(record => {
        // 转换为字符串进行比较，防止类型不匹配问题
        const recordAccountId = String(record.accountId || '').trim()
        const currentId = String(currentAccountId.value || '').trim()
        
        const isMatch = recordAccountId === currentId
        console.log(`记录账户ID: ${recordAccountId}, 当前账户ID: ${currentId}, 匹配: ${isMatch}`)
        
        return isMatch
      })
      
      total.value = tableData.value.length
      console.log('过滤后数据条数:', tableData.value.length)
    }

    if(tableData.value.length === 0) {
      ElMessage.info('暂无数据')
    } else {
      console.log('最终显示数据条数:', tableData.value.length)
    }
  } catch (error) {
    console.error('加载缴费记录失败', error)
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 查询按钮点击
const handleQuery = () => {
  formRef.value.validate(valid => {
    if (!valid) {
      return ElMessage.warning('请检查输入项')
    }
    
    // 设置查询参数
    queryParams.billId = billId.value
    
    // 非管理员用户强制使用自己的accountId
    if (!isAdminUser.value) {
      queryParams.accountId = currentAccountId.value
    } else if (isAdminUser.value) {
      // 管理员用户可以查询指定账户的记录
      // 这里保留用户输入的accountId
    }
    
    console.log('查询执行时的参数:', queryParams)
    queryParams.page = 1
    loadPaymentRecords()
  })
}

// 清空按钮点击
const handleClear = () => {
  formRef.value.resetFields()
  billId.value = ''
  queryParams.billId = ''
  
  // 非管理员用户重置时仍然只能查看自己的缴费记录
  if (isAdminUser.value) {
    queryParams.accountId = ''
  } else {
    queryParams.accountId = currentAccountId.value
  }
  
  queryParams.page = 1
  loadPaymentRecords()
}

// 分页改变事件
const handleSizeChange = (size) => {
  queryParams.pageSize = size
  loadPaymentRecords()
}

const handleCurrentChange = (current) => {
  queryParams.page = current
  loadPaymentRecords()
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 组件挂载时加载数据
onMounted(() => {
  // 设置查询参数
  if (billId.value) {
    queryParams.billId = billId.value
  }
  
  // 非管理员用户只能查看自己的缴费记录，强制设置accountId
  if (!isAdminUser.value) {
    queryParams.accountId = currentAccountId.value
  }
  
  console.log('初始化查询参数:', queryParams)
  loadPaymentRecords()
})
</script>

<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="hover">
      <el-form 
        ref="formRef"
        :model="queryParams"
        :rules="rules"
        :inline="true" 
        class="search-form"
      >
        <el-form-item label="账单ID" prop="billId">
          <el-input 
            v-model="billId" 
            placeholder="请输入账单ID" 
            clearable 
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="账户ID" prop="accountId" v-if="isAdminUser">
          <el-input 
            v-model="queryParams.accountId" 
            placeholder="请输入账户ID" 
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item class="search-buttons">
          <el-button type="primary" @click="handleQuery" :loading="loading">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleClear">
            <el-icon><RefreshRight /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">缴费记录</span>
          <div class="header-right">
            <el-tag type="info" effect="plain">总计: {{total}} 条记录</el-tag>
          </div>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        highlight-current-row
        style="width: 100%;"
        height="calc(100% - 70px)"
        :header-cell-style="{background:'#f5f7fa', color:'#606266', fontWeight: 'bold'}"
        empty-text="暂无缴费记录数据"
      >
        <el-table-column prop="paymentID" label="缴费记录ID" min-width="100" align="center" />
        <el-table-column prop="billID" label="账单ID" min-width="80" align="center" />
        <el-table-column prop="accountId" label="账户ID" min-width="80" align="center" />
        <el-table-column label="缴费日期" min-width="100" align="center">
          <template #default="scope">
            {{ formatDate(scope.row.paymentDate) }}
          </template>
        </el-table-column>
        <el-table-column label="缴费金额" min-width="100" align="right">
          <template #default="scope">
            <span class="amount-value">¥ {{ scope.row.paymentAmount ? Number(scope.row.paymentAmount).toFixed(2) : '0.00' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="缴费方式" min-width="100" align="center" show-overflow-tooltip />
        <el-table-column prop="invoice" label="发票号" min-width="180" align="center" show-overflow-tooltip />
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
  border-radius: 8px;
  transition: all 0.3s ease;
}

.search-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

.search-card :deep(.el-card__body) {
  padding: 15px;
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
  align-items: flex-start;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 0;
  flex: 1 1 200px;
}

.search-form :deep(.el-form-item__label) {
  padding-right: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.search-form :deep(.el-form-item__content) {
  width: 100%;
  display: flex;
}

.search-form :deep(.el-input),
.search-form :deep(.el-select) {
  width: 100%;
}

.search-form :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
  transition: all 0.2s;
}

.search-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

.search-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset !important;
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
  border-radius: 8px;
  transition: all 0.3s ease;
}

.table-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
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

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
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

/* 金额显示样式 */
.amount-value {
  font-weight: 500;
  color: #606266;
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
    gap: 12px;
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
    justify-content: center;
    margin-top: 5px;
    width: 100%;
  }
  
  .search-buttons :deep(.el-button) {
    flex: 1;
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
  
  :deep(.el-card__header) {
    padding: 12px;
  }
  
  :deep(.el-card__body) {
    padding: 12px;
  }
  
  /* 在小屏幕上优化表格显示 */
  :deep(.el-table) {
    font-size: 12px;
  }
  
  :deep(.el-table th) {
    padding: 8px 0;
  }
  
  :deep(.el-table td) {
    padding: 6px 0;
  }
}

/* 暗色主题适配 */
@media (prefers-color-scheme: dark) {
  .search-card,
  .table-card {
    background-color: #1e1e1e;
    color: #e0e0e0;
  }
  
  .card-title {
    color: #e0e0e0;
  }
  
  :deep(.el-table) {
    --el-table-header-bg-color: #2c2c2c;
    --el-table-row-hover-bg-color: #303030;
    --el-table-border-color: #4a4a4a;
    color: #e0e0e0;
  }
  
  :deep(.el-table th) {
    background-color: #2c2c2c !important;
    color: #e0e0e0 !important;
  }
}
</style> 