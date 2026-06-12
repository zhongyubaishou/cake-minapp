<template>
  <div class="after-sale-page">
    <div class="page-title-row">
      <div>
        <h1 class="page-title">售后反馈</h1>
        <p class="page-subtitle">处理用户问题、备注结果并追踪售后状态</p>
      </div>
    </div>

    <el-form :inline="true" :model="filters">
      <el-form-item label="状态">
        <el-select v-model="filters.status" clearable placeholder="全部" @change="fetch">
          <el-option label="待处理" value="PENDING" />
          <el-option label="已处理" value="COMPLETED" />
        </el-select>
      </el-form-item>
      <el-form-item label="搜索">
        <el-input v-model="filters.keyword" placeholder="售后编号 / 订单号 / 手机号" clearable @clear="fetch" @keyup.enter="fetch" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetch">查询</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" stripe v-loading="loading">
      <el-table-column prop="afterSaleNo" label="售后编号" width="150" />
      <el-table-column label="订单号" width="170">
        <template #default="{ row }">{{ row.order?.orderNo }}</template>
      </el-table-column>
      <el-table-column prop="userPhone" label="手机号" width="130" />
      <el-table-column prop="description" label="问题摘要" min-width="220" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'PENDING' ? 'warning' : 'success'">{{ row.status === 'PENDING' ? '待处理' : '已处理' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="提交时间" width="170">
        <template #default="{ row }">{{ formatTime(row.submittedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row.id)">详情</el-button>
          <el-button v-if="row.status === 'PENDING' && hasPermission('afterSale:complete')" size="small" type="primary" @click="openComplete(row)">处理</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="detailVisible" title="售后详情" width="680px">
      <template v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="售后编号">{{ detail.afterSaleNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ detail.status === 'PENDING' ? '待处理' : '已处理' }}</el-descriptions-item>
          <el-descriptions-item label="订单号">{{ detail.order?.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="商品">{{ detail.order?.productName }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detail.userPhone }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ formatTime(detail.submittedAt) }}</el-descriptions-item>
          <el-descriptions-item label="问题描述" :span="2">{{ detail.description }}</el-descriptions-item>
          <el-descriptions-item label="老板备注" :span="2">{{ detail.bossRemark || '-' }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="Array.isArray(detail.images) && detail.images.length" class="images">
          <el-image v-for="img in detail.images" :key="img" :src="img" :preview-src-list="detail.images" fit="cover" />
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="completeVisible" title="标记已处理" width="420px">
      <el-input v-model="completeForm.bossRemark" type="textarea" :rows="4" placeholder="填写处理备注" />
      <template #footer>
        <el-button @click="completeVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="complete">标记已处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import http from '@/api/http';
import { hasPermission } from '@/utils/permissions';

const list = ref<any[]>([]);
const loading = ref(false);
const mounted = ref(true);
onUnmounted(() => { mounted.value = false });
const saving = ref(false);
const filters = ref({ status: '', keyword: '' });
const detailVisible = ref(false);
const detail = ref<any>(null);
const completeVisible = ref(false);
const completeForm = ref({ id: 0, bossRemark: '' });

async function fetch() {
  loading.value = true;
  try {
    const { data } = await http.get('/after-sales', { params: filters.value });
    if (!mounted.value) return;
    if (data.code === 0) list.value = data.data.list;
  } finally {
    loading.value = false;
  }
}

function reset() {
  filters.value = { status: '', keyword: '' };
  fetch();
}

async function openDetail(id: number) {
  try {
    const { data } = await http.get(`/after-sales/${id}`);
    if (!mounted.value) return;
    if (data.code === 0) {
      detail.value = data.data;
      detailVisible.value = true;
    }
  } catch {
    ElMessage.error('获取详情失败');
  }
}

function openComplete(row: any) {
  completeForm.value = { id: row.id, bossRemark: '' };
  completeVisible.value = true;
}

async function complete() {
  saving.value = true;
  try {
    const { data } = await http.post(`/after-sales/${completeForm.value.id}/complete`, { bossRemark: completeForm.value.bossRemark });
    if (data.code === 0) {
      ElMessage.success('已处理');
      completeVisible.value = false;
      fetch();
    }
  } finally {
    saving.value = false;
  }
}

function formatTime(t: string) {
  return t ? new Date(t).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '-';
}

onMounted(fetch);
</script>

<style scoped>
.after-sale-page {
  max-width: 1440px;
}

.after-sale-page :deep(.el-form) {
  margin-bottom: 14px;
  padding: 16px 16px 0;
  border: 1px solid var(--cake-border);
  border-radius: 10px;
  background: #fff;
}

.after-sale-page :deep(.el-table) {
  border: 1px solid var(--cake-border);
}

.images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.images .el-image {
  width: 96px;
  height: 96px;
  border-radius: 8px;
  background: #f0e7e0;
}
</style>
