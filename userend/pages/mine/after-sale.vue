<template>
	<scroll-view class="after-sale-page" scroll-y>
		<view v-if="!orderId" class="empty-box">
			<text class="empty-title">售后反馈</text>
			<text class="empty-desc">请从订单详情页点击"申请售后"进入，方便我们为您快速定位问题。</text>
			<view class="go-btn" @click="goOrders">查看我的订单</view>
		</view>

		<template v-else-if="orderLoaded">
			<view class="notice-card">
				<text class="notice-title">售后说明</text>
				<text class="notice-desc">仅已完成且 3 天内的订单可提交售后。提交后商家会尽快与您联系处理。</text>
			</view>

			<view class="form-card order-summary" v-if="orderInfo">
				<text class="section-title">关联订单</text>
				<view class="summary-row">
					<text class="summary-label">订单号</text>
					<text class="summary-value">{{ orderInfo.orderNo || '--' }}</text>
				</view>
				<view class="summary-row">
					<text class="summary-label">商品</text>
					<text class="summary-value">{{ orderInfo.productName || '定制蛋糕' }}</text>
				</view>
				<view class="summary-row">
					<text class="summary-label">下单时间</text>
					<text class="summary-value">{{ formatDateTime(orderInfo.createdAt) }}</text>
				</view>
			</view>

			<view v-if="orderInfo && orderInfo.afterSale" class="form-card after-sale-record">
				<text class="section-title">售后记录</text>
				<view class="status-badge" :class="orderInfo.afterSale.status">
					{{ orderInfo.afterSale.statusText }}
				</view>
				<view class="info-row">
					<text class="info-label">提交时间</text>
					<text class="info-value">{{ formatDateTime(orderInfo.afterSale.createdAt) }}</text>
				</view>
				<view class="info-row top-align">
					<text class="info-label">问题描述</text>
					<text class="info-value multiline">{{ orderInfo.afterSale.description }}</text>
				</view>
				<view v-if="orderInfo.afterSale.images.length" class="image-block">
					<text class="image-label">凭证图片</text>
					<view class="image-list">
						<image v-for="(image, index) in orderInfo.afterSale.images" :key="`${image}-${index}`" class="thumb" :src="image" mode="aspectFill" @click="previewImage(index)"></image>
					</view>
				</view>
			</view>

			<view v-if="canSubmit" class="form-card">
				<text class="section-title">问题描述</text>
				<textarea class="desc-input" v-model="form.description" placeholder="请详细描述您遇到的问题，以便商家快速为您处理。" maxlength="500" placeholder-style="color:#b5a294;" />

				<text class="section-title" style="margin-top: 28rpx;">上传凭证（选填）</text>
				<text class="sub-note">支持上传聊天截图、照片等凭证，最多 3 张。</text>
				<view class="image-row">
					<view v-for="(item, index) in form.images" :key="`${item}-${index}`" class="image-thumb" @click="removeImage(index)">
						<image :src="item" mode="aspectFill"></image>
						<view class="remove-icon">×</view>
					</view>
					<view v-if="form.images.length < 3" class="upload-box" @click="chooseImage">+ 上传图片</view>
				</view>

				<view class="submit-btn" :class="{ disabled: submitting }" @click="handleSubmit">
					{{ submitting ? '提交中...' : '提交反馈' }}
				</view>
			</view>

			<view v-if="!canSubmit && orderInfo && !orderInfo.afterSale" class="form-card">
				<text class="section-title">暂不支持提交</text>
				<text class="hint-text">{{ submitHint }}</text>
			</view>

			<view v-if="submitError" class="error-card">
				<text class="error-text">{{ submitError }}</text>
			</view>
		</template>

		<view v-else-if="orderLoaded === false" class="empty-box">
			<text class="empty-title">{{ loadError || '订单加载失败' }}</text>
			<text class="empty-desc">{{ loadError ? '' : '请确认订单编号是否正确。' }}</text>
			<view class="retry-btn" @click="loadOrderInfo">重新加载</view>
		</view>
	</scroll-view>
</template>

