import http from './http'

// 账户管理相关API

// 查询所有账户（分页）
export function getAccountsByPage(params) {
  return http.get('/accounts', { params })
}

// 查询账户信息
export function getAccountById(accountId) {
  return http.get(`/accounts/${accountId}`)
}

// 修改账户密码
export function updateAccountPassword(accountId, data) {
  return http.put(`/accounts/${accountId}/password`, data)
}

// 更新账户信息
export function updateAccount(accountId, data) {
  return http.put(`/accounts/${accountId}`, data)
}

// 添加账户
export function addAccount(data) {
  return http.post('/accounts', data)
}

// 删除账户
export function deleteAccount(accountId) {
  return http.delete(`/accounts/${accountId}`)
} 