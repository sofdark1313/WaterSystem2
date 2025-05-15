import http from './http'

// 用户管理相关API

// 查询所有用户
export function getAllUsers() {
  return http.get('/users')
}

// 用户信息分页查询
export function getUsersByPage(params) {
  return http.get('/users', { params })
}

// 根据ID查询用户
export function getUserById(userId) {
  return http.get(`/users/${userId}`)
}

// 添加用户
export function addUser(data) {
  return http.post('/users', data)
}

// 修改用户
export function updateUser(userId, data) {
  return http.put(`/users/${userId}`, data)
}

// 删除用户
export function deleteUser(userId) {
  return http.delete(`/users/${userId}`)
} 