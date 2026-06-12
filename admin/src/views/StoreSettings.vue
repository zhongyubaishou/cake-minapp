<template>
  <div>
    <div class="page-title-row">
      <div>
        <h1 class="page-title">门店设置</h1>
        <p class="page-subtitle">配置门店信息、营业参数与收款二维码</p>
      </div>
    </div>

    <el-card class="settings-card">
      <h4 class="section-title">基本信息</h4>
      <el-form :model="form" label-width="140px" class="settings-form" :rules="formRules">
        <el-form-item label="门店名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入门店名称" />
        </el-form-item>
        <el-form-item label="门店地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入门店地址" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="经度">
              <el-input-number v-model="form.lng" :precision="7" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纬度">
              <el-input-number v-model="form.lat" :precision="7" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card class="settings-card">
      <h4 class="section-title">营业参数</h4>
      <el-form :model="form" label-width="140px" class="settings-form">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="营业开始时间">
              <el-time-picker v-model="form.businessHoursStart" format="HH:mm:ss" value-format="HH:mm:ss" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="营业结束时间">
              <el-time-picker v-model="form.businessHoursEnd" format="HH:mm:ss" value-format="HH:mm:ss" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="配送范围（公里）">
              <el-input-number v-model="form.deliveryRangeKm" :min="0.1" :step="0.1" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每公里配送费(元)">
              <el-input-number v-model="form.deliveryFeePerKm" :min="0" :precision="1" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="最早预约(小时)">
              <el-input-number v-model="form.minAdvanceHours" :min="1" controls-position="right" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每日接单上限">
              <el-input-number v-model="form.dailyOrderLimit" :min="0" controls-position="right" style="width:100%" />
              <span class="form-hint">0 表示不限制</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="单磅价格(元)">
              <el-input-number v-model="form.pricePerPound" :min="0" :precision="2" controls-position="right" style="width:100%" />
              <span class="form-hint">所有订单统一按此单价 × 磅数计算商品金额</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card class="settings-card">
      <h4 class="section-title">收款</h4>
      <el-form :model="form" label-width="140px" class="settings-form">
        <el-form-item label="收款二维码">
          <div class="qrcode-upload">
            <el-upload
              :action="uploadUrl"
              :headers="uploadHeaders"
              name="file"
              :show-file-list="false"
              :on-success="onQrcodeUploaded"
              :before-upload="beforeUpload"
            >
              <el-button type="primary">上传二维码</el-button>
            </el-upload>
            <div v-if="form.qrCodeUrl" class="qrcode-preview">
              <img :src="form.qrCodeUrl" alt="收款二维码" />
              <span class="qrcode-label">当前收款二维码</span>
            </div>
            <div v-else class="qrcode-empty">
              <span>尚未上传收款二维码</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="settings-actions">
      <el-button v-if="hasPermission('store:manage')" type="primary" size="large" @click="handleSave" :loading="saving">
        保存设置
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import http from '@/api/http';
import { hasPermission } from '@/utils/permissions';

const form = ref<any>({});
const saving = ref(false);
const formRules = {
  name: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
  address: [{ required: true, message: '请输入门店地址', trigger: 'blur' }],
};
const mounted = ref(true);
onUnmounted(() => { mounted.value = false });
const uploadUrl = '/admin/upload';
const uploadHeaders: Record<string, string> = {};

onMounted(async () => {
  try {
    const token = localStorage.getItem('admin_token');
    if (token) uploadHeaders.Authorization = `Bearer ${token}`;

    const { data } = await http.get('/settings/store');
    if (!mounted.value) return;
    if (data.code === 0) {
      form.value = {
        ...data.data,
        businessHoursStart: data.data.businessHoursStart || '06:00:00',
        businessHoursEnd: data.data.businessHoursEnd || '18:00:00',
        qrCodeUrl: data.data.qrCodeUrl || '',
      };
    }
  } catch {
    form.value = {};
  }
});

function onQrcodeUploaded(res: any) {
  if (res.code === 0) {
    form.value.qrCodeUrl = res.data.fileUrl;
    ElMessage.success('二维码上传成功');
  }
}

function beforeUpload(file: File) {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    ElMessage.error('只能上传图片文件');
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB');
    return false;
  }
  return true;
}

async function handleSave() {
  saving.value = true;
  try {
    const { data } = await http.put('/settings/store', form.value);
    if (data.code === 0) {
      ElMessage.success('保存成功');
    }
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.settings-card {
  max-width: 800px;
  margin-bottom: 20px;
}

.settings-card :deep(.el-card__body) {
  padding: 24px;
}

.section-title {
  margin: 0 0 20px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 800;
  color: var(--cake-text);
  letter-spacing: -0.02em;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--cake-divider);
}

.settings-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.settings-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--cake-text-soft);
}

.form-hint {
  margin-left: 10px;
  font-size: 12px;
  color: var(--cake-muted);
}

.qrcode-upload {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.qrcode-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--cake-border);
  border-radius: var(--radius-md);
  background: var(--cake-bg);
}

.qrcode-preview img {
  max-width: 160px;
  border-radius: var(--radius-sm);
}

.qrcode-label {
  font-size: 12px;
  color: var(--cake-muted);
  font-weight: 500;
}

.qrcode-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 120px;
  border: 2px dashed var(--cake-border);
  border-radius: var(--radius-md);
  color: var(--cake-placeholder);
  font-size: 13px;
  background: var(--cake-bg);
}

.settings-actions {
  max-width: 800px;
  padding-top: 4px;
}
</style>