<script>
	import { getOrderDetail, submitAfterSale } from '@/api/order'
	import { uploadFile } from '@/api/upload'
	import { UPLOAD_BIZ_TYPE, ORDER_STATUS } from '@/constants/order'
	import { STORE_INFO } from '@/constants/app'
	import { formatDateTime } from '@/utils/format'

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
		data() {
			return {
				orderId: '',
				orderInfo: null,
				orderLoaded: null,
				loadError: '',
				submitError: '',
				submitting: false,
				uploading: false,
				form: {
					description: '',
					images: []
				}
			}
		},
		computed: {
			canSubmit() {
				if (!this.orderInfo) {
					return false
				}
				if (this.orderInfo.afterSale) {
					return false
				}
				if (this.orderInfo.status !== ORDER_STATUS.COMPLETED) {
					return false
				}
				if (this.orderInfo.completedAt) {
					const completedDate = new Date(this.orderInfo.completedAt)
					const now = new Date()
					const daysDiff = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24)
					if (daysDiff > 3) {
						return false
					}
				}
				return true
			},
			submitHint() {
				if (!this.orderInfo) {
					return ''
				}
				if (this.orderInfo.status !== ORDER_STATUS.COMPLETED) {
					return '仅已完成订单可提交售后反馈，请等待订单完成后操作。'
				}
				return '售后入口已关闭（已完成超过 3 天），如有问题请联系商家。'
			}
		},
		onLoad(options) {
			this.orderId = options.orderId || ''
			if (this.orderId) {
				this.loadOrderInfo()
			} else {
				this.orderLoaded = null
			}
		},
		methods: {
			formatDateTime,
			async loadOrderInfo() {
				if (!this.orderId) {
					this.orderInfo = null
					this.orderLoaded = false
					return
				}

				try {
					this.loadError = ''
					this.orderInfo = await getOrderDetail(this.orderId)
					this.orderLoaded = true
				} catch (error) {
					this.orderInfo = null
					this.orderLoaded = false
					this.loadError = error.message || '订单信息暂时加载失败，请稍后重试'
				}
			},
			removeImage(index) {
				this.form.images.splice(index, 1)
			},
			async chooseImage() {
				if (this.uploading) {
					return
				}

				if (this.form.images.length >= 3) {
					uni.showToast({ title: '最多上传 3 张凭证', icon: 'none' })
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
					if (!filePath) {
						return
					}

					this.uploading = true
					const uploadResult = await uploadFile({ filePath, bizType: UPLOAD_BIZ_TYPE.AFTER_SALE })
					const fileUrl = pickValue(uploadResult, ['fileUrl', 'url'], '')

					if (!fileUrl) {
						throw new Error('上传成功但未返回图片地址')
					}

					this.form.images.push(fileUrl)
				} catch (error) {
					if (error && error.errMsg && error.errMsg.includes('cancel')) {
						return
					}

					uni.showToast({
						title: error.message || '图片上传失败，请稍后重试',
						icon: 'none'
					})
				} finally {
					this.uploading = false
				}
			},
			async handleSubmit() {
				if (this.submitting) {
					return
				}

				if (!this.form.description.trim()) {
					uni.showToast({ title: '请填写问题描述', icon: 'none' })
					return
				}

				if (!this.orderInfo || !this.orderId) {
					uni.showToast({ title: '订单信息异常，请返回重试', icon: 'none' })
					return
				}

				const confirmResult = await new Promise((resolve) => {
					uni.showModal({
						title: '确认提交',
						content: '提交后商家会尽快与您联系处理，确定要提交吗？',
						confirmText: '确定提交',
						cancelText: '取消',
						confirmColor: '#c55d38',
						success: (res) => resolve(res.confirm)
					})
				})

				if (!confirmResult) {
					return
				}

				try {
					this.submitting = true
					this.submitError = ''
					const result = await submitAfterSale(this.orderId, {
						description: this.form.description.trim(),
						images: this.form.images
					})

					this.orderInfo.afterSale = result.afterSale || {
						description: this.form.description.trim(),
						images: this.form.images,
						status: 'SUBMITTED',
						statusText: '已提交，待处理',
						createdAt: new Date().toISOString()
					}

					this.form.description = ''
					this.form.images = []
					uni.showToast({ title: '售后反馈已提交', icon: 'success' })
				} catch (error) {
					this.submitError = error.message || '提交失败，请稍后重试'
					uni.showToast({ title: this.submitError, icon: 'none' })
				} finally {
					this.submitting = false
				}
			},
			previewImage(current) {
				const images = this.orderInfo && this.orderInfo.afterSale && this.orderInfo.afterSale.images
				if (!images || !images.length) {
					return
				}
				uni.previewImage({
					current,
					urls: images
				})
			},
			goOrders() {
			uni.navigateTo({ url: '/pages/order/list' })
		}
		}
	}
</script>

