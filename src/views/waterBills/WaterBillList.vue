<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { getWaterBillsByPage, generateWaterBill, payWaterBill } from '@/api/waterBill'
import { ElMessage, ElMessageBox } from 'element-plus'
import { isAdmin, canAccessAccount, showNoPermissionMessage, getUserRole } from '@/utils/permission'
import { useRoute } from 'vue-router'

// 控制用户是否为管理员
const isAdminUser = computed(() => isAdmin())
// 获取当前用户ID
const currentAccountId = computed(() => localStorage.getItem('accountId') || '')

// 查询参数
const queryParams = reactive({
  accountId: '',
  billStatus: '',
  page: 1,
  pageSize: 10
})

// 表格数据
const tableData = ref([])
const total = ref(0)
const loading = ref(false)

// 账单状态选项
const billStatusOptions = [
  { value: '未缴', label: '未缴' },
  { value: '已缴', label: '已缴' }
]

// 生成账单对话框
const generateDialogVisible = ref(false)
const generateForm = reactive({
  accountId: '',
  currentReading: 0,
  previousReading: 0
})

// 缴费对话框
const payDialogVisible = ref(false)
const payForm = reactive({
  billId: '',
  accountId: '',
  readingDate: '',
  waterUsage: 0,
  amount: 0,
  paymentAmount: 0,
  paymentMethod: '线上缴费'
})

