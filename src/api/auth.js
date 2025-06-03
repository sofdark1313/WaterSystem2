import http from './http'

// 登录
export function login(data) {
  return http.post('/auth/login', {
    accountId: data.accountId,
    password: data.password
  })
}

// 退出登录
export function logout() {
  return http.post('/auth/logout')
}

// 获取当前用户信息
export function getCurrentUser() {
  return http.get('/auth/current-user')
}

// 根据账户ID获取账户详情
export function getAccountDetail(accountId) {
  return http.get(`/auth/account-detail/${accountId}`)
} 
// 用户注册
export function register(data) {
  return http.post('/auth/register', {
    accountId: data.accountId,
    name: data.name,
    phone: data.phone,
    password: data.password,
    verificationCode: data.verificationCode
  })
}

// 发送验证码
export function sendVerificationCode(phone) {
  return http.post('/auth/send-verification-code', {
    phone: phone
  })
}