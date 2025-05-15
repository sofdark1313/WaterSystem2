<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUserById, updateUser } from '@/api/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userId = route.params.id

// 用户数据
const userForm = ref({
  UserID: '',
  UserName: '',
  UserType: '',
  ContactInfo: '',
  Address: ''
})

// 用户类型选项
const userTypeOptions = [
  { value: '个人', label: '个人' },
  { value: '单位', label: '单位' },
  { value: '小区物业', label: '小区物业' }
]

const loading = ref(false)

// 获取用户详情
const getUserDetail = async () => {
  loading.value = true
  try {
    const res = await getUserById(userId)
    userForm.value = res.data
  } catch (error) {
    console.error('获取用户详情失败', error)
  } finally {
    loading.value = false
  }
}

// 保存用户信息
const saveUserInfo = async () => {
  try {
    await updateUser(userId, {
      userName: userForm.value.UserName,
      userType: userForm.value.UserType,
      contactInfo: userForm.value.ContactInfo,
      address: userForm.value.Address
    })
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存用户信息失败', error)
  }
}

// 返回列表
const goBack = () => {
  router.push('/users')
}

onMounted(() => {
  getUserDetail()
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>用户详情</span>
          <div>
            <el-button @click="goBack">返回</el-button>
            <el-button type="primary" @click="saveUserInfo">保存</el-button>
          </div>
        </div>
      </template>
      
      <el-form :model="userForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户ID">
              <el-input v-model="userForm.UserID" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户姓名">
              <el-input v-model="userForm.UserName" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户类型">
              <el-select v-model="userForm.UserType" style="width: 100%">
                <el-option
                  v-for="item in userTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系方式">
              <el-input v-model="userForm.ContactInfo" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="地址">
          <el-input v-model="userForm.Address" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.app-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 