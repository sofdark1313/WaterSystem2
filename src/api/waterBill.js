import http from './http'

// 水费账单管理相关API

// 查询水费账单列表（分页+条件筛选）
export function getWaterBillsByPage(params) {
  return http.get('/water-bills', { params })
}

// 生成水费账单
export function generateWaterBill(data) {
  return http.post('/water-bills', data)
}

// 缴费
export function payWaterBill(billId, data) {
  return http.post(`/water-bills/${billId}/pay`, data)
}

// 查询缴费记录
export function getPaymentRecords(params) {
  return http.get('/payment-records', { params })
}

// 发送欠费通知
export function sendReminderNotice(data) {
  return http.post('/reminder-notices', data)
}

// 查询欠费通知
export function getReminderNotices(params) {
  return http.get('/reminder-notices', { params })
} 