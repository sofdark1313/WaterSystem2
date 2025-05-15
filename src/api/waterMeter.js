import http from './http'

// 水表管理相关API

// 查询水表列表（分页+条件筛选）
export function getWaterMetersByPage(params) {
  return http.get('/water-meters', { params })
}

// 查看水表详情
export function getWaterMeterById(meterId) {
  return http.get(`/water-meters/${meterId}`)
}

// 添加水表
export function addWaterMeter(data) {
  return http.post('/water-meters', data)
}

// 修改水表读数
export function updateWaterMeterReading(meterId, data) {
  return http.put(`/water-meters/${meterId}`, data)
}

// 删除水表
export function deleteWaterMeter(meterId) {
  return http.delete(`/water-meters/${meterId}`)
} 