<template>
  <view class="empty-state">
    <text class="empty-icon">{{ icon }}</text>
    <text class="empty-title">{{ title }}</text>
    <text v-if="description" class="empty-desc">{{ description }}</text>
    <view v-if="actionText" class="empty-action" @click="$emit('action')">
      {{ actionText }}
    </view>
  </view>
</template>

<script>
export default {
  props: {
    icon: { type: String, default: '🎂' },
    title: { type: String, default: '暂无内容' },
    description: { type: String, default: '' },
    actionText: { type: String, default: '' }
  },
  emits: ['action']
}
</script>

<style lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 48rpx;
  text-align: center;
}

.empty-icon {
  font-size: 96rpx;
  line-height: 1;
  position: relative;
}

.empty-icon::after {
  content: '';
  position: absolute;
  bottom: -8rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 4rpx;
  background: #2d5fbf;
  border-radius: 2rpx;
}

.empty-title {
  display: block;
  margin-top: 36rpx;
  font-size: 32rpx;
  font-weight: 700;
  color: #2d2521;
}

.empty-desc {
  display: block;
  margin-top: 16rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: #846959;
  max-width: 480rpx;
}

.empty-action {
  margin-top: 32rpx;
  padding: 20rpx 44rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #d95c33 0%, #e87840 100%);
  font-size: 26rpx;
  font-weight: 700;
  color: #fff;
  position: relative;
}

.empty-action::after {
  content: '';
  position: absolute;
  right: 14rpx;
  bottom: 10rpx;
  width: 10rpx;
  height: 10rpx;
  background: #2d5fbf;
  border-radius: 2rpx;
}
</style>
