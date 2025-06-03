<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { register } from '@/api/auth'

const router = useRouter()

// 注册表单
const registerForm = reactive({
  accountId: '',
  name: '',
  phone: '',
  password: '',
  confirmPassword: '',
  verificationCode: ''
})

// 表单规则
const rules = {
  accountId: [
    { required: true, message: '请输入账户ID', trigger: 'blur' },
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  verificationCode: [
    { required: true, message: '请输入验证码（wc666）', trigger: 'blur' }
  ]
}

const registerFormRef = ref(null)
const loading = ref(false)
const countdown = ref(0)
const timer = ref(null)

// 发送验证码
const sendVerificationCode = () => {
  registerFormRef.value.validateField('phone', (valid) => {
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

// 注册处理
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      
      try {
        // 模拟API调用 - 实际项目中应替换为真实API
        // const res = await http.post('/auth/register', {
        //   accountId: registerForm.accountId,
        //   name: registerForm.name,
        //   phone: registerForm.phone,
        //   password: registerForm.password,
        //   verificationCode: registerForm.verificationCode
        // })
        
        // 模拟成功响应
        setTimeout(() => {
          loading.value = false
          ElMessage.success('注册成功，请登录')
          router.push('/login')
        }, 1500)
      } catch (error) {
        console.error('注册失败:', error)
        ElMessage.error(error.message || '注册失败，请重试')
        loading.value = false
      }
    }
  })
}

// 返回登录页
const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <img src="/logo.png" alt="Logo" class="register-logo">
        <h2 class="register-title">水务管理系统</h2>
        <p class="register-subtitle">用户注册</p>
      </div>
      
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="rules"
        class="register-form"
      >
        <el-form-item prop="accountId">
          <el-input
            v-model="registerForm.accountId"
            placeholder="请输入账户ID"
            size="large"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="name">
          <el-input
            v-model="registerForm.name"
            placeholder="请输入姓名"
            size="large"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="phone">
          <el-input
            v-model="registerForm.phone"
            placeholder="请输入手机号码"
            size="large"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="verificationCode">
          <div class="verification-code-row">
            <el-input
              v-model="registerForm.verificationCode"
              placeholder="请输入验证码"
              size="large"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
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
        
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
            size="large"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请确认密码"
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
            class="register-button"
            size="large"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
        
        <div class="login-link">
          已有账号？<a href="#" @click.prevent="goToLogin">立即登录</a>
        </div>
      </el-form>
      
      <div class="register-footer">
        <p>© {{ new Date().getFullYear() }} 水务管理系统</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to right, #1890ff, #36cfc9);
  position: relative;
  overflow: hidden;
}

.register-container::before {
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

.register-box {
  width: 400px;
  padding: 30px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 10;
  backdrop-filter: blur(10px);
}

.register-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.register-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 15px;
  border-radius: 50%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 5px;
  background: white;
}

.register-title {
  font-size: 24px;
  color: #303133;
  text-align: center;
  margin: 0;
  font-weight: 600;
}

.register-subtitle {
  font-size: 14px;
  color: #606266;
  margin-top: 10px;
}

.register-form {
  margin-bottom: 20px;
}

.register-form :deep(.el-input__wrapper) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.register-form :deep(.el-input__inner) {
  height: 45px;
}

.verification-code-row {
  display: flex;
  gap: 10px;
}

.verification-code-row .el-input {
  flex: 1;
}

.register-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  letter-spacing: 1px;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(24, 144, 255, 0.3);
  transition: all 0.3s;
}

.register-button:hover {
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

.register-footer {
  text-align: center;
  margin-top: 20px;
  color: #606266;
  font-size: 14px;
}

/* 响应式样式 */
@media screen and (max-width: 480px) {
  .register-box {
    width: 90%;
    padding: 20px;
    background-color: rgba(255, 255, 255, 0.98);
  }
  
  .register-logo {
    width: 60px;
    height: 60px;
  }
  
  .register-title {
    font-size: 20px;
  }
}
</style>