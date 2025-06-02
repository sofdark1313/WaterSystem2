<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Phone, Key } from '@element-plus/icons-vue'

const router = useRouter()

// 表单数据
const formData = reactive({
  phone: '',
  verificationCode: '',
  newPassword: ''
})

// 表单规则
const rules = {
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

const formRef = ref(null)
const loading = ref(false)
const countdown = ref(0)
const timer = ref(null)

// 发送验证码
const sendVerificationCode = () => {
  formRef.value.validateField('phone', (valid) => {
    if (!valid) {
      // 开始倒计时
      countdown.value = 60
      timer.value = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer.value)
        }
      }, 1000)
      
      // 模拟发送验证码
      setTimeout(() => {
        ElMessage.success('验证码已发送到您的手机')
      }, 1000)
    }
  })
}

// 重置密码
const resetPassword = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      
      // 模拟API调用
      setTimeout(() => {
        loading.value = false
        ElMessage.success('密码重置成功，请使用新密码登录')
        router.push('/login')
      }, 1500)
    }
  })
}

// 返回登录页
const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="forgot-password-container">
    <div class="forgot-password-box">
      <div class="forgot-password-header">
        <img src="/logo.png" alt="Logo" class="forgot-password-logo">
        <h2 class="forgot-password-title">找回密码</h2>
        <p class="forgot-password-subtitle">重置您的账户密码</p>
      </div>
      
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        class="forgot-password-form"
      >
        <el-form-item prop="phone">
          <el-input
            v-model="formData.phone"
            placeholder="请输入注册手机号"
            size="large"
          >
            <template #prefix>
              <el-icon><Phone /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="verificationCode">
          <div class="verification-code-row">
            <el-input
              v-model="formData.verificationCode"
              placeholder="请输入验证码（wc666）"
              size="large"
            >
              <template #prefix>
                <el-icon><Key /></el-icon>
              </template>
            </el-input>
            <el-button 
              type="primary" 
              :disabled="countdown > 0"
              @click="sendVerificationCode"
            >
              {{ countdown > 0 ? `${countdown}秒后重新获取` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item prop="newPassword">
          <el-input
            v-model="formData.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
            size="large"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            :loading="loading"
            class="reset-button"
            size="large"
            @click="resetPassword"
          >
            重置密码
          </el-button>
        </el-form-item>
        
        <div class="login-link">
          想起密码了？<a href="#" @click.prevent="goToLogin">返回登录</a>
        </div>
      </el-form>
      
      <div class="forgot-password-footer">
        <p>© {{ new Date().getFullYear() }} 水务管理系统</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forgot-password-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to right, #1890ff, #36cfc9);
  position: relative;
  overflow: hidden;
}

.forgot-password-container::before {
  content: '';
  position: absolute;
  width: 300%;
  height: 300%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 80%);
  top: -100%;
  left: -100%;
  animation: wave 15s infinite linear;
}

@keyframes wave {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.forgot-password-box {
  width: 400px;
  padding: 30px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 10;
  backdrop-filter: blur(10px);
}

.forgot-password-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.forgot-password-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 15px;
  border-radius: 50%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 5px;
  background: white;
}

.forgot-password-title {
  font-size: 24px;
  color: #303133;
  text-align: center;
  margin: 0;
  font-weight: 600;
}

.forgot-password-subtitle {
  font-size: 14px;
  color: #606266;
  margin-top: 10px;
}

.forgot-password-form {
  margin-bottom: 20px;
}

.forgot-password-form :deep(.el-input__wrapper) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.forgot-password-form :deep(.el-input__inner) {
  height: 45px;
}

.verification-code-row {
  display: flex;
  gap: 10px;
}

.verification-code-row .el-input {
  flex: 1;
}

.reset-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  letter-spacing: 1px;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(24, 144, 255, 0.3);
  transition: all 0.3s;
}

.reset-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(24, 144, 255, 0.4);
}

.login-link {
  text-align: center;
  margin-top: 15px;
  font-size: 14px;
  color: #606266;
}

.login-link a {
  color: #1890ff;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}

.forgot-password-footer {
  text-align: center;
  margin-top: 20px;
  color: #606266;
  font-size: 14px;
}
</style>