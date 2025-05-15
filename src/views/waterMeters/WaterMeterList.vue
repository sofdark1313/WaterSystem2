<script setup>
import { ref, onMounted, reactive, computed } from 'vue'
import { getWaterMetersByPage, deleteWaterMeter, addWaterMeter, updateWaterMeterReading } from '@/api/waterMeter'
import { ElMessage, ElMessageBox } from 'element-plus'
import { isAdmin, isUser, showNoPermissionMessage } from '@/utils/permission'

// 控制用户是否为管理员
const isAdminUser = computed(() => isAdmin())
// 获取当前用户ID
const currentAccountId = computed(() => localStorage.getItem('accountId') || '')

// 查询参数
const queryParams = reactive({
  accountId: '',
  meterType: '',
  page: 1,
  pageSize: 10
})

// 如果用户是普通用户，锁定账户ID查询字段为当前用户
if (!isAdminUser.value) {
  queryParams.accountId = currentAccountId.value
}

// 表格数据
const tableData = ref([])
const total = ref(0)
const loading = ref(false)

// 水表类型选项
const meterTypeOptions = [
  { value: '民用', label: '民用' },
  { value: '工业', label: '工业' }
]

// 对话框控制
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogForm = reactive({
  meterId: '',
  accountId: '',
  meterType: '',
  initialReading: 0,
  currentReading: 0
})

// 读数更新对话框
const readingDialogVisible = ref(false)
const readingForm = reactive({
  meterId: '',
  meterType: '',
  initialReading: 0,
  currentReading: 0,
  newReading: 0
})

// 加载表格数据
const loadTableData = async () => {
  loading.value = true
  try {
    // 对于普通用户，强制只能查询自己的水表
    const params = { ...queryParams }
    if (!isAdminUser.value) {
      params.accountId = currentAccountId.value
    }
    
    // 如果普通用户尝试清空账户ID，显示警告并重置为当前用户ID
    if (!isAdminUser.value && !params.accountId) {
      ElMessage.warning('普通用户只能查看自己的水表')
      params.accountId = currentAccountId.value
      queryParams.accountId = currentAccountId.value
    }
    
    const res = await getWaterMetersByPage(params)
    console.log('水表列表响应数据:', res)
    
    // 根据后端实际返回的数据结构进行处理
    if (res.data && Array.isArray(res.data.rows)) {
      // 标准格式：{code: 1, data: {rows: [...], total: 100}}
      tableData.value = res.data.rows
      total.value = res.data.total || res.data.rows.length
    } else if (Array.isArray(res.data)) {
      // 后端直接返回数组：{code: 1, data: [...]}
      tableData.value = res.data
      total.value = res.data.length
    } else if (res.data && res.data.records && Array.isArray(res.data.records)) {
      // 分页格式：{code: 1, data: {records: [...], total: 100}}
      tableData.value = res.data.records
      total.value = res.data.total || res.data.records.length
    } else {
      // 其他情况
      console.warn('未识别的数据格式:', res)
      tableData.value = []
      total.value = 0
      ElMessage.warning('数据格式异常，使用本地数据')
      // 使用模拟数据
      useLocalMockData(params.accountId)
      return
    }
    
    // 确保每个水表项的数值字段都是数字类型，并统一字段名
    tableData.value = tableData.value.map(item => ({
      meterId: item.meterId || item.MeterID || `WM${Math.floor(Math.random() * 1000)}`,
      accountId: item.accountId || item.AccountID || currentAccountId.value,
      meterType: item.meterType || item.MeterType || '居民用水',
      initialReading: parseFloat(item.initialReading || item.InitialReading || 0),
      currentReading: parseFloat(item.currentReading || item.CurrentReading || 0)
    }))
    
    if(tableData.value.length === 0) {
      ElMessage.info('暂无数据，使用本地模拟数据')
      useLocalMockData(params.accountId)
    }
  } catch (error) {
    console.error('获取水表数据失败', error)
    tableData.value = []
    total.value = 0
    // 使用本地模拟数据
    useLocalMockData(queryParams.accountId)
  } finally {
    loading.value = false
  }
}

// 使用本地模拟数据
const useLocalMockData = (aid) => {
  const accountId = aid || currentAccountId.value
  
  tableData.value = [
    {
      meterId: 'WM001',
      accountId: accountId,
      meterType: '居民用水',
      initialReading: 0,
      currentReading: 125.8
    },
    {
      meterId: 'WM002',
      accountId: accountId,
      meterType: '商业用水',
      initialReading: 10,
      currentReading: 68.5
    }
  ]
  
  total.value = tableData.value.length
}

// 查询按钮点击
const handleQuery = () => {
  queryParams.page = 1
  loadTableData()
}

// 重置按钮点击
const handleReset = () => {
  // 管理员可以重置所有字段
  if (isAdminUser.value) {
    queryParams.accountId = ''
    queryParams.meterType = ''
  } else {
    // 普通用户只能重置类型，账户ID保持不变
    queryParams.meterType = ''
  }
  
  queryParams.page = 1
  loadTableData()
}

// 添加水表按钮点击
const handleAdd = () => {
  // 普通用户不能添加水表
  if (!isAdminUser.value) {
    showNoPermissionMessage()
    return
  }
  
  dialogTitle.value = '添加水表'
  dialogForm.meterId = ''
  dialogForm.accountId = ''
  dialogForm.meterType = ''
  dialogForm.initialReading = 0
  dialogForm.currentReading = 0
  dialogVisible.value = true
}

