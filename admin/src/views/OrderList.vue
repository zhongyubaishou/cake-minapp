<template>
  <div class="order-page">
    <div class="page-title-row">
      <div>
        <h1 class="page-title">订单管理</h1>
        <p class="page-subtitle">跟进接单、制作、自提与配送状态</p>
      </div>
    </div>

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
      <el-form-item label="状态">
        <el-select v-model="filters.status" clearable placeholder="全部" @change="fetch">
          <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="搜索">
        <el-input v-model="filters.keyword" placeholder="订单号 / 手机号 / 联系人" clearable @clear="fetch" @keyup.enter="fetch" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetch">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" stripe v-loading="loading">
      <el-table-column prop="orderNo" label="订单号" width="180" />
      <el-table-column label="联系人" width="150">
        <template #default="{ row }">
          <div class="contact-name">{{ row.userNickname }}</div>
          <div class="contact-phone">{{ row.userPhone || '未填' }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="productName" label="商品" />
      <el-table-column label="金额" width="100">
        <template #default="{ row }">{{ row.totalAmount ?? estimatedAmount(row) }}</template>
      </el-table-column>
      <el-table-column label="方式" width="100">
        <template #default="{ row }">
          <el-tag :type="row.pickupType === 'DELIVERY' ? '' : 'success'" size="small" effect="plain">
            {{ row.pickupType === 'DELIVERY' ? '配送' : '自提' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="160">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag>
          <el-tag v-if="row.isOutsideHours" type="warning" size="small" effect="dark" style="margin-left:4px">非营业</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="预约时间" width="160">
        <template #default="{ row }">{{ formatTime(row.appointmentTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" min-width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDetail(row)">详情</el-button>
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

    <el-dialog v-model="detailVisible" title="订单详情" width="700px" :close-on-click-modal="false">
      <template v-if="detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTag(detail.status)">{{ statusText(detail.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="商品">{{ detail.productName }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ detail.categoryName }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ detail.userNickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detail.userPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="取货方式">{{ detail.pickupType === 'DELIVERY' ? '商家配送' : '到店自提' }}</el-descriptions-item>
          <el-descriptions-item label="预约时间">{{ formatTime(detail.appointmentTime) }}</el-descriptions-item>
          <el-descriptions-item label="应付金额">{{ detail.totalAmount ?? estimatedAmount(detail) }}</el-descriptions-item>
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
          </el-descriptions>
        </div>

        <div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap">
          <template v-if="detail.status === 'WAIT_ACCEPT'">
            <el-button v-if="hasPermission('order:confirm')" type="primary" @click="showConfirmDialog">确认接单</el-button>
            <el-button v-if="hasPermission('order:adjust')" @click="showAdjustDialog">调整配送费</el-button>
            <el-button v-if="hasPermission('order:cancel')" type="danger" @click="cancelOrder">取消订单</el-button>
          </template>
          <template v-if="detail.status === 'WAIT_PICKUP'">
            <el-button v-if="hasPermission('order:produce')" type="primary" :loading="actionLoading" @click="pickupComplete">确认已取货</el-button>
          </template>
          <template v-if="detail.status === 'WAIT_DELIVERY'">
            <el-button v-if="hasPermission('order:deliver')" type="primary" :loading="actionLoading" @click="startDelivery">开始配送</el-button>
          </template>
          <template v-if="detail.status === 'DELIVERING'">
            <el-button v-if="hasPermission('order:deliver')" type="primary" :loading="actionLoading" @click="deliveryComplete">确认送达</el-button>
          </template>
        </div>

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

    <el-dialog v-model="confirmVisible" title="确认接单" width="400px">
      <el-form :model="confirmForm">
        <el-form-item label="商品价格">
          <el-input-number v-model="confirmForm.productAmount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="配送费">
          <el-input-number v-model="confirmForm.deliveryFee" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="confirmForm.bossRemark" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="actionLoading">确认接单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="adjustVisible" title="调整配送费" width="400px">
      <el-form :model="adjustForm">
        <el-form-item label="配送费（元）">
          <el-input-number v-model="adjustForm.deliveryFee" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdjust" :loading="actionLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import http from '@/api/http';
import { hasPermission } from '@/utils/permissions';

const route = useRoute();

const quickStatusList = [
  { label: '全部', value: '' },
  { label: '待接单', value: 'WAIT_ACCEPT' },
  { label: '待自提', value: 'WAIT_PICKUP' },
  { label: '待配送', value: 'WAIT_DELIVERY' },
  { label: '配送中', value: 'DELIVERING' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELED' },
];

const statusOptions = quickStatusList.filter(s => s.value !== '');

function statusText(status: string): string {
  return statusOptions.find(s => s.value === status)?.label ?? status;
}

function sourceText(source: string): string {
  const map: Record<string, string> = { PRODUCT: '商品下单', CUSTOM: '定制下单', CASE: '案例定制' };
  return map[source] ?? source;
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
    pay: '支付',
    refund: '退款',
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

const confirmVisible = ref(false);
const confirmForm = ref({ productAmount: 0, deliveryFee: 0, bossRemark: '' });
const adjustVisible = ref(false);
const adjustForm = ref({ deliveryFee: 0 });
const pricePerPound = ref(0);

async function fetchPricePerPound() {
  try {
    const { data } = await http.get('/settings/store');
    if (data.code === 0) {
      pricePerPound.value = data.data.pricePerPound ?? 0;
    }
  } catch { /* store settings not available yet */ }
}

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
    if (filters.value.keyword) params.keyword = filters.value.keyword;
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
    if (!mounted.value) return;
    if (data.code === 0) detail.value = data.data;
  } catch (err: any) { console.error('获取订单详情失败:', err); }
  try {
    const logRes = await http.get(`/orders/${row.id}/logs`);
    if (!mounted.value) return;
    if (logRes.data.code === 0) logs.value = logRes.data.data;
  } catch (err: any) { console.error('获取操作日志失败:', err); }
}

function showConfirmDialog() {
  const buyPound = detail.value?.customization?.buyPound ?? 0;
  const productPricePerPound = detail.value?.product?.pricePerPound;
  const perPoundPrice = (productPricePerPound != null && Number(productPricePerPound) > 0)
    ? Number(productPricePerPound)
    : pricePerPound.value;
  const basePrice = Number(detail.value?.product?.basePrice ?? 0);
  const defaultPound = Number(detail.value?.product?.defaultPound ?? 2);
  const extraPounds = Math.max(0, Number(buyPound) - defaultPound);
  const autoAmount = basePrice + perPoundPrice * extraPounds;
  confirmForm.value = { productAmount: autoAmount, deliveryFee: detail.value?.deliveryFee ?? 0, bossRemark: '' };
  confirmVisible.value = true;
}

async function handleConfirm() {
  actionLoading.value = true;
  try {
    const { data } = await http.post(`/orders/${detail.value.id}/confirm`, confirmForm.value);
    if (data.code === 0) { ElMessage.success('接单成功'); confirmVisible.value = false; detailVisible.value = false; fetch(); }
  } finally { actionLoading.value = false; }
}

function showAdjustDialog() {
  adjustForm.value = { deliveryFee: detail.value?.deliveryFee ?? 0 };
  adjustVisible.value = true;
}

async function handleAdjust() {
  actionLoading.value = true;
  try {
    const { data } = await http.put(`/orders/${detail.value.id}/adjust-price`, adjustForm.value);
    if (data.code === 0) { ElMessage.success('配送费已更新'); adjustVisible.value = false; detailVisible.value = false; fetch(); }
  } finally { actionLoading.value = false; }
}

async function pickupComplete() {
  await ElMessageBox.confirm('确认顾客已取货？', '提示', { type: 'info' });
  actionLoading.value = true;
  try {
    const { data } = await http.post(`/orders/${detail.value.id}/pickup-complete`);
    if (data.code === 0) { ElMessage.success('已完成'); detailVisible.value = false; fetch(); }
  } finally { actionLoading.value = false; }
}

async function startDelivery() {
  actionLoading.value = true;
  try {
    const { data } = await http.post(`/orders/${detail.value.id}/start-delivery`);
    if (data.code === 0) { ElMessage.success('已开始配送'); detailVisible.value = false; fetch(); }
  } finally { actionLoading.value = false; }
}

async function deliveryComplete() {
  await ElMessageBox.confirm('确认顾客已签收？', '提示', { type: 'info' });
  actionLoading.value = true;
  try {
    const { data } = await http.post(`/orders/${detail.value.id}/delivery-complete`);
    if (data.code === 0) { ElMessage.success('已送达'); detailVisible.value = false; fetch(); }
  } finally { actionLoading.value = false; }
}

async function cancelOrder() {
  try {
    const { value } = await ElMessageBox.prompt('取消原因', '取消订单', { type: 'warning' });
    actionLoading.value = true;
    const { data } = await http.post(`/orders/${detail.value.id}/cancel`, { reason: value });
    if (data.code === 0) { ElMessage.success('已取消'); detailVisible.value = false; fetch(); }
  } catch { /* cancelled */ }
  finally { actionLoading.value = false; }
}

function statusTag(status: string): string {
  const map: Record<string, string> = {
    WAIT_ACCEPT: 'warning', PAID_WAIT_MAKE: 'success', MAKING: '',
    WAIT_PICKUP: 'info', WAIT_DELIVERY: 'info', DELIVERING: '',
    COMPLETED: 'success', CANCELED: 'danger', REFUNDING: 'warning', REFUNDED: 'info',
  };
  return map[status] || 'info';
}

function estimatedAmount(row: any): string {
  const pp = Number(row?.product?.pricePerPound ?? 0);
  const buyPound = Number(row?.customization?.buyPound ?? 0);
  const basePrice = Number(row?.product?.basePrice ?? 0);
  if (basePrice > 0 || (pp > 0 && buyPound > 0)) {
    const defaultPound = Number(row?.product?.defaultPound ?? 2);
    const extraPounds = Math.max(0, buyPound - defaultPound);
    const productAmount = basePrice + pp * extraPounds;
    const deliveryFee = Number(row?.deliveryFee ?? 0);
    return `≈¥${(productAmount + deliveryFee).toFixed(2)}`;
  }
  return '-';
}

function formatTime(t: string) {
  if (!t) return '-';
  return new Date(t).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
}

onMounted(async () => {
  const qStatus = route.query.status as string;
  if (qStatus) filters.value.status = qStatus;
  fetchPricePerPound();
  await fetch();
  const qId = route.query.id as string;
  if (qId) {
    openDetail({ id: Number(qId) });
  }
});
</script>

<style scoped>
.order-page {
  max-width: 1440px;
}

h4 {
  margin: 0 0 10px;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 800;
  color: var(--cake-text);
  letter-spacing: -0.02em;
}

.contact-name {
  font-weight: 600;
  color: var(--cake-text);
}

.contact-phone {
  font-size: 12px;
  color: var(--cake-muted);
  margin-top: 2px;
}

.quick-status-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
  padding: 12px 16px;
  border: 1px solid var(--cake-border);
  border-radius: var(--radius-md);
  background: var(--cake-surface);
}

.status-tag {
  cursor: pointer;
  font-size: 13px;
  padding: 4px 14px;
  transition: transform var(--transition-fast);
}

.status-tag:hover {
  transform: scale(1.05);
}

.order-page :deep(.el-form) {
  margin-bottom: 14px;
  padding: 16px 16px 0;
  border: 1px solid var(--cake-border);
  border-radius: var(--radius-md);
  background: var(--cake-surface);
}

.order-page :deep(.el-table) {
  border: 1px solid var(--cake-border);
}

.order-page :deep(.el-pagination) {
  padding: 14px 0 0;
}

.order-page :deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