// 加载表格数据
const loadTableData = async () => {
  loading.value = true
  try {
    // 对于普通用户，强制只能查询自己的账单
    const params = { ...queryParams }
    if (!isAdminUser.value) {
      params.accountId = currentAccountId.value
      console.log('非管理员用户，强制使用当前账户ID:', params.accountId)
    }
    
    // 如果普通用户尝试清空账户ID，显示警告并重置为当前用户ID
    if (!isAdminUser.value && params.accountId !== currentAccountId.value) {
      ElMessage.warning('普通用户只能查看自己的账单')
      params.accountId = currentAccountId.value
      queryParams.accountId = currentAccountId.value
    }
    
    console.log('发送到API的查询参数:', JSON.stringify(params))
    
    const res = await getWaterBillsByPage(params)
    console.log('水费账单列表响应数据:', res)
    
    // 根据后端实际返回的数据结构进行处理
    if (res.data && Array.isArray(res.data.rows)) {
      // 标准格式：{code: 1, data: {rows: [...], total: 100}}
      tableData.value = res.data.rows
      total.value = res.data.total || res.data.rows.length
      console.log('使用标准格式数据：rows + total')
    } else if (Array.isArray(res.data)) {
      // 后端直接返回数组：{code: 1, data: [...]}
      tableData.value = res.data
      total.value = res.data.length
      console.log('使用数组格式数据')
    } else {
      // 其他情况
      console.warn('未识别的数据格式:', res)
      tableData.value = []
      total.value = 0
      ElMessage.warning('数据格式异常，请检查接口返回')
    }
    
    console.log('原始表格数据条数:', tableData.value.length)
    
    // 确保数据格式一致，处理字段名可能的不同情况
    tableData.value = tableData.value.map(record => ({
      billId: record.billId || record.BillID || '',
      accountId: record.accountId || record.AccountID || '',
      readingDate: record.readingDate || record.ReadingDate || '',
      waterUsage: parseFloat(record.waterUsage || record.WaterUsage || 0),
      amount: parseFloat(record.amount || record.Amount || 0),
      billStatus: record.billStatus || record.BillStatus || '未缴',
      paymentDate: record.paymentDate || record.PaymentDate || '',
      paymentMethod: record.paymentMethod || record.PaymentMethod || ''
    }))
    
    // 非管理员用户过滤数据，确保只显示自己的账单
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
    console.error('加载账单数据失败', error)
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 查询按钮点击
const handleQuery = () => {
  // 非管理员用户强制使用自己的accountId
  if (!isAdminUser.value) {
    queryParams.accountId = currentAccountId.value
  }
  
  queryParams.page = 1
  loadTableData()
}

// 重置按钮点击
const handleReset = () => {
  // 非管理员用户重置时仍然只能查看自己的账单
  if (isAdminUser.value) {
    queryParams.accountId = ''
  } else {
    queryParams.accountId = currentAccountId.value
  }
  
  queryParams.billStatus = ''
  queryParams.page = 1
  loadTableData()
}

// 生成账单按钮点击
const handleGenerateBill = () => {
  // 如果是普通用户，自动填入自己的账户ID
  if (!isAdminUser.value) {
    generateForm.accountId = currentAccountId.value
  } else {
    generateForm.accountId = ''
  }
  
  generateForm.currentReading = 0
  generateForm.previousReading = 0
  generateDialogVisible.value = true
}

// 缴费按钮点击
const handlePay = (row) => {
  // 验证用户是否有权限缴费 - 管理员可以缴纳所有账单，用户可以缴纳自己的账单
  if (!isAdminUser.value && row.accountId.toString() !== currentAccountId.value.toString()) {
    showNoPermissionMessage()
    return
  }
  
  payForm.billId = row.billId || ''
  payForm.accountId = row.accountId || ''
  payForm.readingDate = row.readingDate || ''
  payForm.waterUsage = row.waterUsage || 0
  payForm.amount = row.amount || 0
  payForm.paymentAmount = row.amount || 0
  payForm.paymentMethod = '线上缴费'
  payDialogVisible.value = true
}

// 生成账单对话框提交
const handleGenerateSubmit = async () => {
  try {
    // 如果是普通用户，确保只能为自己生成账单
    if (!isAdminUser.value && generateForm.accountId !== currentAccountId.value) {
      ElMessage.warning('普通用户只能为自己生成账单')
      generateForm.accountId = currentAccountId.value
    }
    
    await generateWaterBill({
      accountId: generateForm.accountId,
      currentReading: generateForm.currentReading,
      previousReading: generateForm.previousReading
    })
    ElMessage.success('账单生成成功')
    generateDialogVisible.value = false
    loadTableData()
  } catch (error) {
    console.error('生成账单失败', error)
  }
}

// 缴费对话框提交
const handlePaySubmit = async () => {
  try {
    // 再次验证用户权限
    if (!isAdminUser.value && payForm.accountId.toString() !== currentAccountId.value.toString()) {
      ElMessage.warning('普通用户只能缴纳自己的账单')
      payDialogVisible.value = false
      return
    }
    
    const { data } = await payWaterBill(payForm.billId, payForm)
    if (data) {
      ElMessage.success('支付成功')
      payDialogVisible.value = false
      loadTableData()
    }
  } catch (error) {
    console.error('支付失败', error)
    // 本地模式下模拟支付成功
    if (localStorage.getItem('localMode') === 'true') {
      ElMessage.success('本地模式：支付成功（模拟）')
      payDialogVisible.value = false
      loadTableData()
    } else {
      ElMessage.error('支付失败')
    }
  }
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

// 组件挂载时加载数据
onMounted(() => {
  // 非管理员用户只能查看自己的账单，强制设置accountId
  if (!isAdminUser.value) {
    queryParams.accountId = currentAccountId.value
  }
  
  loadTableData()
})
</script>

<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-card class="search-card">
      <el-form :model="queryParams" ref="queryForm" :inline="true" class="search-form">
        <el-form-item label="账户ID" prop="accountId">
          <el-input 
            v-model="queryParams.accountId" 
            placeholder="请输入账户ID" 
            clearable 
            :disabled="!isAdminUser"
          />
        </el-form-item>
        <el-form-item label="账单状态" prop="billStatus">
          <el-select v-model="queryParams.billStatus" placeholder="请选择账单状态" clearable>
            <el-option
              v-for="item in billStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <div class="search-buttons">
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 表格工具栏 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">水费账单列表</span>
          <el-button type="primary" @click="handleGenerateBill">生成账单</el-button>
        </div>
      </template>
      
      <!-- 表格区域 -->
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
        <el-table-column prop="billId" label="账单编号" min-width="90" align="center" />
        <el-table-column prop="accountId" label="账户ID" min-width="80" align="center" />
        <el-table-column label="抄表日期" min-width="100" align="center">
          <template #default="scope">
            {{ formatDate(scope.row.readingDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="waterUsage" label="用水量" min-width="100" align="right">
          <template #default="scope">
            <span class="amount-value">{{ scope.row.waterUsage || 0 }} 立方米</span>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="账单金额" min-width="100" align="right">
          <template #default="scope">
            <span class="amount-value">¥ {{ (scope.row.amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="billStatus" label="账单状态" min-width="90" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.billStatus === '已缴' ? 'success' : 'danger'" effect="plain">
              {{ scope.row.billStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="100" fixed="right" align="center">
          <template #default="scope">
            <el-button 
              v-if="scope.row.billStatus === '未缴'"
              type="primary" 
              link
              @click="handlePay(scope.row)"
              size="small"
            >
              缴费
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

    <!-- 生成账单对话框 -->
    <el-dialog
      v-model="generateDialogVisible"
      title="生成水费账单"
      width="500px"
      append-to-body
    >
      <el-form :model="generateForm" label-width="100px">
        <el-form-item label="账户ID" prop="accountId">
          <el-input 
            v-model="generateForm.accountId" 
            placeholder="请输入账户ID" 
            :disabled="!isAdminUser"
          />
        </el-form-item>
        <el-form-item label="本期读数" prop="currentReading">
          <el-input-number 
            v-model="generateForm.currentReading" 
            :min="0" 
            :precision="2" 
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="上期读数" prop="previousReading">
          <el-input-number 
            v-model="generateForm.previousReading" 
            :min="0" 
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="用水量">
          <el-input :value="(generateForm.currentReading - generateForm.previousReading).toFixed(2)" disabled>
            <template #append>立方米</template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="generateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleGenerateSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 缴费对话框 -->
    <el-dialog
      v-model="payDialogVisible"
      title="水费缴纳"
      width="500px"
      append-to-body
    >
      <el-form :model="payForm" label-width="100px">
        <el-form-item label="账单编号">
          <el-input v-model="payForm.billId" disabled />
        </el-form-item>
        <el-form-item label="账户ID">
          <el-input v-model="payForm.accountId" disabled />
        </el-form-item>
        <el-form-item label="用水量">
          <el-input v-model="payForm.waterUsage" disabled>
            <template #append>立方米</template>
          </el-input>
        </el-form-item>
        <el-form-item label="应缴金额">
          <el-input v-model="payForm.amount" disabled>
            <template #prepend>¥</template>
          </el-input>
        </el-form-item>
        <el-form-item label="缴费金额" prop="paymentAmount">
          <el-input-number 
            v-model="payForm.paymentAmount" 
            :min="0" 
            :precision="2"
            style="width: 100%"
          >
            <template #prefix>¥</template>
          </el-input-number>
        </el-form-item>
        <el-form-item label="缴费方式" prop="paymentMethod">
          <el-select v-model="payForm.paymentMethod" style="width: 100%">
            <el-option label="线上缴费" value="线上缴费" />
            <el-option label="线下缴费" value="线下缴费" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="payDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handlePaySubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
  box-sizing: border-box;
  gap: 10px;
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

.pagination-container {
  margin-top: 20px;
  padding: 10px 0;
  display: flex !important;
  justify-content: flex-end;
  align-items: center;
}

/* 确保el-card__body占满高度 */
:deep(.el-card__body) {
  height: calc(100% - 60px);
  display: flex;
  flex-direction: column;
  padding: 15px;
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

/* 操作按钮组样式 */
:deep(.el-button--text) {
  padding: 4px 8px;
}

/* 响应式布局优化 */
@media screen and (max-width: 768px) {
  .app-container {
    padding: 10px;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 10px;
  }
}
</style> 