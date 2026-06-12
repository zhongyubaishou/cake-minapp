<template>
  <view class="network-bar" :class="{ show: !isOnline, hide: isOnline }" @click="retryLast">
    <text class="network-icon">⚡</text>
    <text class="network-text">{{ isOnline ? '网络已恢复' : '网络连接已断开，请检查网络设置' }}</text>
  </view>
</template>

<script>
export default {
  data() {
    return {
      isOnline: true
    }
  },
  mounted() {
    this.checkNetwork()
    this.startMonitoring()
  },
  beforeDestroy() {
    this.stopMonitoring()
  },
  methods: {
    checkNetwork() {
      uni.getNetworkType({
        success: (res) => {
          this.isOnline = res.networkType !== 'none'
        }
      })
    },
    startMonitoring() {
      uni.onNetworkStatusChange((res) => {
        const wasOnline = this.isOnline
        this.isOnline = res.isConnected
        if (!wasOnline && res.isConnected) {
          setTimeout(() => { this.isOnline = true }, 2000)
        }
      })
    },
    stopMonitoring() {
      uni.offNetworkStatusChange(() => {})
    },
    retryLast() {
      this.checkNetwork()
    }
  }
}
</script>

<style lang="scss">
.network-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  height: 64rpx;
  background: #d95c33;
  transform: translateY(-100%);
  transition: transform 0.3s ease;
}

.network-bar.show {
  transform: translateY(0);
}

.network-bar.hide {
  transform: translateY(-100%);
}

.network-icon {
  font-size: 28rpx;
}

.network-text {
  font-size: 24rpx;
  color: #fff;
}
</style>
