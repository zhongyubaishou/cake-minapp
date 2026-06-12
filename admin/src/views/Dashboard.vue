<template>
  <div class="dashboard" v-loading="loading" element-loading-text="数据加载中...">
    <div class="page-title-row">
      <div>
        <h1 class="page-title">工作台</h1>
        <p class="page-subtitle">今日订单、待处理事项与经营概览</p>
      </div>
      <el-button type="primary" @click="fetchData">刷新数据</el-button>
    </div>

    <div v-if="error" class="error-box">
      <p>数据加载失败：{{ error }}</p>
      <el-button type="primary" size="small" @click="fetchData">重新加载</el-button>
    </div>

    <h4 class="section-title">今日数据</h4>
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">今日订单数</div>
          <div class="stat-value primary">{{ stats.todayOrders }}</div>
          <div class="stat-badge primary-badge"></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">今日已付款</div>
          <div class="stat-value success">{{ stats.todayPaidOrders }}</div>
          <div class="stat-badge success-badge"></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">今日销售额</div>
          <div class="stat-value primary">{{ formatMoney(stats.todaySales) }}</div>
          <div class="stat-badge primary-badge"></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">今日退款金额</div>
          <div class="stat-value warning">{{ formatMoney(stats.todayRefundAmount) }}</div>
          <div class="stat-badge warning-badge"></div>
        </el-card>
      </el-col>
    </el-row>

    <h4 class="section-title">待处理事项</h4>
    <el-row :gutter="16">
      <el-col :span="4" v-for="item in pendingItems" :key="item.label">
        <el-card shadow="hover" class="stat-card pending-card" :class="item.class" @click="item.link && goLink(item.link)">
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-value" :class="item.count > 0 ? 'danger' : 'muted'">{{ item.count }}</div>
          <div class="stat-action" v-if="item.link && item.count > 0">处理 →</div>
          <div class="stat-badge" :class="item.badgeClass"></div>
        </el-card>
      </el-col>
    </el-row>

    <h4 class="section-title">快捷操作</h4>
    <el-row :gutter="16">
      <el-col :span="4" v-for="qa in quickActions" :key="qa.label">
        <el-card shadow="hover" class="quick-action-card" @click="goLink(qa.link)">
          <div class="qa-label">{{ qa.label }}</div>
          <div class="qa-desc">{{ qa.desc }}</div>
        </el-card>
      </el-col>
    </el-row>

    <h4 class="section-title">最新订单</h4>
    <el-table :data="stats.latestOrders" stripe size="small">
      <el-table-column prop="orderNo" label="订单号" width="180" />
      <el-table-column prop="productName" label="商品" min-width="140" />
      <el-table-column label="金额" width="100">
        <template #default="{ row }">{{ row.totalAmount ?? '-' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="140">
        <template #default="{ row }">
          <el-tag :type="statusTag(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="下单时间" width="160">
        <template #default="{ row }">{{ formatTime(row.orderedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="80">
        <template #default="{ row }">
          <el-button size="small" text type="primary" @click="goLink(`/orders?id=${row.id}`)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <p class="note">注：销售额按商家确认接单口径统计（非微信支付流水），退款金额暂不统计线上退款。</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import http from '@/api/http';

const router = useRouter();

const loading = ref(false);
const error = ref('');
const mounted = ref(true);
onUnmounted(() => { mounted.value = false });

const stats = ref({
  todayOrders: 0,
  todayPaidOrders: 0,
  todaySales: 0,
  todayRefundAmount: 0,
  waitAcceptCount: 0,
  waitPickupCount: 0,
  waitDeliveryCount: 0,
  refundingCount: 0,
  afterSalePendingCount: 0,
  paidWaitMakeCount: 0,
  makingCount: 0,
  deliveringCount: 0,
  outsideHoursCount: 0,
  latestOrders: [] as any[],
});

const pendingItems = computed(() => [
  { label: '待接单', count: stats.value.waitAcceptCount, link: '/orders?status=WAIT_ACCEPT', class: 'warning-border', badgeClass: 'warning-badge' },
  { label: '待制作', count: stats.value.paidWaitMakeCount, link: '/orders?status=PAID_WAIT_MAKE', class: 'warning-border', badgeClass: 'warning-badge' },
  { label: '制作中', count: stats.value.makingCount, link: '/orders?status=MAKING', class: 'info-border', badgeClass: 'info-badge' },
  { label: '待自提', count: stats.value.waitPickupCount, link: '/orders?status=WAIT_PICKUP', class: 'info-border', badgeClass: 'info-badge' },
  { label: '待配送', count: stats.value.waitDeliveryCount, link: '/orders?status=WAIT_DELIVERY', class: 'info-border', badgeClass: 'info-badge' },
  { label: '配送中', count: stats.value.deliveringCount, link: '/orders?status=DELIVERING', class: 'info-border', badgeClass: 'info-badge' },
  { label: '非营业时间', count: stats.value.outsideHoursCount, link: '/orders', class: 'warning-border', badgeClass: 'warning-badge' },
  { label: '退款中', count: stats.value.refundingCount, link: '/after-sales?status=REFUNDING', class: 'danger-border', badgeClass: 'danger-badge' },
  { label: '售后反馈', count: stats.value.afterSalePendingCount, link: '/after-sales?status=PENDING', class: 'warning-border', badgeClass: 'warning-badge' },
]);

