<template>
  <view class="onboarding-overlay" v-if="visible" @click="handleMaskClick">
    <view class="onboarding-card" @click.stop>
      <swiper class="onboard-swiper" :current="current" @change="onSwiperChange" indicator-dots>
        <swiper-item v-for="(slide, idx) in slides" :key="idx">
          <view class="slide-content">
            <text class="slide-icon">{{ slide.icon }}</text>
            <text class="slide-title">{{ slide.title }}</text>
            <text class="slide-desc">{{ slide.description }}</text>
          </view>
        </swiper-item>
      </swiper>
      <view class="onboard-actions">
        <view class="onboard-skip" @click="close">跳过</view>
        <view class="onboard-next" @click="handleNext">
          {{ isLast ? '开始使用' : '下一步' }}
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { getStorage, setStorage } from '@/utils/storage'

const ONBOARDING_KEY = 'onboarding_completed'

export default {
  data() {
    return {
      visible: false,
      current: 0,
      slides: [
        { icon: '🎂', title: '选择你喜欢的款式', description: '浏览蛋糕案例和商品，找到心仪的款式风格' },
        { icon: '📝', title: '填写定制需求', description: '选择磅数、口味、主题，填写祝福语和预约时间' },
        { icon: '🎉', title: '线下付款取货', description: '提交后商家接单确认，线下付款后到店自提或配送' }
      ]
    }
  },
  computed: {
    isLast() {
      return this.current >= this.slides.length - 1
    }
  },
  mounted() {
    if (!getStorage(ONBOARDING_KEY, false)) {
      setTimeout(() => { this.visible = true }, 500)
    }
  },
  methods: {
    onSwiperChange(e) {
      this.current = e.detail.current
    },
    handleNext() {
      if (this.isLast) {
        this.close()
      } else {
        this.current += 1
      }
    },
    handleMaskClick() {
      this.close()
    },
    close() {
      this.visible = false
      setStorage(ONBOARDING_KEY, true)
      this.$emit('close')
    }
  }
}
</script>

<style lang="scss">
.onboarding-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 21, 18, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: onboardFadeIn 0.3s ease;
}

@keyframes onboardFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.onboarding-card {
  width: 600rpx;
  border-radius: 32rpx;
  background: #fffdf8;
  box-shadow: 0 24rpx 60rpx rgba(26, 21, 18, 0.24);
  overflow: hidden;
  padding: 48rpx 40rpx 40rpx;
}

.onboard-swiper {
  height: 440rpx;
}

.slide-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 20rpx;
  text-align: center;
}

.slide-icon {
  font-size: 88rpx;
  margin-bottom: 32rpx;
  position: relative;
}

.slide-icon::after {
  content: '';
  position: absolute;
  bottom: -12rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background: #d95c33;
  border-radius: 2rpx;
}

.slide-title {
  display: block;
  font-size: 36rpx;
  font-weight: 800;
  color: #2d2521;
}

.slide-desc {
  display: block;
  margin-top: 20rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: #846959;
  max-width: 400rpx;
}

.onboard-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 28rpx;
}

.onboard-skip {
  font-size: 26rpx;
  color: #b5a294;
}

.onboard-next {
  padding: 18rpx 38rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #d95c33 0%, #e87840 100%);
  font-size: 26rpx;
  font-weight: