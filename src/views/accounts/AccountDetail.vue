<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAccountById, updateAccount, updateAccountPassword } from '@/api/account'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const accountId = route.params.id

// 账户数据
const accountForm = ref({
  AccountID: '',
  UserID: '',
  Account: '',
  Balance: 0,
  AccountStatus: ''
})

// 修改密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 账户状态选项
const accountStatusOptions = [
  { value: '正常', label: '正常' },
  { value: '欠费', label: '欠费' }
]

const loading = ref(false)
const activeTab = ref('basic')

// 获取账户详情
const getAccountDetail = async () => {
  loading.value = true
  try {
    const res = await getAccountById(accountId)
    console.log('获取账户详情响应:', res)
    
    // 规范化处理数据，解决字段名不一致问题
    if (res.data) {
      accountForm.value = {
        AccountID: res.data.AccountID || res.data.accountId || accountId,
        UserID: res.data.UserID || res.data.userId || '',
        Account: res.data.Account || res.data.account || res.data.accountName || '',
        Balance: parseFloat(res.data.Balance || res.data.balance || 0),
        AccountStatus: res.data.AccountStatus || res.data.accountStatus || '正常'
      }
    } else {
      ElMessage.warning('未获取到账户数据')
    }
  } catch (error) {
    console.error('获取账户详情失败', error)
    ElMessage.error('获取账户详情失败')
  } finally {
    loading.value = false
  }
}

// 保存账户信息
const saveAccountInfo = async () => {
  try {
    await updateAccount(accountId, {
      account: accountForm.value.Account,
      balance: accountForm.value.Balance,
      accountStatus: accountForm.value.AccountStatus
    })
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存账户信息失败', error)
  }
}

// 修改密码
const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }
  
  try {
    await updateAccountPassword(accountId, {
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
  }
}

// 返回
const goBack = () => {
  router.go(-1)
}

onMounted(() => {
  getAccountDetail()
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading" class="detail-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">账户详情</span>
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="accountForm" label-width="120px" class="account-form">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="账户ID">
                  <el-input v-model="accountForm.AccountID" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="用户ID">
                  <el-input v-model="accountForm.UserID" disabled />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="账户名">
                  <el-input v-model="accountForm.Account" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="账户余额">
                  <el-input-number 
                    v-model="accountForm.Balance" 
                    :precision="2"
                    style="width: 100%"
                    :min="0"
                  >
                    <template #prefix>¥</template>
                  </el-input-number>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="账户状态">
              <el-select v-model="accountForm.AccountStatus" style="width: 100%">
                <el-option
                  v-for="item in accountStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveAccountInfo">保存信息</el-button>
            </el-form-item>
          </el-form>
          
          <!-- 账户信息摘要卡片 -->
          <el-card class="summary-card" shadow="hover">
            <div class="summary-content">
              <div class="summary-item">
                <div class="summary-label">账户余额</div>
                <div class="summary-value" :class="{'positive-balance': accountForm.Balance > 0, 'zero-balance': accountForm.Balance === 0}">
                  ¥ {{ Number(accountForm.Balance).toFixed(2) }}
                </div>
              </div>
              <div class="summary-item">
                <div class="summary-label">账户状态</div>
                <div class="summary-value">
                  <el-tag :type="accountForm.AccountStatus === '正常' ? 'success' : 'danger'" effect="light">
                    {{ accountForm.AccountStatus }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </el-tab-pane>
        
        <el-tab-pane label="修改密码" name="password">
          <el-form :model="passwordForm" label-width="120px" class="password-form">
            <el-form-item label="原密码">
              <el-input 
                v-model="passwordForm.oldPassword" 
                type="password"
                placeholder="请输入原密码" 
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input 
                v-model="passwordForm.newPassword" 
                type="password"
                placeholder="请输入新密码" 
                show-password
              />
            </el-form-item>
            <el-form-item label="确认新密码">
              <el-input 
                v-model="passwordForm.confirmPassword" 
                type="password"
                placeholder="请再次输入新密码" 
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="changePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
          
          <el-alert
            title="密码修改提示"
            type="info"
            description="为保证账户安全，请使用包含大小写字母、数字和特殊字符的组合密码"
            show-icon
            :closable="false"
            style="margin-top: 20px"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
.app-container {
  padding: 20px;
}

.detail-card {
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.account-form, .password-form {
  max-width: 800px;
  margin: 0 auto;
}

.detail-tabs {
  margin-top: 10px;
}

.summary-card {
  margin-top: 30px;
  background-color: #f9f9f9;
}

.summary-content {
  display: flex;
  justify-content: space-around;
  padding: 15px 0;
}

.summary-item {
  text-align: center;
}

.summary-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #606266;
}

.positive-balance {
  color: #67c23a;
}

.zero-balance {
  color: #909399;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .summary-content {
    flex-direction: column;
    gap: 20px;
  }
  
  .app-container {
    padding: 10px;
  }
}
</style> 