const quickActions = [
  { label: '待接单处理', desc: '确认报价', link: '/orders?status=WAIT_ACCEPT' },
  { label: '查看待配送', desc: '配送管理', link: '/delivery' },
  { label: '案例管理', desc: '维护案例', link: '/cases' },
  { label: '售后反馈', desc: '处理问题', link: '/after-sales' },
  { label: '数据报表', desc: '经营统计', link: '/reports' },
  { label: '商品管理', desc: '维护商品', link: '/products' },
  { label: '分类管理', desc: '维护分类', link: '/categories' },
  { label: '门店设置', desc: '门店信息', link: '/settings' },
];

const statusMap: Record<string, string> = {
  WAIT_ACCEPT: '待接单',
  PAID_WAIT_MAKE: '已支付/待制作',
  MAKING: '制作中',
  WAIT_PICKUP: '待自提',
  WAIT_DELIVERY: '待配送',
  DELIVERING: '配送中',
  COMPLETED: '已完成',
  CANCELED: '已取消',
  REFUNDING: '退款中',
  REFUNDED: '已退款',
};

function statusText(status: string): string {
  return statusMap[status] || status;
}

function statusTag(status: string): string {
  const map: Record<string, string> = {
    WAIT_ACCEPT: 'warning', PAID_WAIT_MAKE: 'success', MAKING: '',
    WAIT_PICKUP: 'info', WAIT_DELIVERY: 'info', DELIVERING: '',
    COMPLETED: 'success', CANCELED: 'danger', REFUNDING: 'warning', REFUNDED: 'info',
  };
  return map[status] || 'info';
}

function formatMoney(n: number) {
  if (n == null || isNaN(Number(n))) return '-';
  if (n === 0) return '-';
  return `¥${Number(n).toFixed(2)}`;
}

function formatTime(t: string) {
  if (!t) return '-';
  return new Date(t).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
}

function goLink(link: string) {
  const [path, qs] = link.split('?');
  router.push({ path, query: qs ? Object.fromEntries(new URLSearchParams(qs)) : undefined });
}

async function fetchData() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await http.get('/dashboard');
    if (!mounted.value) return;
    if (data.code === 0) {
      stats.value = data.data;
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || '网络异常，请稍后重试';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.dashboard {
  max-width: 1440px;
}

.error-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
  padding: 14px 18px;
  border: 1px solid var(--cake-danger-soft);
  border-radius: var(--radius-md);
  background: var(--cake-danger-soft);
}

.error-box p {
  margin: 0;
  color: var(--cake-danger);
  font-size: 14px;
  font-weight: 600;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 28px 0 14px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 800;
  color: var(--cake-text);
  letter-spacing: -0.02em;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 18px;
  border-radius: var(--radius-full);
  background: var(--cake-primary);
}

.stat-card {
  position: relative;
  overflow: hidden;
  min-height: 118px;
  text-align: left;
  cursor: default;
  background: var(--cake-surface);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card.pending-card {
  cursor: pointer;
}

.stat-card.pending-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 14px;
  right: 14px;
  height: 4px;
  border-radius: 0 0 var(--radius-full) var(--radius-full);
  background: transparent;
}

.stat-card :deep(.el-card__body) {
  height: 100%;
}

.stat-badge {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  opacity: 0.08;
  pointer-events: none;
}

.primary-badge { background: var(--cake-primary); }
.success-badge { background: var(--cake-success); }
.warning-badge { background: var(--cake-warning); }
.danger-badge { background: var(--cake-danger); }
.info-badge { background: var(--cake-info); }

.stat-label {
  color: var(--cake-muted);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 10px;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 30px;
  line-height: 1.1;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--cake-text);
}

.stat-value.primary { color: var(--cake-primary); }
.stat-value.success { color: var(--cake-success); }
.stat-value.warning { color: var(--cake-warning); }
.stat-value.danger { color: var(--cake-danger); }
.stat-value.muted { color: var(--cake-placeholder); }

.stat-action {
  color: var(--cake-primary);
  font-size: 12px;
  font-weight: 700;
  margin-top: 10px;
}

.warning-border::before { background: var(--cake-warning); }
.info-border::before { background: var(--cake-info); }
.danger-border::before { background: var(--cake-danger); }

.quick-action-card {
  min-height: 92px;
  cursor: pointer;
  transition: transform var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
  background: var(--cake-surface);
}

.quick-action-card:hover {
  transform: translateY(-3px);
  border-color: var(--cake-primary);
  box-shadow: var(--shadow-md);
}

.qa-label {
  font-size: 15px;
  font-weight: 700;
  color: var(--cake-text);
  margin-bottom: 6px;
}

.qa-desc {
  font-size: 12px;
  font-weight: 500;
  color: var(--cake-muted);
}

.note {
  color: var(--cake-muted);
  font-size: 12px;
  margin-top: 16px;
}
</style>
