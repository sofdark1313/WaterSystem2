// 权限控制工具
import { ElMessage } from 'element-plus'

// 用户权限类型
export const UserRoles = {
  ADMIN: 'admin',
  USER: 'user'
}

// 获取当前用户角色
export function getUserRole() {
  const accountId = localStorage.getItem('accountId')
  const accountIdentity = localStorage.getItem('accountIdentity')
  
  // 管理员账号
  if (accountId === 'admin' || accountIdentity === '管理员') {
    return UserRoles.ADMIN
  }
  
  return UserRoles.USER
}

// 检查当前用户是否为管理员
export function isAdmin() {
  return getUserRole() === UserRoles.ADMIN
}

// 检查当前用户是否为普通用户
export function isUser() {
  return getUserRole() === UserRoles.USER
}

// 检查用户是否有权限访问特定功能
export function hasPermission(requiredRole) {
  const currentRole = getUserRole()
  
  // 管理员可以访问所有内容
  if (currentRole === UserRoles.ADMIN) {
    return true
  }
  
  // 普通用户只能访问用户级别的功能
  return requiredRole === UserRoles.USER
}

// 检查用户是否有权限查看/编辑特定账户的数据
export function canAccessAccount(accountId) {
  const currentRole = getUserRole()
  const currentAccountId = localStorage.getItem('accountId')
  
  // 管理员可以访问所有账户
  if (currentRole === UserRoles.ADMIN) {
    return true
  }
  
  // 普通用户只能访问自己的账户
  return currentAccountId === accountId.toString()
}

// 权限不足时的提示
export function showNoPermissionMessage() {
  ElMessage.error('您没有权限执行此操作')
  return false
}

export default {
  UserRoles,
  getUserRole,
  isAdmin,
  isUser,
  hasPermission,
  canAccessAccount,
  showNoPermissionMessage
} 