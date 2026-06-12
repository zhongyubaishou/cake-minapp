<template>
	<scroll-view class="confirm-page" scroll-y v-if="draft">
		<view class="summary-card hero-card">
			<text class="hero-title">确认订单</text>
			<text class="hero-desc">提交后订单先进入待接单，商家接单后订单直接进入待自提/待配送。</text>
		</view>

		<view class="summary-card product-card">
			<image class="product-image" :src="getProductImageSrc()" mode="aspectFill" @error="onProductImageError()"></image>
			<view class="product-main">
				<text class="product-title">{{ draft.productName || '定制蛋糕' }}</text>
				<text class="product-meta">分类：{{ draft.categoryName }}</text>
				<text class="product-meta">来源：{{ draft.source === 'PRODUCT' ? '商品详情' : (draft.source === 'CASE' ? '案例定制' : '直接定制') }}</text>
			</view>
		</view>

		<view class="summary-card">
			<text class="section-title">蛋糕信息</text>
			<view class="info-list">
				<view class="info-row"><text>购买磅数</text><text>{{ draft.buyPound }} 磅</text></view>
				<view class="info-row"><text>实际制作</text><text>{{ draft.actualMakePound }} 磅</text></view>
				<view class="info-row"><text>口味</text><text>{{ draft.flavor }}</text></view>
				<view class="info-row"><text>主题</text><text>{{ draft.theme }}</text></view>
				<view class="info-row"><text>祝福文字</text><text>{{ draft.blessingText || '未填写' }}</text></view>
			</view>
		</view>

		<view class="summary-card">
			<text class="section-title">预约信息</text>
			<view class="info-list">
				<view class="info-row"><text>预约时间</text><text>{{ draft.appointmentTime }}</text></view>
				<view class="info-row"><text>取货方式</text><text>{{ pickupTypeText }}</text></view>
				<view v-if="draft.pickupType === 'DELIVERY'" class="info-row"><text>配送距离</text><text>{{ deliveryDistanceText }}</text></view>
				<view v-if="draft.pickupType === 'DELIVERY'" class="info-row top-align"><text>配送地址</text><text class="multiline">{{ draft.address }}</text></view>
			</view>
		</view>

		<view class="summary-card">
			<text class="section-title">联系信息</text>
			<text class="contact-tip">请填写您的姓名和电话，方便商家联系确认订单。</text>
			<view class="contact-input-group">
				<input
					class="contact-input"
					v-model="contactName"
					placeholder="您的姓名"
					maxlength="32"
				/>
				<input
					class="contact-input"
					v-model="contactPhone"
					type="number"
					placeholder="手机号码"
					maxlength="11"
				/>
			</view>
		</view>

		<view class="summary-card">
			<text class="section-title">费用信息</text>
			<view class="info-list">
				<view class="info-row" v-if="effectivePricePerPound > 0"><text>每磅单价</text><text>¥{{ effectivePricePerPound.toFixed(2) }}</text></view>
				<view class="info-row"><text>购买磅数</text><text>{{ draft.buyPound }} 磅</text></view>
				<template v-if="isPricingAvailable">
					<view class="info-row"><text>商品金额</text><text>¥{{ estimatedProductAmount.toFixed(2) }}</text></view>
				</template>
				<template v-else>
					<view class="info-row"><text>商品金额</text><text class="price-pending">待商家确认报价</text></view>
				</template>
				<view class="info-row"><text>配送费</text><text>¥{{ Number(draft.deliveryFee || 0).toFixed(2) }}</text></view>
				<template v-if="isPricingAvailable">
					<view class="info-row total-row"><text>预估总价</text><text>¥{{ estimatedTotal.toFixed(2) }}</text></view>
				</template>
				<template v-else>
					<view class="info-row total-row"><text>预估总价（不含商品）</text><text>¥{{ Number(draft.deliveryFee || 0).toFixed(2) }}</text></view>
				</template>
			</view>
			<view v-if="!isPricingAvailable" class="pricing-notice">
				<text>请完善商品信息或联系商家确认报价。</text>
			</view>
		</view>

		<view class="submit-wrap">
			<view class="submit-button" @click="confirmSubmit">确认提交</view>
		</view>

		<view v-if="showQrcode" class="qrcode-overlay" @click="showQrcode = false">
			<view class="qrcode-card" @click.stop>
				<text class="qrcode-title">订单已提交</text>
				<text class="qrcode-desc">请扫描下方二维码联系商家付款</text>
				<image v-if="qrcodeUrl" class="qrcode-image" :src="qrcodeUrl" mode="widthFix"></image>
				<text v-else class="qrcode-empty">商家尚未配置收款二维码</text>
				<view class="qrcode-actions">
					<view class="qrcode-btn primary" @click="goOrders">查看订单</view>
					<view class="qrcode-btn ghost" @click="showQrcode = false">关闭</view>
				</view>
			</view>
		</view>
	</scroll-view>
	<view v-else class="empty-page">
		<text class="empty-title">暂无待确认订单</text>
		<text class="empty-desc">请先返回商品详情或定制下单页填写需求。</text>
	</view>
