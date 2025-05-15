<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { getAccountsByPage, deleteAccount, addAccount, updateAccount } from '@/api/account'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

// 查询参数
const queryParams = reactive({
  account: '',
  accountStatus: '',
  accountId: '',
  userId: '',
  page: 1,
  pageSize: 10
})

// 表格数据
const tableData = ref([])
const total = ref(0)
const loading = ref(false)

// 账户状态选项
const accountStatusOptions = [
  { value: '正常', label: '正常' },
  { value: '欠费', label: '欠费' }
]

// 对话框控制
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogForm = reactive({
  accountId: '',
  userId: '',
  account: '',
  balance: 0,
  accountStatus: '正常'
})

// 加载表格数据
const loadTableData = async () => {
  loading.value = true
  try {
    console.log('发送查询参数:', queryParams)
    const res = await getAccountsByPage(queryParams)
    console.log('账户列表响应数据:', res)
    
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
    console.error('加载账户数据失败', error)
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
  queryParams.account = ''
  queryParams.accountStatus = ''
  queryParams.accountId = ''
  queryParams.userId = ''
  queryParams.page = 1
  loadTableData()
}

// 添加账户按钮点击
const handleAdd = () => {
  dialogTitle.value = '添加账户'
  dialogForm.accountId = ''
  dialogForm.userId = ''
  dialogForm.account = ''
  dialogForm.balance = 0
  dialogForm.accountStatus = '正常'
  dialogVisible.value = true
}

// 编辑账户按钮点击
const handleEdit = (row) => {
  dialogTitle.value = '编辑账户'
  dialogForm.accountId = row.accountId || ''
  dialogForm.userId = row.userId || ''
  dialogForm.account = row.accountName || ''
  dialogForm.balance = row.balance || 0
  dialogForm.accountStatus = row.accountStatus || '正常'
  dialogVisible.value = true
}

// 删除账户按钮点击
const handleDelete = (row) => {
  const accountId = row.accountId
  ElMessageBox.confirm(`确认删除账户 ${accountId}?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteAccount(accountId)
      console.log('删除账户响应:', res)
      ElMessage.success('删除成功')
      loadTableData()
    } catch (error) {
      console.error('删除失败', error)
      // 错误已由errorHandler处理
    }
  }).catch(() => {})
}

// 查看账户详情
const handleViewDetail = (row) => {
  const accountId = row.accountId
  router.push(`/accounts/${accountId}`)
}

// 对话框提交
const handleSubmit = async () => {
  try {
    let res;
    if (dialogForm.accountId) {
      // 编辑账户
      res = await updateAccount(dialogForm.accountId, {
        account: dialogForm.account,
        balance: dialogForm.balance,
        accountStatus: dialogForm.accountStatus
      })
      console.log('更新账户响应:', res)
      ElMessage.success('账户更新成功')
    } else {
      // 添加账户
      res = await addAccount({
        userId: dialogForm.userId,
        account: dialogForm.account,
        balance: dialogForm.balance,
        accountStatus: dialogForm.accountStatus
      })
      console.log('添加账户响应:', res)
      ElMessage.success('账户添加成功')
    }
    dialogVisible.value = false
    loadTableData()
  } catch (error) {
    console.error('保存失败', error)
    // 错误已由errorHandler处理，此处不需要额外提示
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
      <el-form :model="queryParams" ref="queryForm" class="search-form">
        <div class="search-row">
          <div class="search-fields">
            <el-form-item label="账户ID" prop="accountId">
              <el-input v-model="queryParams.accountId" placeholder="请输入账户ID" clearable />
            </el-form-item>
            <el-form-item label="用户ID" prop="userId">
              <el-input v-model="queryParams.userId" placeholder="请输入用户ID" clearable />
            </el-form-item>
            <el-form-item label="账户名称" prop="account">
              <el-input v-model="queryParams.account" placeholder="请输入账户名称" clearable />
            </el-form-item>
            <el-form-item label="账户状态" prop="accountStatus">
              <el-select v-model="queryParams.accountStatus" placeholder="请选择账户状态" clearable>
                <el-option
                  v-for="item in accountStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>
          <div class="search-buttons">
            <el-button type="primary" @click="handleQuery">
              <el-icon><Search /></el-icon>查询
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
          </div>
        </div>
      </el-form>
    </el-card>

    <!-- 表格工具栏 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">账户列表</span>
          <div class="button-group">
            <el-button type="primary" @click="handleAdd">添加账户</el-button>
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
        <el-table-column prop="accountId" label="账户ID" min-width="90" align="center" />
        <el-table-column prop="userId" label="用户ID" min-width="90" align="center" />
        <el-table-column prop="accountName" label="账户名称" min-width="120" show-overflow-tooltip />
        <el-table-column label="账户余额" min-width="120" align="right">
          <template #default="scope">
            <span class="amount-value">¥ {{ Number(scope.row.balance || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="账户状态" min-width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.accountStatus === '正常' ? 'success' : 'danger'" effect="plain">
              {{ scope.row.accountStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="180" fixed="right" align="center">
          <template #default="scope">
            <el-button 
              type="primary" 
              link
              @click="handleViewDetail(scope.row)"
              size="small"
            >
              详情
            </el-button>
            <el-button 
              type="primary" 
              link
              @click="handleEdit(scope.row)"
              size="small"
            >
              编辑
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

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      append-to-body
    >
      <el-form :model="dialogForm" label-width="100px">
        <el-form-item v-if="dialogForm.accountId" label="账户ID">
          <el-input v-model="dialogForm.accountId" disabled />
        </el-form-item>
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="dialogForm.userId" placeholder="请输入用户ID" :disabled="!!dialogForm.accountId" />
        </el-form-item>
        <el-form-item label="账户名称" prop="account">
          <el-input v-model="dialogForm.account" placeholder="请输入账户名称" />
        </el-form-item>
        <el-form-item label="账户余额" prop="balance">
          <el-input-number 
            v-model="dialogForm.balance" 
            :precision="2" 
            :min="0"
            style="width: 100%" 
          >
            <template #prefix>¥</template>
          </el-input-number>
        </el-form-item>
        <el-form-item label="账户状态" prop="accountStatus">
          <el-select v-model="dialogForm.accountStatus" placeholder="请选择账户状态" style="width: 100%">
            <el-option
              v-for="item in accountStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
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
}

.search-header {
  padding: 8px 0;
}

.search-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.search-form {
  padding: 10px 0;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 15px;
}

.search-form :deep(.el-form-item__label) {
  font-weight: 500;
}

.search-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
}

.search-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  flex: 1;
}

.search-fields .el-form-item {
  margin-right: 0;
  margin-bottom: 10px;
  min-width: 200px;
  flex: 1;
  max-width: 250px;
}

.search-buttons {
  display: flex;
  gap: 10px;
  margin-left: 10px;
  padding-top: 2px;
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

.button-group {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  padding: 10px 0;
  display: flex !important;
  justify-content: flex-end;
  align-items: center;
}

.amount-value {
  font-weight: 500;
  color: #606266;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .search-buttons {
    flex-wrap: wrap;
    margin-top: 10px;
    justify-content: flex-end;
    width: 100%;
    margin-left: 0;
  }
  
  .search-fields {
    width: 100%;
  }
  
  .search-fields .el-form-item {
    max-width: 100%;
  }
  
  .search-form :deep(.el-form-item) {
    margin-bottom: 10px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .button-group {
    width: 100%;
  }
}
</style> 