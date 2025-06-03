<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '@/api/auth'

const router = useRouter()

// 环境变量
const isDev = computed(() => import.meta.env.DEV)

// 是否使用本地验证模式
const useLocalMode = ref(false)

// 登录表单
const loginForm = reactive({
  accountId: '',
  password: '',
  remember: false
})

// 表单规则
const rules = {
  accountId: [
    { required: true, message: '请输入账户ID', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ]
}

const loginFormRef = ref(null)
const loading = ref(false)

// 切换本地模式
const toggleLocalMode = () => {
  useLocalMode.value = !useLocalMode.value
  ElMessage.info(useLocalMode.value ? '已启用本地模式' : '已禁用本地模式')
}

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      
      try {
        // 如果启用了本地模式，直接使用本地验证
        if (useLocalMode.value) {
          useLocalAuth()
          return
        }
        
        // 尝试调用后端登录API
        try {
          const res = await login({
            accountId: loginForm.accountId,
            password: loginForm.password
          })
          
          // API调用成功，处理响应
          console.log('登录响应:', res)
          
          if (res && res.code === 1) {
            // 保存登录信息
            localStorage.setItem('token', res.data?.token || 'mock-token')
            localStorage.setItem('accountId', loginForm.accountId)
            localStorage.setItem('accountIdentity', res.data?.accountIdentity || '用户')
            
            // 如果选择了"记住我"，则存储在localStorage
            if (loginForm.remember) {
              localStorage.setItem('rememberLogin', 'true')
            } else {
              localStorage.removeItem('rememberLogin')
            }
            
            ElMessage.success(res.msg || '登录成功')
            router.push('/dashboard')
            return
          } else {
            ElMessage.error(res?.msg || '登录失败，服务器返回异常')
            return
          }
        } catch (apiError) {
          console.error('API调用失败:', apiError)
          
          // 检查是否为网络连接问题
          if (apiError.message && (
              apiError.message.includes('Network Error') || 
              apiError.message.includes('ECONNREFUSED') ||
              apiError.response?.status === 404)) {
            
            ElMessage.error('无法连接到服务器，请检查网络连接')
            
            // 提示用户使用本地模式
            ElMessageBox.confirm(
              '服务器连接失败，是否使用本地验证模式？',
              '连接错误',
              {
                confirmButtonText: '使用本地模式',
                cancelButtonText: '取消',
                type: 'warning',
              }
            ).then(() => {
              useLocalAuth()
            }).catch(() => {
              ElMessage.info('您取消了本地登录')
            })
          } else {
            ElMessage.error(apiError.message || '登录请求失败')
          }
        }
      } catch (error) {
        console.error('登录处理失败:', error)
        ElMessage.error('登录失败，请重试')
      } finally {
        loading.value = false
      }
    }
  })
}

// 本地验证逻辑
const useLocalAuth = () => {
  if (loginForm.accountId === 'admin' && loginForm.password === 'admin123') {
    // 管理员账户
    const token = 'mock-token-' + new Date().getTime()
    localStorage.setItem('token', token)
    localStorage.setItem('accountId', loginForm.accountId)
    localStorage.setItem('accountIdentity', '管理员')
    localStorage.setItem('userRole', 'admin')
    
    // 如果选择了"记住我"，则存储在localStorage
    if (loginForm.remember) {
      localStorage.setItem('rememberLogin', 'true')
    } else {
      localStorage.removeItem('rememberLogin')
    }
    
    ElMessage.success('管理员登录成功')
    
    // 登录成功后跳转到首页
    router.push('/dashboard')
  } else if (loginForm.accountId === '2320' && loginForm.password === 'water2320') {
    // 普通用户账户
    const token = 'mock-token-' + new Date().getTime()
    localStorage.setItem('token', token)
    localStorage.setItem('accountId', loginForm.accountId)
    localStorage.setItem('accountIdentity', '普通用户')
    localStorage.setItem('userRole', 'user')
    localStorage.setItem('userId', '789') // 模拟用户ID，实际应从API获取
    
    // 如果选择了"记住我"，则存储在localStorage
    if (loginForm.remember) {
      localStorage.setItem('rememberLogin', 'true')
    } else {
      localStorage.removeItem('rememberLogin')
    }
    
    ElMessage.success('用户登录成功')
    
    // 普通用户跳转到用户首页
    router.push('/user-dashboard')
  } else {
    ElMessage.error('账户ID或密码错误')
  }
  loading.value = false
}

