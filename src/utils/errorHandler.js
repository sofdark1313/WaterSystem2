import { ElMessage, ElNotification } from 'element-plus'

/**
 * 全局API错误处理
 * @param {Error} error - 错误对象
 * @param {string} customMessage - 自定义错误消息
 */
export function handleApiError(error, customMessage = '操作失败') {
  console.error('错误详情:', error)
  
  // 如果是连接被拒绝错误
  if (error.code === 'ECONNREFUSED' || 
      (error.message && error.message.includes('ECONNREFUSED'))) {
    ElNotification({
      title: '连接错误',
      message: '无法连接到后端服务，请确保后端服务已启动 (http://localhost:8080)',
      type: 'error',
      duration: 0
    })
    return
  }
  
  // 如果是网络错误
  if (error.message && error.message.includes('Network Error')) {
    ElNotification({
      title: '网络错误',
      message: '网络连接失败，请检查网络连接或后端服务是否正常运行',
      type: 'error',
      duration: 0
    })
    return
  }
  
  // 如果是超时错误
  if (error.message && error.message.includes('timeout')) {
    ElMessage.error('请求超时，请稍后重试')
    return
  }
  
  // 如果是CORS错误
  if (error.message && error.message.includes('CORS')) {
    ElNotification({
      title: '跨域错误',
      message: '跨域请求被阻止，请检查后端服务是否配置了正确的CORS策略',
      type: 'error',
      duration: 0
    })
    return
  }
  
  // 如果有响应错误码
  if (error.response) {
    const status = error.response.status
    
    switch(status) {
      case 401:
        ElMessage.error('无访问权限，请登录后重试')
        break
      case 403:
        ElMessage.error('禁止访问，没有权限')
        break
      case 404:
        ElMessage.error('请求的资源不存在')
        break
      case 500:
        ElMessage.error('服务器内部错误 (500)')
        break
      case 503:
        ElMessage.error('服务暂时不可用 (503)')
        break
      default:
        ElMessage.error(customMessage)
    }
    return
  }
  
  // 默认错误消息
  ElMessage.error(error.message || customMessage)
} 