<style lang="scss">
.after-sale-page {
	min-height: 100vh;
	padding: 24rpx 24rpx 80rpx;
	background: linear-gradient(180deg, #fff7ef 0%, #f2ebe2 100%);
}

.notice-card,
.form-card,
.error-card {
	margin-bottom: 20rpx;
	padding: 26rpx;
	border-radius: 24rpx;
	background: #fffdf9;
	box-shadow: 0 14rpx 30rpx rgba(97, 59, 30, 0.06);
}

.notice-card {
	background: linear-gradient(135deg, #fff4e5 0%, #ffe0c9 100%);
}

.notice-title,
.section-title {
	display: block;
	font-size: 28rpx;
	font-weight: 600;
	color: #6b4f3f;
}

.notice-desc {
	display: block;
	margin-top: 12rpx;
	font-size: 24rpx;
	line-height: 1.7;
	color: #7f604d;
}

.sub-note {
	display: block;
	margin-top: 10rpx;
	font-size: 22rpx;
	color: #8d7564;
}

.hint-text {
	display: block;
	margin-top: 14rpx;
	font-size: 24rpx;
	line-height: 1.7;
	color: #8d7564;
}

.summary-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16rpx 0;
	border-bottom: 1rpx solid #f0e4d8;
	font-size: 26rpx;
}

.summary-row:last-child {
	border-bottom: 0;
}

.summary-label {
	color: #806655;
}

.summary-value {
	color: #4d3123;
	font-weight: 600;
}

.status-badge {
	display: inline-flex;
	margin-top: 16rpx;
	padding: 10rpx 22rpx;
	border-radius: 999rpx;
	background: #fff3e7;
	font-size: 24rpx;
	font-weight: 600;
	color: #a86c4a;
}

.status-badge.SUBMITTED {
	background: #fff8e8;
	color: #b8903a;
}

.info-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16rpx 0;
	border-bottom: 1rpx solid #f0e4d8;
	font-size: 26rpx;
}

.info-row:last-child {
	border-bottom: 0;
}

.info-row.top-align {
	align-items: flex-start;
}

.info-label {
	color: #806655;
}

.info-value {
	color: #4d3123;
}

.multiline {
	max-width: 400rpx;
	text-align: right;
	line-height: 1.6;
}

.image-block {
	margin-top: 18rpx;
}

.image-label {
	display: block;
	font-size: 24rpx;
	color: #a68d7a;
}

.image-list {
	display: flex;
	gap: 16rpx;
	margin-top: 14rpx;
}

.thumb {
	width: 140rpx;
	height: 140rpx;
	border-radius: 16rpx;
	background: #f3e2d4;
}

.desc-input {
	width: 100%;
	min-height: 200rpx;
	margin-top: 18rpx;
	padding: 20rpx;
	border-radius: 18rpx;
	background: #fdf6ee;
	font-size: 26rpx;
	color: #4d3123;
	box-sizing: content-box;
}

.image-row {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	margin-top: 18rpx;
}

.image-thumb {
	position: relative;
	width: 156rpx;
	height: 156rpx;
	border-radius: 18rpx;
	overflow: hidden;
	background: #f3e2d4;
}

.image-thumb image {
	width: 100%;
	height: 100%;
}

.remove-icon {
	position: absolute;
	top: 4rpx;
	right: 4rpx;
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: rgba(0, 0, 0, 0.5);
	color: #fff;
	font-size: 26rpx;
	text-align: center;
	line-height: 40rpx;
}

.upload-box {
	width: 156rpx;
	height: 156rpx;
	border-radius: 18rpx;
	border: 2rpx dashed #d4c4b2;
	background: #fdf6ee;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
	color: #a68d7a;
}

.submit-btn {
	width: 100%;
	height: 88rpx;
	margin-top: 28rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #c85e3c 0%, #eb8750 100%);
	text-align: center;
	line-height: 88rpx;
	font-size: 28rpx;
	font-weight: 700;
	color: #fff9f5;
}

.submit-btn.disabled {
	opacity: 0.6;
}

.error-card {
	background: #fff5f0;
}

.error-text {
	font-size: 24rpx;
	color: #c55d38;
}

.empty-box {
	padding: 100rpx 0;
	text-align: center;
}

.empty-title {
	display: block;
	font-size: 34rpx;
	font-weight: 700;
	color: #4d3124;
}

.empty-desc {
	display: block;
	margin-top: 16rpx;
	font-size: 26rpx;
	line-height: 1.7;
	color: #846959;
	padding: 0 24rpx;
}

.go-btn {
	width: 240rpx;
	height: 76rpx;
	margin: 28rpx auto 0;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #c85e3c 0%, #eb8750 100%);
	text-align: center;
	line-height: 76rpx;
	font-size: 24rpx;
	font-weight: 700;
	color: #fff9f5;
}

.retry-btn {
	width: 220rpx;
	height: 76rpx;
	margin: 24rpx auto 0;
	border-radius: 999rpx;
	background: #fff2e5;
	text-align: center;
	line-height: 76rpx;
	font-size: 24rpx;
	font-weight: 700;
	color: #8e5b40;
}

.after-sale-record {
	margin-top: 20rpx;
}
</style>
