<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getWaterMeterById, updateWaterMeterReading } from '@/api/waterMeter'
import { ElMessage } from 'element-plus'
import { isAdmin } from '@/utils/permission'

const route = useRoute()
const router = useRouter()
const meterId = route.params.id

// 水表数据
const meterForm = ref({
  MeterID: '',
  AccountID: '',
  MeterType: '',
  InitialReading: 0,
  CurrentReading: 0
})

const loading = ref(false)
const waterUsage = ref(0)

// 获取水表详情
const getMeterDetail = async () => {
  loading.value = true
  try {
    const res = await getWaterMeterById(meterId)
    meterForm.value = res.data
    calculateWaterUsage()
  } catch (error) {
    console.error('获取水表详情失败', error)
  } finally {
    loading.value = false
  }
}

// 计算用水量
const calculateWaterUsage = () => {
  waterUsage.value = (meterForm.value.CurrentReading - meterForm.value.InitialReading).toFixed(2)
}

// 保存读数
const saveReading = async () => {
  try {
    await updateWaterMeterReading(meterId, {
      currentReading: meterForm.value.CurrentReading
    })
    ElMessage.success('读数更新成功')
    calculateWaterUsage()
  } catch (error) {
    console.error('更新读数失败', error)
  }
}

// 返回列表
const goBack = () => {
  router.push('/water-meters')
}

onMounted(() => {
  getMeterDetail()
})
</script>

<template>
  <div class="app-container">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>水表详情</span>
          <div>
            <el-button @click="goBack">返回</el-button>
            <el-button type="primary" @click="saveReading">保存读数</el-button>
          </div>
        </div>
      </template>
      
      <el-form :model="meterForm" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="水表编号">
              <el-input v-model="meterForm.MeterID" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账户ID">
              <el-input v-model="meterForm.AccountID" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="水表类型">
              <el-input v-model="meterForm.MeterType" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="初始读数">
              <el-input v-model="meterForm.InitialReading" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="当前读数">
              <el-input-number 
                v-model="meterForm.CurrentReading" 
                :min="meterForm.InitialReading" 
                :precision="2"
                style="width: 100%" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用水量">
              <el-input v-model="waterUsage" disabled>
                <template #append>立方米</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <el-divider />
      
      <div class="info-box">
        <el-alert
          title="提示"
          type="info"
          description="更新当前读数后，系统将自动计算用水量，点击保存可生成水费账单"
          show-icon
          :closable="false"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.app-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-box {
  margin-top: 20px;
}
</style> 