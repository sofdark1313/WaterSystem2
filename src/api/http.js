import axios from 'axios'
import { ElMessage } from 'element-plus'
import { handleApiError } from '@/utils/errorHandler'

// 创建axios实例
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080', // 使用环境变量或默认地址
  timeout: 10000,   // 请求超时时间
  withCredentials: true // 跨域请求时发送Cookie
})

// 请求拦截器
http.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    const token = localStorage.getItem('token')
    if (token) {
      // 如果存在token，则在请求头中添加Authorization字段
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    // 对请求错误做些什么
    console.error('请求拦截器错误:', error)
    handleApiError(error, '请求配置错误')
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  response => {
    const res = response.data
    
    // 记录响应数据，用于调试
    console.log('API响应数据:', res)
    
    // 检查响应数据是否有效
    if (!res) {
      ElMessage.error('响应数据为空')
      return Promise.reject(new Error('响应数据为空'))
    }
    
    // 后端可能没有使用统一的code标识，直接返回数据
    if (res.code !== undefined) {
      // 如果有code字段，遵循之前的逻辑
      if (res.code !== 1) {
        // 检查token失效的情况
        if (res.code === 401 || res.code === 10001) {
          // token过期或无效，清除本地存储并跳转到登录页
          localStorage.removeItem('token')
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
        }
        
        ElMessage.error(res.msg || '请求失败')
        return Promise.reject(new Error(res.msg || '请求失败'))
      } else {
        return res
      }
    } else {
      // 如果没有code字段，直接返回响应数据
      return { code: 1, data: res }
    }
  },
  error => {
    // 对响应错误做些什么
    console.error('API请求错误:', error)
    
    // 检查特定的错误情况
    if (error.response) {
      // 服务器返回了错误状态码
      if (error.response.status === 401) {
        // 清除本地存储并跳转到登录页
        localStorage.removeItem('token')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      }
    }
    
    // 错误处理
    handleApiError(error)
    
    return Promise.reject(error)
  }
)

export default http 