// 检查是否有记住的登录信息
const checkRememberLogin = () => {
  const remembered = localStorage.getItem('rememberLogin')
  const savedAccountId = localStorage.getItem('accountId')
  
  if (remembered && savedAccountId) {
    loginForm.accountId = savedAccountId
    loginForm.remember = true
  }
}

// 组件挂载时检查记住的登录
onMounted(() => {
  checkRememberLogin()
})

// 新增: goToForgotPassword 方法来处理跳转逻辑
const goToForgotPassword = () => {
  router.push('/forgot-password')
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <img src="/logo.png" alt="Logo" class="login-logo">
        <h2 class="login-title">水务管理系统</h2>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        class="login-form"
      >
        <el-form-item prop="accountId">
          <el-input
            v-model="loginForm.accountId"
            placeholder="账户ID"
            size="large"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            show-password
            size="large"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <div class="remember-row">
            <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
            <div>
              <a href="#" class="forget-password" @click.prevent="goToForgotPassword">忘记密码?</a>
              <el-switch
                v-model="useLocalMode"
                class="local-mode-switch"
                active-text="本地模式"
                inactive-text=""
                @change="toggleLocalMode"
              />
            </div>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            class="login-button"
            size="large"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="text-center mt-4">
        <span class="text-gray-500">没有账号？</span>
        <el-link type="primary" @click="router.push('/register')">立即注册</el-link>
      </div>
      
      <div class="login-tips" v-if="isDev">
        <p>默认账号: admin / 密码: admin123</p>
        <p>测试账号: 2320 / 密码: water2320</p>
      </div>
      
      <div class="login-footer">
        <p>© {{ new Date().getFullYear() }} 水务管理系统</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to right, #1890ff, #36cfc9);
  position: relative;
  overflow: hidden;
}

.login-container::before {
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

.login-box {
  width: 400px;
  padding: 30px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 10;
  backdrop-filter: blur(10px);
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.login-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 15px;
  border-radius: 50%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 5px;
  background: white;
}

.login-title {
  font-size: 24px;
  color: #303133;
  text-align: center;
  margin: 0;
  font-weight: 600;
}

.login-form {
  margin-bottom: 20px;
}

.login-form :deep(.el-input__wrapper) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.login-form :deep(.el-input__inner) {
  height: 45px;
}

.remember-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.forget-password {
  color: #1890ff;
  font-size: 14px;
  text-decoration: none;
  margin-right: 10px;
}

.forget-password:hover {
  text-decoration: underline;
}

.local-mode-switch {
  display: inline-block;
  vertical-align: middle;
  margin-left: 10px;
}

.login-button {
  width: 100%;
  height: 45px;
  font-size: 16px;
  letter-spacing: 1px;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(24, 144, 255, 0.3);
  transition: all 0.3s;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(24, 144, 255, 0.4);
}

.login-tips {
  padding: 10px 15px;
  background-color: rgba(24, 144, 255, 0.1);
  border-radius: 4px;
  color: #1890ff;
  font-size: 12px;
  margin-bottom: 20px;
}

.login-tips p {
  margin: 5px 0;
}

.login-footer {
  text-align: center;
  color: #909399;
  font-size: 12px;
  margin-top: 20px;
}

/* 响应式样式 */
@media screen and (max-width: 480px) {
  .login-box {
    width: 90%;
    padding: 20px;
    background-color: rgba(255, 255, 255, 0.98);
  }
  
  .login-logo {
    width: 60px;
    height: 60px;
  }
  
  .login-title {
    font-size: 20px;
  }
}

.forgot-password-link {
  margin-top: 10px;
  text-align: center;
}
</style>