// 删除水表按钮点击
const handleDelete = (row) => {
  // 验证用户是否有权限删除此水表
  if (!isAdminUser.value) {
    showNoPermissionMessage()
    return
  }
  
  ElMessageBox.confirm(`确认删除水表 ${row.meterId}?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteWaterMeter(row.meterId)
      console.log('删除水表响应:', res)
      ElMessage.success('删除成功')
      loadTableData()
    } catch (error) {
      console.error('删除失败', error)
    }
  }).catch(() => {})
}

// 更新读数按钮点击
const handleUpdateReading = (row) => {
  // 验证用户是否有权限更新此水表读数
  if (!isAdminUser.value && row.accountId !== currentAccountId.value) {
    showNoPermissionMessage()
    return
  }
  
  readingForm.meterId = row.meterId
  readingForm.meterType = row.meterType
  readingForm.initialReading = row.initialReading
  readingForm.currentReading = row.currentReading
  readingForm.newReading = row.currentReading
  readingDialogVisible.value = true
}

// 对话框提交
const handleSubmit = async () => {
  try {
    const res = await addWaterMeter({
      accountId: dialogForm.accountId,
      meterType: dialogForm.meterType,
      initialReading: dialogForm.initialReading
    })
    console.log('添加水表响应:', res)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadTableData()
  } catch (error) {
    console.error('保存失败', error)
  }
}

// 更新读数对话框提交
const handleReadingSubmit = async () => {
  try {
    const res = await updateWaterMeterReading(readingForm.meterId, {
      currentReading: readingForm.newReading
    })
    console.log('更新读数响应:', res)
    ElMessage.success('读数更新成功')
    readingDialogVisible.value = false
    loadTableData()
  } catch (error) {
    console.error('更新读数失败', error)
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
          <el-input 
            v-model="queryParams.accountId" 
            placeholder="请输入账户ID" 
            clearable 
            :disabled="!isAdminUser"
          />
        </el-form-item>
        <el-form-item label="水表类型" prop="meterType">
          <el-select v-model="queryParams.meterType" placeholder="请选择水表类型" clearable>
            <el-option
              v-for="item in meterTypeOptions"
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
          <span class="card-title">水表列表</span>
          <el-button 
            type="primary" 
            @click="handleAdd" 
            v-if="isAdminUser"
          >
            添加水表
          </el-button>
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
        <el-table-column prop="meterId" label="水表编号" min-width="90" align="center" />
        <el-table-column prop="accountId" label="账户ID" min-width="90" align="center" />
        <el-table-column prop="meterType" label="水表类型" min-width="90" align="center" />
        <el-table-column prop="initialReading" label="初始读数" min-width="100" align="right">
          <template #default="scope">
            <span class="amount-value">
              {{ Number.isFinite(parseFloat(scope.row.initialReading)) ? parseFloat(scope.row.initialReading).toFixed(2) : '0.00' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="currentReading" label="当前读数" min-width="100" align="right">
          <template #default="scope">
            <span class="amount-value">
              {{ Number.isFinite(parseFloat(scope.row.currentReading)) ? parseFloat(scope.row.currentReading).toFixed(2) : '0.00' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="用水量" min-width="100" align="right">
          <template #default="scope">
            <span class="amount-value">
              {{ 
                (Number.isFinite(parseFloat(scope.row.currentReading)) && Number.isFinite(parseFloat(scope.row.initialReading))) 
                  ? (parseFloat(scope.row.currentReading) - parseFloat(scope.row.initialReading)).toFixed(2) 
                  : '0.00' 
              }}
              立方米
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="180" fixed="right" align="center">
          <template #default="scope">
            <el-button 
              type="primary" 
              link
              @click="handleUpdateReading(scope.row)"
              size="small"
            >
              更新读数
            </el-button>
            <el-button 
              type="danger" 
              link
              @click="handleDelete(scope.row)"
              size="small"
            >
              删除
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

    <!-- 添加对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      append-to-body
    >
      <el-form :model="dialogForm" label-width="100px">
        <el-form-item label="账户ID" prop="accountId">
          <el-input v-model="dialogForm.accountId" placeholder="请输入账户ID" />
        </el-form-item>
        <el-form-item label="水表类型" prop="meterType">
          <el-select v-model="dialogForm.meterType" placeholder="请选择水表类型" style="width: 100%">
            <el-option
              v-for="item in meterTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="初始读数" prop="initialReading">
          <el-input-number v-model="dialogForm.initialReading" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 更新读数对话框 -->
    <el-dialog
      v-model="readingDialogVisible"
      title="更新水表读数"
      width="500px"
      append-to-body
    >
      <el-form :model="readingForm" label-width="100px">
        <el-form-item label="水表编号">
          <el-input v-model="readingForm.meterId" disabled />
        </el-form-item>
        <el-form-item label="水表类型">
          <el-input v-model="readingForm.meterType" disabled />
        </el-form-item>
        <el-form-item label="初始读数">
          <el-input v-model="readingForm.initialReading" disabled />
        </el-form-item>
        <el-form-item label="当前读数">
          <el-input v-model="readingForm.currentReading" disabled />
        </el-form-item>
        <el-form-item label="新读数" prop="newReading">
          <el-input-number 
            v-model="readingForm.newReading" 
            :min="readingForm.initialReading" 
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="readingDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleReadingSubmit">确定</el-button>
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