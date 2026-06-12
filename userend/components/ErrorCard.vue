<template>
  <view class="error-card">
    <text class="error-icon">!</text>
    <text class="error-text">{{ message }}</text>
    <view v-if="showRetry" class="retry-btn" @click="$emit('retry')">重新加载</view>
  </view>
</template>

<script>
export default {
  props: {
    message: { type: String, default: '暂时加载失败，请稍后重试' },
    showRetry: { type: Boolean, default: true }
  },
  emits: ['retry']
}
</script>

<style lang="scss">
.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx;
  margin: 24rpx;
  border-radius: 24rpx;
  background: #fff3f1;
  border-left: 6rpx solid #d95c33;
  box-shadow: 0 10rpx 30rpx rgba(217, 92, 51, 0.08);
}

.error-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #d95c33;
  color: #fff;
  font-size: 40rpx;
  font-weight: 800;
  text-align: center;
  line-height: 72rpx;
  box-shadow: 0 0 0 4rpx rgba(45, 95, 191, 0.2);
}

.error-text {
  display: block;
  margin-top: 24rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: #9f5d3f;
  text-align: center;
}

.retry-btn {
  width: 220rpx;
  height: 76rpx;
  margin-top: 24rpx;
  border-radius: 999rpx;
  background: #ffe2cf;
  text-align: center;
  line-height: 76rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: #8b5136;
}
</style>
