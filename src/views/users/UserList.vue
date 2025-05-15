<script setup>
import { ref, onMounted, reactive } from 'vue'
import { getUsersByPage, deleteUser, addUser, updateUser } from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'

// 查询参数
const queryParams = reactive({
  userId: '',  // 新增用户ID查询字段
  userName: '',
  userType: '',
  page: 1,
  pageSize: 10
})

// 表格数据
const tableData = ref([])
const total = ref(0)
const loading = ref(false)

// 用户类型选项
const userTypeOptions = [
  { value: '个人', label: '个人' },
  { value: '单位', label: '单位' },
  { value: '小区物业', label: '小区物业' }
]

// 对话框控制
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogForm = reactive({
  userId: '',
  userName: '',
  userType: '',
  contactInfo: '',
  address: ''
})

// 加载表格数据
const loadTableData = async () => {
  loading.value = true
  try {
    console.log('发送查询参数:', queryParams)
    const res = await getUsersByPage(queryParams)
    console.log('用户列表响应数据:', res)
    
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
    console.error('加载用户数据失败', error)
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
  queryParams.userId = ''
  queryParams.userName = ''
  queryParams.userType = ''
  queryParams.page = 1
  loadTableData()
}

// 添加用户按钮点击
const handleAdd = () => {
  dialogTitle.value = '添加用户'
  dialogForm.userId = ''
  dialogForm.userName = ''
  dialogForm.userType = ''
  dialogForm.contactInfo = ''
  dialogForm.address = ''
  dialogVisible.value = true
}

// 编辑用户按钮点击
const handleEdit = (row) => {
  dialogTitle.value = '编辑用户'
  dialogForm.userId = row.userId || ''
  dialogForm.userName = row.userName || ''
  dialogForm.userType = row.userType || ''
  dialogForm.contactInfo = row.contactInfo || ''
  dialogForm.address = row.address || ''
  dialogVisible.value = true
}

// 删除用户按钮点击
const handleDelete = (row) => {
  ElMessageBox.confirm(`确认删除用户 ${row.userName}?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await deleteUser(row.userId)
      console.log('删除用户响应:', res)
      ElMessage.success('删除成功')
      loadTableData()
    } catch (error) {
      console.error('删除失败', error)
      // 错误已由errorHandler处理
    }
  }).catch(() => {})
}

// 对话框提交
const handleSubmit = async () => {
  try {
    let res;
    if (dialogForm.userId) {
      // 编辑用户
      res = await updateUser(dialogForm.userId, {
        userName: dialogForm.userName,
        userType: dialogForm.userType,
        contactInfo: dialogForm.contactInfo,
        address: dialogForm.address
      })
      console.log('更新用户响应:', res)
      ElMessage.success('用户更新成功')
    } else {
      // 添加用户
      res = await addUser({
        userName: dialogForm.userName,
        userType: dialogForm.userType,
        contactInfo: dialogForm.contactInfo,
        address: dialogForm.address
      })
      console.log('添加用户响应:', res)
      ElMessage.success('用户添加成功')
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
            <el-form-item label="用户ID" prop="userId">
              <el-input v-model="queryParams.userId" placeholder="请输入用户ID" clearable />
            </el-form-item>
            <el-form-item label="用户姓名" prop="userName">
              <el-input v-model="queryParams.userName" placeholder="请输入用户姓名" clearable />
            </el-form-item>
            <el-form-item label="用户类型" prop="userType">
              <el-select v-model="queryParams.userType" placeholder="请选择用户类型" clearable>
                <el-option
                  v-for="item in userTypeOptions"
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
          <span class="card-title">用户列表</span>
          <div class="button-group">
            <el-button type="primary" @click="handleAdd">添加用户</el-button>
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
        <el-table-column prop="userId" label="用户ID" width="100" />
        <el-table-column prop="userName" label="用户姓名" width="150" />
        <el-table-column prop="userType" label="用户类型" width="120" />
        <el-table-column prop="contactInfo" label="联系方式" width="150" />
        <el-table-column prop="address" label="地址" min-width="200" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button 
              type="primary" 
              link
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button 
              type="danger" 
              link
              @click="handleDelete(scope.row)"
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
        <el-form-item label="用户姓名" prop="userName">
          <el-input v-model="dialogForm.userName" placeholder="请输入用户姓名" />
        </el-form-item>
        <el-form-item label="用户类型" prop="userType">
          <el-select v-model="dialogForm.userType" placeholder="请选择用户类型">
            <el-option
              v-for="item in userTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="联系方式" prop="contactInfo">
          <el-input v-model="dialogForm.contactInfo" placeholder="请输入联系方式" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="dialogForm.address" placeholder="请输入地址" />
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
  text-align: right;
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