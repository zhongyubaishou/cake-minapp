<template>
  <view
    class="option-chip"
    :class="{ active, disabled }"
    @click="handleClick"
  >
    {{ label }}
  </view>
</template>

<script>
export default {
  props: {
    label: { type: String, default: '' },
    active: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false }
  },
  emits: ['click'],
  methods: {
    handleClick() {
      if (!this.disabled) {
        this.$emit('click')
      }
    }
  }
}
</script>

<style lang="scss">
.option-chip {
  padding: 16rpx 26rpx;
  border-radius: 999rpx;
  background-image:
    repeating-linear-gradient(45deg, transparent, transparent 6rpx, rgba(217, 92, 51, 0.03) 6rpx, rgba(217, 92, 51, 0.03) 7rpx);
  background-color: rgba(217, 92, 51, 0.06);
  font-size: 26rpx;
  font-weight: 700;
  color: #7d5842;
  position: relative;
  display: inline-flex;
  align-items: center;
}

.option-chip.active {
  background: #d95c33;
  color: #fff;
  background-image: none;
  box-shadow: inset 0 0 0 3rpx rgba(45, 95, 191, 0.25);
}

.option-chip.active::after {
  content: '';
  position: absolute;
  right: 10rpx;
  bottom: 6rpx;
  width: 10rpx;
  height: 10rpx;
  background: rgba(232, 184, 48, 0.7);
  border-radius: 2rpx;
}

.option-chip.disabled {
  opacity: 0.4;
}
</style>