</template>

<script>
	import { createOrder } from '@/api/order'
	import { getHomeData } from '@/api/home'
	import { getProductDetail } from '@/api/product'
	import { getUserProfile } from '@/api/user'
	import { PRODUCT_IMAGE_FALLBACK } from '@/constants/app'
	import { PICKUP_TYPE_TEXT } from '@/constants/order'
	import { clearOrderDraft, getOrderDraft } from '@/utils/order-draft'
	import { useUserStore } from '@/stores/user'
	import { formatDistance, getImageOrFallback } from '@/utils/format'
	import { normalizeProductDetail } from '@/utils/product-adapter'
	import { normalizeUserProfile } from '@/utils/user-adapter'

	const userStore = useUserStore()

	export default {
		data() {
			return {
				draft: null,
				submitting: false,
				productImageLoadError: false,
				contactName: '',
				contactPhone: '',
				pricePerPound: 0,
				qrcodeUrl: '',
				showQrcode: false,
				orderResult: null
			}
		},
		computed: {
			effectivePricePerPound() {
				return (this.draft.pricePerPound > 0 ? Number(this.draft.pricePerPound) : this.pricePerPound)
			},
			isPricingAvailable() {
				if (!this.draft) return false
				return this.effectivePricePerPound > 0
			},
			pickupTypeText() {
				return PICKUP_TYPE_TEXT[this.draft?.pickupType] || '到店自提'
			},
			deliveryDistanceText() {
				if (!this.draft || this.draft.pickupType !== 'DELIVERY') {
					return '--'
				}

				return formatDistance(this.getDeliveryDistanceKm())
			},
			estimatedProductAmount() {
		const buyPound = this.draft ? Number(this.draft.buyPound) : 0
		return this.effectivePricePerPound * buyPound
	},
			estimatedTotal() {
				const deliveryFee = this.draft ? Number(this.draft.deliveryFee || 0) : 0
				return this.estimatedProductAmount + deliveryFee
			}
		},
		async onShow() {
			this.draft = getOrderDraft()
			this.fetchStoreConfig()
			this.fetchProductPrice()
			if (userStore.isLoggedIn()) {
			try {
				const profile = await this.refreshProfile()
				if (!this.contactName) {
					this.contactName = profile.nickname || ''
				}
				if (!this.contactPhone) {
					this.contactPhone = profile.phone || ''
				}
			} catch {
			}
		}
		},
		methods: {
			async fetchStoreConfig() {
				try {
					const data = await getHomeData()
					if (data && data.store) {
						this.pricePerPound = Number(data.store.pricePerPound) || 0
						this.qrcodeUrl = data.store.qrCodeUrl || ''
					}
				} catch {
					// 获取门店配置失败，保持默认值
				}
			},
			async fetchProductPrice() {
				if (!this.draft || this.draft.source !== 'PRODUCT' || !this.draft.productId) {
					return
				}
				try {
					const product = normalizeProductDetail(await getProductDetail(this.draft.productId))
					if (product.pricePerPound > 0) {
						this.draft.pricePerPound = product.pricePerPound
					}
					if (product.defaultPound > 0) {
						this.draft.defaultPound = product.defaultPound
					}
					if (product.basePrice > 0) {
						this.draft.basePrice = product.basePrice
					}
				} catch {
					// 获取失败时沿用草稿中的值
				}
			},
			getProductImageSrc() {
				if (this.productImageLoadError) {
					return PRODUCT_IMAGE_FALLBACK
				}
				return this.draft ? getImageOrFallback(this.draft.productImageUrl) : PRODUCT_IMAGE_FALLBACK
			},
			onProductImageError() {
				this.productImageLoadError = true
			},
			getDeliveryDistanceKm() {
				if (!this.draft) {
					return null
				}

				const distanceKm = this.draft.distanceKm ?? this.draft.deliveryDistanceKm
				if (distanceKm === '' || distanceKm === null || typeof distanceKm === 'undefined') {
					return null
				}

				const numericDistance = Number(distanceKm)
				return Number.isNaN(numericDistance) ? null : numericDistance
			},
			async refreshProfile() {
				const profile = normalizeUserProfile(await getUserProfile())
				userStore.setProfile(profile)
				userStore.setHasPhone(Boolean(profile.phone))
				userStore.syncProfileToStore(profile)
				return profile
			},
			buildPayload() {
				const distanceKm = this.draft.pickupType === 'DELIVERY' ? this.getDeliveryDistanceKm() : null

				return {
					source: this.draft.source || 'CUSTOM',
					productId: this.draft.source === 'PRODUCT' ? this.draft.productId : undefined,
					caseId: this.draft.source === 'CASE' ? this.draft.caseId : undefined,
					categoryId: Number(this.draft.categoryId),
					buyPound: Number(this.draft.buyPound),
					flavor: this.draft.flavor,
					theme: this.draft.theme,
					blessingText: this.draft.blessingText || undefined,
					plateCount: Number(this.draft.plateCount),
					candleCount: Number(this.draft.candleCount),
					referenceImages: this.draft.referenceImages || [],
					pickupType: this.draft.pickupType,
					appointmentTime: this.draft.appointmentTime,
					address: this.draft.pickupType === 'DELIVERY' ? this.draft.address : undefined,
					addressLng: this.draft.pickupType === 'DELIVERY' ? Number(this.draft.addressLng || 0) : undefined,
					addressLat: this.draft.pickupType === 'DELIVERY' ? Number(this.draft.addressLat || 0) : undefined,
					distanceKm: distanceKm,
					contactName: this.contactName.trim(),
					contactPhone: this.contactPhone.trim(),
					receiverName: this.contactName.trim() || (userStore.state.nickname || ''),
					receiverPhone: this.contactPhone.trim() || undefined,
					userRemark: this.draft.userRemark || ''
				}
			},
			goLogin() {
				uni.showModal({
					title: '请先登录',
					content: '登录后即可提交订单，当前填写的订单信息会继续保留。',
					confirmText: '去登录',
					cancelText: '稍后再说',
					success: (res) => {
						if (res.confirm) {
							uni.switchTab({ url: '/pages/mine/index' })
						}
					}
				})
			},
			goOrders() {
			this.showQrcode = false
			uni.reLaunch({ url: this.orderResult && this.orderResult.orderId ? `/pages/order/detail?orderId=${this.orderResult.orderId}` : '/pages/order/list' })
		},
			// 商家要求：不强制手机号授权
			// async ensureBoundPhone() {
			// 	if (!userStore.isLoggedIn()) {
			// 		this.phoneError = '请先完成微信登录'
			// 		throw new Error(this.phoneError)
			// 	}
			//
			// 	const profile = await this.refreshProfile()
			// 	if (!profile.phone) {
			// 		this.phoneError = '请先完成手机号授权后再提交订单'
			// 		this.goAuthorizePhone()
			// 		throw new Error(this.phoneError)
			// 	}
			//
			// 	this.phoneError = ''
			// 	return profile.phone
			// },
			async confirmSubmit() {
				if (this.submitting) {
					return
				}

				if (!userStore.isLoggedIn()) {
					this.goLogin()
					return
				}

				try {
					this.submitting = true

					if (!this.contactName.trim()) {
						throw new Error('请填写联系人姓名')
					}
					if (!this.contactPhone.trim()) {
						throw new Error('请填写联系电话')
					}
					if (!/^1\d{10}$/.test(this.contactPhone.trim())) {
						throw new Error('请填写正确的11位手机号码')
					}

					if (this.draft.pickupType === 'DELIVERY' && this.getDeliveryDistanceKm() === null) {
						throw new Error('配送订单缺少配送距离，请返回上一步重新计算配送费')
					}

					const result = await createOrder(this.buildPayload())
					clearOrderDraft()

					this.showQrcode = true
					this.orderResult = result
				} catch (error) {
				uni.showToast({
					title: error.message || '提交失败，请稍后重试',
					icon: 'none'
				})
			} finally {
					this.submitting = false
				}
			}
		}
	}
</script>

<style lang="scss">
.confirm-page {
	min-height: 100vh;
	padding: 24rpx 24rpx 140rpx;
	background: linear-gradient(180deg, #fff7ef 0%, #f2ebe2 100%);
}

.summary-card {
	margin-bottom: 20rpx;
	padding: 26rpx;
	border-radius: 24rpx;
	background: #fffdf9;
	box-shadow: 0 14rpx 30rpx rgba(97, 59, 30, 0.06);
}

.hero-card {
	background: linear-gradient(135deg, #fff4e5 0%, #ffe0c9 100%);
}

.hero-title,
.section-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: #503527;
}

.hero-desc {
	display: block;
	margin-top: 12rpx;
	font-size: 24rpx;
	line-height: 1.7;
	color: #7b604f;
}

.product-card {
	display: flex;
	gap: 18rpx;
}

.product-image {
	width: 180rpx;
	height: 180rpx;
	border-radius: 20rpx;
	background: #f3e2d4;
}

.product-main {
	flex: 1;
}

.product-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: #4d3124;
}

.product-meta {
	display: block;
	margin-top: 12rpx;
	font-size: 24rpx;
	color: #846959;
}

.info-list {
	margin-top: 12rpx;
}

.info-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 18rpx 0;
	border-bottom: 1rpx solid #f0e4d8;
	font-size: 26rpx;
	color: #5d4332;
}

