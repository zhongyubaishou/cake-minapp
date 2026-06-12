<template>
  <div v-loading="loading">
    <div class="page-header">
      <h3>数据报表</h3>
    </div>

    <el-form :inline="true">
      <el-form-item label="日期">
        <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="fetch">查询</el-button>
        <el-button @click="setToday">今日</el-button>
        <el-button @click="setLast7">最近7天</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="16" class="metrics">
      <el-col :span="6" v-for="item in metrics" :key="item.label">
        <el-card shadow="hover">
          <div class="metric-label">{{ item.label }}</div>
          <div class="metric-value">{{ item.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="10">
        <h4>订单状态统计</h4>
        <el-table :data="statusRows" stripe>
          <el-table-column prop="label" label="状态" />
          <el-table-column prop="count" label="数量" width="100" />
        </el-table>
      </el-col>
      <el-col :span="14">
        <h4>商品销售排行</h4>
        <el-table :data="summary.topProducts" stripe>
          <el-table-column prop="productName" label="商品名称" />
          <el-table-column prop="count" label="销售数量" width="110" />
          <el-table-column label="销售额" width="120">
            <template #default="{ row }">{{ money(row.amount) }}</template>
          </el-table-column>
        </el-table>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import http from '@/api/http';

const today = new Date().toISOString().slice(0, 10);
const loading = ref(false);
const dateRange = ref<[string, string]>([today, today]);
const summary = ref<any>({ orderCount: 0, paidOrderCount: 0, totalSales: 0, totalRefundAmount: 0, statusStats: {}, topProducts: [] });
const mounted = ref(true);
onUnmounted(() => { mounted.value = false });

const statusMap: Record<string, string> = {
  WAIT_ACCEPT: '待接单', WAIT_PAY: '待支付', PAID_WAIT_MAKE: '已支付/待制作', MAKING: '制作中',
  WAIT_PICKUP: '待自提', WAIT_DELIVERY: '待配送', DELIVERING: '配送中', COMPLETED: '已完成',
  CANCELED: '已取消', REFUNDING: '退款中', REFUNDED: '已退款',
};

const metrics = computed(() => [
  { label: '订单数', value: summary.value.orderCount },
  { label: '已付款订单', value: summary.value.paidOrderCount },
  { label: '销售额', value: money(summary.value.totalSales) },
  { label: '退款金额', value: money(summary.value.totalRefundAmount) },
]);

const statusRows = computed(() => Object.entries(summary.value.statusStats || {}).map(([status, count]) => ({
  label: statusMap[status] || status,
  count,
})));

async function fetch() {
  loading.value = true;
  try {
    const [startDate, endDate] = dateRange.value || [today, today];
    const { data } = await http.get('/reports/summary', { params: { startDate, endDate } });
    if (!mounted.value) return;
    if (data.code === 0) summary.value = data.data;
  } catch {
    summary.value = { orderCount: 0, paidOrderCount: 0, totalSales: 0, totalRefundAmount: 0, statusStats: {}, topProducts: [] };
  } finally {
    loading.value = false;
  }
}

function setToday() {
  dateRange.value = [today, today];
  fetch();
}

function setLast7() {
  const start = new Date();
  start.setDate(start.getDate() - 6);
  dateRange.value = [start.toISOString().slice(0, 10), today];
  fetch();
}

function money(value: number) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

onMounted(fetch);
</script>

<style scoped>
.page-header { margin-bottom: 16px; }
.page-header h3 { margin: 0; }
.metrics { margin: 8px 0 20px; }
.metric-label { color: #909399; font-size: 13px; margin-bottom: 8px; }
.metric-value { color: #303133; font-size: 26px; font-weight: 700; }
h4 { margin: 8px 0 12px; color: #606266; }
</style>
