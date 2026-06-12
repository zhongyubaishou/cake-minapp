<template>
  <div>
    <div class="page-header">
      <h3>消息提醒</h3>
      <el-button v-if="hasPermission('reminder:manage')" type="primary" :loading="saving" @click="save">保存</el-button>
    </div>

    <el-card shadow="never" class="panel">
      <template #header>用户微信服务通知</template>
      <el-form label-width="180px">
        <el-form-item label="订单确认通知"><el-switch v-model="form.orderConfirmNotice" /></el-form-item>
        <el-form-item label="支付成功通知"><el-switch v-model="form.paidNotice" disabled /></el-form-item>
        <el-form-item label="制作开始通知"><el-switch v-model="form.productionNotice" /></el-form-item>
        <el-form-item label="待自提通知"><el-switch v-model="form.pickupNotice" /></el-form-item>
        <el-form-item label="配送开始通知"><el-switch v-model="form.deliveryNotice" /></el-form-item>
        <el-form-item label="订单完成通知"><el-switch v-model="form.completeNotice" /></el-form-item>
        <el-form-item label="退款结果通知"><el-switch v-model="form.refundNotice" disabled /></el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="panel">
      <template #header>后台声音提醒</template>
      <el-form label-width="180px">
        <el-form-item label="新订单声音提醒"><el-switch v-model="form.newOrderSound" /></el-form-item>
        <el-form-item label="支付成功声音提醒"><el-switch v-model="form.paidSound" disabled /></el-form-item>
        <el-form-item label="退款申请声音提醒"><el-switch v-model="form.refundSound" disabled /></el-form-item>
        <el-form-item label="售后反馈声音提醒"><el-switch v-model="form.afterSaleSound" /></el-form-item>
        <el-form-item label="临近预约时间提醒"><el-switch v-model="form.appointmentSound" /></el-form-item>
      </el-form>
    </el-card>

    <el-alert type="info" :closable="false" title="V1 不接入微信支付和线上退款，支付成功与退款相关提醒暂不可启用。" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import http from '@/api/http';
import { hasPermission } from '@/utils/permissions';

const saving = ref(false);
const form = ref<any>({});
const mounted = ref(true);
onUnmounted(() => { mounted.value = false });

async function fetch() {
  try {
    const { data } = await http.get('/settings/reminders');
    if (!mounted.value) return;
    if (data.code === 0) form.value = data.data;
  } catch {
    form.value = {};
  }
}

async function save() {
  saving.value = true;
  try {
    const { data } = await http.put('/settings/reminders', form.value);
    if (data.code === 0) {
      form.value = data.data;
      ElMessage.success('保存成功');
    }
  } finally {
    saving.value = false;
  }
}

onMounted(fetch);
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; }
.panel { margin-bottom: 16px; max-width: 720px; }
</style>
