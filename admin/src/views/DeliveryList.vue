<template>
  <div>
    <div class="page-header">
      <h3>配送管理</h3>
    </div>

    <!-- 快捷状态筛选 -->
    <div class="quick-status-filters">
      <el-tag
        v-for="s in quickStatusList"
        :key="s.value"
        :type="filters.status === s.value ? '' : 'info'"
        :effect="filters.status === s.value ? 'dark' : 'plain'"
        size="large"
        class="status-tag"
        @click="quickFilter(s.value)"
      >
        {{ s.label }}
      </el-tag>
    </div>

    <el-form :inline="true" :model="filters">
      <el-form-item label="配送状态">
        <el-select v-model="filters.status" clearable placeholder="全部" @change="fetch">
          <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="搜索">
        <el-input v-model="filters.keyword" placeholder="订单号 / 手机号" clearable @clear="fetch" @keyup.enter="fetch" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetch">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" stripe v-loading="loading">
      <el-table-column prop="orderNo" label="订单号" width="180" />
      <el-table-column prop="userPhone" label="手机号" width="130" />
      <el-table-column label="配送地址" min-width="180">
        <template #default="{ row }">{{ row.deliveryInfo?.address ?? '-' }}</template>
      </el-table-column>
      <el-table-column label="距离" width="80">
        <template #default="{ row }">{{ row.deliveryInfo?.distanceKm ?? '-' }} 公里</template>
      </el-table-column>
      <el-table-column label="配送费" width="100">
        <template #default="{ row }">{{ row.deliveryInfo?.finalFee ?? row.deliveryFee }}元</template>
      </el-table-column>
      <el-table-column label="预约时间" width="160">
        <template #default="{ row }">{{ formatTime(row.appointmentTime) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="130">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row)">详情</el-button>
          <template v-if="row.status === 'WAIT_DELIVERY' && hasPermission('order:deliver')">
            <el-button size="small" type="primary" :loading="actionLoading" @click="startDelivery(row)">开始配送</el-button>
          </template>
          <template v-if="row.status === 'DELIVERING' && hasPermission('order:deliver')">
            <el-button size="small" type="success" :loading="actionLoading" @click="deliveryComplete(row)">确认送达</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      :total="total"
      :page-size="20"
      layout="prev, pager, next"
      @current-change="fetch"
      style="margin-top:16px;justify-content:flex-end"
    />

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detailVisible" title="配送详情" width="700px" :close-on-click-modal="false">
      <template v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTag(detail.status)">{{ statusText(detail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="商品">{{ detail.productName }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ detail.categoryName }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detail.userPhone }}</el-descriptions-item>
          <el-descriptions-item label="取货方式">{{ detail.pickupType === 'DELIVERY' ? '商家配送' : '到店自提' }}</el-descriptions-item>
          <el-descriptions-item label="预约时间">{{ formatTime(detail.appointmentTime) }}</el-descriptions-item>
          <el-descriptions-item label="应付金额">{{ detail.totalAmount ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="配送费">{{ detail.deliveryFee }}</el-descriptions-item>
          <el-descriptions-item label="来源">{{ sourceText(detail.source) }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="detail.customization" style="margin-top:16px">
          <h4>定制信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="磅数">{{ detail.customization.buyPound }}磅（实际制作{{ detail.customization.actualMakePound }}磅）</el-descriptions-item>
            <el-descriptions-item label="口味">{{ detail.customization.flavor }}</el-descriptions-item>
            <el-descriptions-item label="主题">{{ detail.customization.theme }}</el-descriptions-item>
            <el-descriptions-item label="碟子/蜡烛">{{ detail.customization.plateCount }}个 / {{ detail.customization.candleCount }}个</el-descriptions-item>
            <el-descriptions-item label="祝福文字" :span="2">{{ detail.customization.blessingText || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ detail.customization.specialRemark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-if="detail.deliveryInfo" style="margin-top:16px">
          <h4>配送信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="收货人">{{ detail.deliveryInfo.receiverName }}</el-descriptions-item>
            <el-descriptions-item label="电话">{{ detail.deliveryInfo.receiverPhone }}</el-descriptions-item>
            <el-descriptions-item label="地址" :span="2">{{ detail.deliveryInfo.address }}</el-descriptions-item>
            <el-descriptions-item label="距离">{{ detail.deliveryInfo.distanceKm }}公里</el-descriptions-item>
            <el-descriptions-item label="配送费">{{ detail.deliveryInfo.finalFee }}元</el-descriptions-item>
            <el-descriptions-item label="配送状态">{{ deliveryStatusText(detail.deliveryInfo.deliveryStatus) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div style="margin-top:20px;display:flex;gap:8px">
          <template v-if="detail.status === 'WAIT_DELIVERY' && hasPermission('order:deliver')">
            <el-button type="primary" :loading="actionLoading" @click="startDelivery(detail)">开始配送</el-button>
          </template>
          <template v-if="detail.status === 'DELIVERING' && hasPermission('order:deliver')">
            <el-button type="success" :loading="actionLoading" @click="deliveryComplete(detail)">确认送达</el-button>
          </template>
        </div>

        <!-- 操作日志 -->
        <div style="margin-top:20px" v-if="logs.length">
          <h4>操作日志</h4>
          <el-table :data="logs" size="small" stripe>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">{{ actionText(row.action) }}</template>
            </el-table-column>
            <el-table-column label="操作人" width="80">
              <template #default="{ row }">{{ row.operatorType === 'ADMIN' ? '老板' : '用户' }}</template>
            </el-table-column>
            <el-table-column label="状态变更" width="200">
              <template #default="{ row }">
                <span v-if="row.fromStatus || row.toStatus">
                  <el-tag size="small" type="info" v-if="row.fromStatus">{{ statusText(row.fromStatus) }}</el-tag>
                  <span v-if="row.fromStatus && row.toStatus" style="margin:0 4px">→</span>
                  <el-tag size="small" :type="statusTag(row.toStatus)" v-if="row.toStatus">{{ statusText(row.toStatus) }}</el-tag>
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="140">
              <template #default="{ row }">{{ row.remark || '-' }}</template>
            </el-table-column>
            <el-table-column label="时间" width="160">
              <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import http from '@/api/http';
import { hasPermission } from '@/utils/permissions';

const quickStatusList = [
  { label: '全部', value: '' },
  { label: '待配送', value: 'WAIT_DELIVERY' },
  { label: '配送中', value: 'DELIVERING' },
  { label: '已完成', value: 'COMPLETED' },
];

const statusOptions = quickStatusList.filter(s => s.value !== '');

function statusText(status: string): string {
  return statusOptions.find(s => s.value === status)?.label ?? status;
}

function sourceText(source: string): string {
  const map: Record<string, string> = { PRODUCT: '商品下单', CUSTOM: '定制下单', CASE: '案例定制' };
  return map[source] ?? source;
}

function deliveryStatusText(status: string): string {
  const map: Record<string, string> = { WAIT: '待配送', DELIVERING: '配送中', DELIVERED: '已送达' };
  return map[status] ?? status;
}

function actionText(action: string): string {
  const map: Record<string, string> = {
    create_order: '创建订单',
    confirm: '确认接单',
    cancel: '取消订单',
    start_production: '开始制作',
    finish_production: '制作完成',
    pickup_complete: '确认取货',
    start_delivery: '开始配送',
    delivery_complete: '确认送达',
    adjust_price: '调整价格',
  };
  return map[action] ?? action;
}

const list = ref<any[]>([]);
const loading = ref(false);
const page = ref(1);
const total = ref(0);
const filters = ref({ status: '', keyword: '' });

const detailVisible = ref(false);
const detail = ref<any>(null);
const logs = ref<any[]>([]);
const actionLoading = ref(false);
const mounted = ref(true);
onUnmounted(() => { mounted.value = false });

function quickFilter(status: string) {
  filters.value.status = status;
  page.value = 1;
  fetch();
}

function resetFilters() {
  filters.value = { status: '', keyword: '' };
  page.value = 1;
  fetch();
}

async function fetch() {
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: 20 };
    if (filters.value.status) params.status = filters.value.status;
    else {
      params.status = 'WAIT_DELIVERY,DELIVERING,COMPLETED';
    }
    if (filters.value.keyword) params.keyword = filters.value.keyword;
    params.pickupType = 'DELIVERY';
    const { data } = await http.get('/orders', { params });
    if (!mounted.value) return;
    if (data.code === 0) { list.value = data.data.list; total.value = data.data.total; }
  } finally { loading.value = false; }
}

async function openDetail(row: any) {
  detailVisible.value = true;
  logs.value = [];
  try {
    const { data } = await http.get(`/orders/${row.id}`);
    if (data.code === 0) detail.value = data.data;
  } catch { console.error('获取订单详情失败'); }
  try {
    const logRes = await http.get(`/orders/${row.id}/logs`);
    if (logRes.data.code === 0) logs.value = logRes.data.data;
  } catch { console.error('获取操作日志失败'); }
}

async function startDelivery(row: any) {
  actionLoading.value = true;
  try {
    const { data } = await http.post(`/orders/${row.id}/start-delivery`);
    if (data.code === 0) { ElMessage.success('已开始配送'); detailVisible.value = false; fetch(); }
  } finally { actionLoading.value = false; }
}

async function deliveryComplete(row: any) {
  await ElMessageBox.confirm('确认顾客已签收？', '提示', { type: 'info' });
  actionLoading.value = true;
  try {
    const { data } = await http.post(`/orders/${row.id}/delivery-complete`);
    if (data.code === 0) { ElMessage.success('已送达'); detailVisible.value = false; fetch(); }
  } finally { actionLoading.value = false; }
}

function statusTag(status: string): string {
  const map: Record<string, string> = {
    WAIT_DELIVERY: 'info', DELIVERING: '', COMPLETED: 'success', CANCELED: 'danger',
  };
  return map[status] || 'info';
}

function formatTime(t: string) {
  if (!t) return '-';
  return new Date(t).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
}

onMounted(() => {
  fetch();
});
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; }
h4 { margin: 0 0 8px 0; }
.quick-status-filters { margin-bottom: 12px; display: flex; gap: 8px; flex-wrap: wrap; }
.status-tag { cursor: pointer; font-size: 13px; padding: 4px 14px; }
</style>
