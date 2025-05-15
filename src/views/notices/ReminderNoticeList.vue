<script setup>
import { ref, onMounted, reactive } from 'vue'
import { getReminderNotices, sendReminderNotice } from '@/api/waterBill'
import { ElMessage, ElMessageBox } from 'element-plus'

// 查询参数
const queryParams = reactive({
  accountId: '',
  noticeStatus: '',
  page: 1,
  pageSize: 10
})

// 表格数据
const tableData = ref([])
const total = ref(0)
const loading = ref(false)

// 通知状态选项
const noticeStatusOptions = [
  { value: '已发送', label: '已发送' },
  { value: '未发送', label: '未发送' }
]

// 发送通知对话框
const sendDialogVisible = ref(false)
const sendForm = reactive({
  accountId: '',
  arrearsAmount: 0
})

// 加载表格数据
const loadTableData = async () => {
  loading.value = true
  try {
    const res = await getReminderNotices(queryParams)
    console.log('欠费通知列表响应数据:', res)
    
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
    
    if(tableData.value.length === 0) {
      ElMessage.info('暂无数据')
    }
  } catch (error) {
    console.error('加载欠费通知数据失败', error)
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 查询按钮点击
const handleQuery = () => {
  queryParams.page = 1
  loadTableData()
}

// 重置按钮点击
const handleReset = () => {
  queryParams.accountId = ''
  queryParams.noticeStatus = ''
  queryParams.page = 1
  loadTableData()
}

// 发送通知按钮点击
const handleSendNotice = () => {
  sendForm.accountId = ''
  sendForm.arrearsAmount = 0
  sendDialogVisible.value = true
}

// 发送通知对话框提交
const handleSendSubmit = async () => {
  try {
    await sendReminderNotice({
      accountId: sendForm.accountId,
      arrearsAmount: sendForm.arrearsAmount
    })
    ElMessage.success('欠费通知发送成功')
    sendDialogVisible.value = false
    loadTableData()
  } catch (error) {
    console.error('发送欠费通知失败', error)
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
  loadTableData()
})
</script>

<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-card class="search-card">
      <el-form :model="queryParams" ref="queryForm" :inline="true" class="search-form">
        <el-form-item label="账户ID" prop="accountId">
          <el-input v-model="queryParams.accountId" placeholder="请输入账户ID" clearable />
        </el-form-item>
        <el-form-item label="通知状态" prop="noticeStatus">
          <el-select v-model="queryParams.noticeStatus" placeholder="请选择通知状态" clearable style="width: 100%">
            <el-option
              v-for="item in noticeStatusOptions"
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
          <span class="card-title">欠费通知列表</span>
          <div class="button-group">
            <el-button type="primary" @click="handleSendNotice">发送通知</el-button>
          </div>
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
        <el-table-column prop="noticeId" label="通知编号" min-width="90" align="center" />
        <el-table-column prop="accountId" label="账户ID" min-width="80" align="center" />
        <el-table-column label="通知日期" min-width="100" align="center">
          <template #default="scope">
            {{ formatDate(scope.row.noticeDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="arrearsAmount" label="欠费金额" min-width="100" align="right">
          <template #default="scope">
            <span class="amount-value">¥ {{ (scope.row.arrearsAmount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="noticeStatus" label="通知状态" min-width="90" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.noticeStatus === '已发送' ? 'success' : 'warning'" effect="plain">
              {{ scope.row.noticeStatus }}
            </el-tag>
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

    <!-- 发送通知对话框 -->
    <el-dialog
      v-model="sendDialogVisible"
      title="发送欠费通知"
      width="500px"
      append-to-body
    >
      <el-form :model="sendForm" label-width="100px">
        <el-form-item label="账户ID" prop="accountId">
          <el-input v-model="sendForm.accountId" placeholder="请输入账户ID" />
        </el-form-item>
        <el-form-item label="欠费金额" prop="arrearsAmount">
          <el-input-number 
            v-model="sendForm.arrearsAmount" 
            :min="0" 
            :precision="2"
            style="width: 100%"
          >
            <template #prefix>¥</template>
          </el-input-number>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="sendDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSendSubmit">确定</el-button>
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

.button-group {
  display: flex;
  gap: 10px;
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
  
  .button-group {
    width: 100%;
  }
  
  :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style> 