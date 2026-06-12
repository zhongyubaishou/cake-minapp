<template>
  <view class="image-uploader">
    <view class="upload-row">
      <view v-for="(item, index) in localImages" :key="`${item}-${index}`" class="image-thumb">
        <image class="thumb-image" :src="item" mode="aspectFill"></image>
        <view class="thumb-remove" @click="removeImage(index)">删除</view>
      </view>
      <view v-if="localImages.length < maxCount && !disabled" class="upload-box" @click="chooseImage">
        <text>{{ uploading ? '上传中...' : '+ 上传图片' }}</text>
      </view>
    </view>
    <text v-if="hint" class="upload-hint">{{ hint }}</text>
  </view>
</template>

<script>
import { uploadFile } from '@/api/upload'
import { UPLOAD_BIZ_TYPE } from '@/constants/order'

function pickValue(source, keys, fallback = '') {
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index]
    if (source && source[key] !== null && typeof source[key] !== 'undefined') {
      return source[key]
    }
  }
  return fallback
}

export default {
  props: {
    images: { type: Array, default: () => [] },
    max: { type: Number, default: 3 },
    bizType: { type: String, default: UPLOAD_BIZ_TYPE.ORDER_REF },
    disabled: { type: Boolean, default: false },
    hint: { type: String, default: '' }
  },
  emits: ['update:images', 'change'],
  data() {
    return {
      uploading: false,
      localImages: [...this.images]
    }
  },
  computed: {
    maxCount() {
      return Math.max(1, this.max)
    }
  },
  watch: {
    images: {
      handler(val) {
        this.localImages = [...val]
      }
    }
  },
  methods: {
    removeImage(index) {
      this.localImages.splice(index, 1)
      this.emitChange()
    },
    emitChange() {
      this.$emit('update:images', [...this.localImages])
      this.$emit('change', [...this.localImages])
    },
    async chooseImage() {
      if (this.uploading || this.disabled) return

      if (this.localImages.length >= this.maxCount) {
        uni.showToast({ title: `最多上传 ${this.maxCount} 张`, icon: 'none' })
        return
      }

      try {
        const chooseResult = await new Promise((resolve, reject) => {
          uni.chooseImage({
            count: 1,
            sizeType: ['compressed'],
            sourceType: ['album', 'camera'],
            success: resolve,
            fail: reject
          })
        })

        const filePath = chooseResult.tempFilePaths && chooseResult.tempFilePaths[0]
        if (!filePath) return

        this.uploading = true
        const uploadResult = await uploadFile({ filePath, bizType: this.bizType })
        const fileUrl = pickValue(uploadResult, ['fileUrl', 'url'], '')

        if (!fileUrl) {
          throw new Error('上传成功但未返回图片地址')
        }

        this.localImages.push(fileUrl)
        this.emitChange()
      } catch (error) {
        if (error && error.errMsg && error.errMsg.includes('cancel')) return
        uni.showToast({
          title: error.message || '图片上传失败，请稍后重试',
          icon: 'none'
        })
      } finally {
        this.uploading = false
      }
    }
  }
}
</script>

<style lang="scss">
.image-uploader {
  width: 100%;
}

.upload-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-thumb {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: 18rpx;
  overflow: hidden;
}

.thumb-image {
  width: 100%;
  height: 100%;
  border-radius: 18rpx;
  background: #f3e2d4;
}

.thumb-remove {
  position: absolute;
  right: 8rpx;
  bottom: 8rpx;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(26, 21, 18, 0.72);
  font-size: 20rpx;
  color: #fff;
}

.upload-box {
  width: 160rpx;
  height: 160rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 2rpx dashed #2d5fbf;
  border-radius: 18rpx;
  font-size: 24rpx;
  color: #2d5fbf;
}

.upload-hint {
  display: block;
  margin-top: 14rpx;
  font-size: 22rpx;
  color: #8d7564;
}
</style>
