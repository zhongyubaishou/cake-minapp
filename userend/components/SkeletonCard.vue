<template>
  <view class="skeleton-wrap">
    <view v-for="i in repeatCount" :key="i" class="skeleton-card" :class="`skeleton-${type}`">
      <view v-if="type === 'list'" class="sk-list">
        <view class="sk-thumb"></view>
        <view class="sk-body">
          <view class="sk-line sk-line-long"></view>
          <view class="sk-line sk-line-short"></view>
          <view class="sk-line sk-line-medium"></view>
        </view>
      </view>
      <view v-else-if="type === 'detail'" class="sk-detail">
        <view class="sk-banner"></view>
        <view class="sk-section">
          <view class="sk-line sk-line-long"></view>
          <view class="sk-line sk-line-full"></view>
        </view>
        <view class="sk-section">
          <view class="sk-line sk-line-short"></view>
          <view class="sk-row">
            <view class="sk-chip"></view>
            <view class="sk-chip"></view>
            <view class="sk-chip"></view>
          </view>
        </view>
        <view class="sk-section">
          <view class="sk-line sk-line-short"></view>
          <view class="sk-row">
            <view class="sk-chip"></view>
            <view class="sk-chip"></view>
          </view>
        </view>
      </view>
      <view v-else class="sk-card">
        <view class="sk-image"></view>
        <view class="sk-card-body">
          <view class="sk-line sk-line-long"></view>
          <view class="sk-line sk-line-medium"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    type: { type: String, default: 'list', validator: (v) => ['list', 'detail', 'card'].includes(v) },
    count: { type: Number, default: 3 }
  },
  computed: {
    repeatCount() {
      return Math.max(1, Math.min(this.count, 6))
    }
  }
}
</script>

<style lang="scss">
.skeleton-wrap {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding: 24rpx;
}

.skeleton-card {
  border-radius: 24rpx;
  background: #fff;
  padding: 24rpx;
  overflow: hidden;
}

@keyframes skShimmer {
  0% { opacity: 0.4; }
  50% { opacity: 0.8; }
  100% { opacity: 0.4; }
}

.sk-thumb,
.sk-banner,
.sk-image,
.sk-chip,
.sk-line {
  background: linear-gradient(120deg, #f0e7e0 25%, #e8ddd4 50%, #f0e7e0 75%);
  animation: skShimmer 1.6s ease-in-out infinite;
  border-radius: 8rpx;
}

.sk-list {
  display: flex;
  gap: 18rpx;
}

.sk-thumb {
  width: 140rpx;
  height: 140rpx;
  border-radius: 18rpx;
  flex-shrink: 0;
}

.sk-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-top: 8rpx;
}

.sk-line-long { width: 80%; height: 24rpx; }
.sk-line-short { width: 45%; height: 24rpx; }
.sk-line-medium { width: 60%; height: 24rpx; }
.sk-line-full { width: 100%; height: 24rpx; }

.sk-detail {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}

.sk-banner {
  width: 100%;
  height: 320rpx;
  border-radius: 20rpx;
  margin: -24rpx -24rpx 0 -24rpx;
  width: calc(100% + 48rpx);
}

.sk-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.sk-row {
  display: flex;
  gap: 16rpx;
}

.sk-chip {
  width: 120rpx;
  height: 52rpx;
  border-radius: 999rpx;
}

.sk-card {
  border-radius: 24rpx;
  overflow: hidden;
}

.sk-image {
  width: 100%;
  height: 300rpx;
  margin: -24rpx -24rpx 0 -24rpx;
  width: calc(100% + 48rpx);
}

.sk-card-body {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-top: 20rpx;
}
</style>