.info-row:last-child {
	border-bottom: 0;
}

.top-align {
	align-items: flex-start;
}

.multiline {
	max-width: 420rpx;
	text-align: right;
	line-height: 1.6;
}

.total-row {
	font-weight: 700;
	color: #c45d39;
}

.price-pending {
	color: #d95c33;
	font-weight: 600;
}

.pricing-notice {
	margin-top: 16rpx;
	padding: 14rpx 20rpx;
	border-radius: 12rpx;
	background: #fff4e5;
	font-size: 24rpx;
	line-height: 1.6;
	color: #8a573b;
}

.contact-tip {
	display: block;
	margin-top: 14rpx;
	font-size: 24rpx;
	line-height: 1.7;
	color: #846959;
}

.contact-input-group {
	margin-top: 18rpx;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.contact-input {
	height: 84rpx;
	padding: 0 24rpx;
	border-radius: 18rpx;
	background: #fff7ef;
	border: 2rpx solid #e8d5c2;
	font-size: 28rpx;
	color: #4d3124;
}

.contact-input::placeholder {
	color: #b8987d;
}

.contact-tip.danger {
	color: #c24f3d;
}

.submit-wrap {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 22rpx 24rpx 34rpx;
	background: rgba(255, 252, 247, 0.98);
	box-shadow: 0 -10rpx 24rpx rgba(70, 45, 30, 0.08);
}

.submit-button {
	height: 92rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #c85e3c 0%, #eb8750 100%);
	text-align: center;
	line-height: 92rpx;
	font-size: 30rpx;
	font-weight: 700;
	color: #fff9f5;
}

.empty-page {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding: 32rpx;
	background: linear-gradient(180deg, #fff7ef 0%, #f2ebe2 100%);
}

.empty-title {
	font-size: 38rpx;
	font-weight: 700;
	color: #4d3124;
}

.empty-desc {
	margin-top: 16rpx;
	font-size: 26rpx;
	line-height: 1.7;
	color: #846959;
}

.qrcode-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.45);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
}

.qrcode-card {
	width: 560rpx;
	padding: 48rpx 40rpx;
	border-radius: 32rpx;
	background: #fffdf9;
	text-align: center;
	box-shadow: 0 24rpx 60rpx rgba(26, 21, 18, 0.18);
}

.qrcode-title {
	display: block;
	font-size: 34rpx;
	font-weight: 700;
	color: #4d3124;
}

.qrcode-desc {
	display: block;
	margin-top: 16rpx;
	font-size: 26rpx;
	color: #846959;
}

.qrcode-image {
	width: 300rpx;
	margin: 32rpx auto;
	display: block;
	border-radius: 16rpx;
}

.qrcode-empty {
	display: block;
	margin: 32rpx auto;
	padding: 40rpx;
	font-size: 24rpx;
	color: #b8987d;
	background: #f6f1ed;
	border-radius: 16rpx;
}

.qrcode-actions {
	display: flex;
	gap: 20rpx;
	margin-top: 24rpx;
}

.qrcode-btn {
	flex: 1;
	height: 84rpx;
	border-radius: 999rpx;
	text-align: center;
	line-height: 84rpx;
	font-size: 28rpx;
	font-weight: 600;
}

.qrcode-btn.primary {
	background: #d95c33;
	color: #fff;
}

.qrcode-btn.ghost {
	background: #fff1e3;
	color: #8a573b;
}
</style>
