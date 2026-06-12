<template>
	<view class="detail-page" v-if="product">
		<image class="banner" :src="bannerImageSrc" mode="aspectFill" @error="onBannerError"></image>

		<view class="content-card">
			<text class="title">{{ product.name }}</text>
			<text class="description">{{ product.description }}</text>
			<view class="price-row">
				<text class="price-label">每磅单价</text>
				<text class="price-value">¥{{ product.pricePerPound > 0 ? product.pricePerPound.toFixed(2) : formatPrice(product.basePrice) }}</text>
			</view>
		</view>

		<view class="content-card">
			<text class="section-title">磅数选择</text>
			<view class="option-row">
				<view
					v-for="item in product.pounds"
					:key="item"
					class="option-chip"
					:class="{ active: selectedPound === item }"
					@click="selectedPound = item"
				>
					{{ item }} 磅
				</view>
			</view>
		</view>

		<view class="content-card">
			<text class="section-title">口味选择</text>
			<view class="option-row">
				<view
					v-for="item in product.flavors"
					:key="item"
					class="option-chip"
					:class="{ active: selectedFlavor === item }"
					@click="selectedFlavor = item"
				>
					{{ item }}
				</view>
			</view>
		</view>

		<view class="content-card">
			<text class="section-title">主题风格</text>
			<view class="option-row">
				<view
					v-for="item in product.themes"
					:key="item"
					class="option-chip"
					:class="{ active: selectedTheme === item }"
					@click="selectedTheme = item"
				>
					{{ item }}
				</view>
			</view>
		</view>

		<view class="bottom-bar">
			<view>
				<text class="bottom-price">¥{{ product.pricePerPound > 0 ? product.pricePerPound.toFixed(2) : formatPrice(product.basePrice) }}<text class="bottom-unit">/磅</text></text>
				<text class="bottom-hint">默认 {{ product.defaultPound }} 磅，可继续填写定制信息</text>
			</view>
			<view class="bottom-button" @click="goCustomize">立即定制</view>
		</view>
	</view>
	<view v-else class="empty-page">
		<text class="empty-title">{{ loadError ? '商品加载失败' : '商品不存在' }}</text>
		<text class="empty-desc">{{ loadError || '请返回商品列表重新进入。' }}</text>
		<view v-if="loadError" class="retry-btn" @click="fetchDetail">重新加载</view>
	</view>
</template>

<script>
	import { getProductDetail } from '@/api/product'
	import { PRODUCT_IMAGE_FALLBACK } from '@/constants/app'
	import { formatPrice, getImageOrFallback } from '@/utils/format'
	import { normalizeProductDetail } from '@/utils/product-adapter'

	export default {
		data() {
			return {
				productId: '',
				product: null,
				loadError: '',
				selectedPound: 2,
				selectedFlavor: '原味',
				selectedTheme: '成人',
				bannerLoadError: false
			}
		},
		computed: {
			bannerImageSrc() {
				if (this.bannerLoadError) {
					return PRODUCT_IMAGE_FALLBACK
				}
				return this.product ? getImageOrFallback(this.product.imageUrl) : PRODUCT_IMAGE_FALLBACK
			}
		},
		onLoad(options) {
			this.productId = options.productId || ''
			this.fetchDetail()
		},
		methods: {
			formatPrice,
			onBannerError() {
				this.bannerLoadError = true
			},
			async fetchDetail() {
			if (!this.productId) {
				this.product = null
				this.loadError = '缺少商品编号'
				return
			}

			try {
				this.loadError = ''
				uni.showLoading({ title: '加载中...' })
				this.product = normalizeProductDetail(await getProductDetail(this.productId))
			} catch (error) {
				this.product = null
				this.loadError = error.message || '商品详情暂时加载失败，请稍后重试'
				return
			} finally {
				uni.hideLoading()
			}

			this.selectedPound = this.product.pounds.includes(2) ? 2 : (this.product.defaultPound || this.product.pounds[0])
			this.selectedFlavor = this.product.flavors.includes('原味') ? '原味' : (this.product.flavors[0] || '原味')
			this.selectedTheme = this.product.themes.includes('成人') ? '成人' : (this.product.themes[0] || '成人')
		},
			goCustomize() {
				const query = [
					`productId=${this.product.id}`,
					`buyPound=${this.selectedPound}`,
					`flavor=${encodeURIComponent(this.selectedFlavor)}`,
					`theme=${encodeURIComponent(this.selectedTheme)}`
				].join('&')

				uni.navigateTo({
					url: `/pages/order/customize?${query}`
				})
			}
		}
	}
</script>

<style lang="scss">
.detail-page {
	min-height: 100vh;
	padding-bottom: 180rpx;
	background: #f6f1ed;
}

.banner {
	width: 100%;
	height: 420rpx;
	background: #f4e4d5;
	position: relative;
}

/* Mondrian 风格 — 底部三段色装饰条 */
.banner::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 8rpx;
	background: linear-gradient(90deg, #2d5fbf 0%, #2d5fbf 33%, #e8b830 33%, #e8b830 66%, #2d5fbf 66%, #2d5fbf 100%);
}

.content-card {
	margin: 24rpx;
	padding: 28rpx;
	border-radius: 24rpx;
	background: #fff;
	box-shadow: 0 16rpx 40rpx rgba(26, 21, 18, 0.08);
}

.title {
	display: block;
	font-size: 38rpx;
	font-weight: 800;
	letter-spacing: 0.5rpx;
	color: #2d2521;
}

.description {
	display: block;
	margin-top: 16rpx;
	font-size: 26rpx;
	line-height: 1.8;
	color: #7e6655;
}

.price-row {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	margin-top: 24rpx;
}

.price-label {
	font-size: 24rpx;
	color: #8d705d;
}

.price-value {
	font-size: 40rpx;
	font-weight: 700;
	color: #d95c33;
}

.bottom-unit {
	font-size: 24rpx;
	font-weight: 500;
	color: #d95c33;
}

/* Mondrian 蓝色竖线 */
.section-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	letter-spacing: 0.5rpx;
	color: #2d2521;
	padding-left: 16rpx;
	border-left: 6rpx solid #2d5fbf;
}

.option-row {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	margin-top: 20rpx;
}

/* 未选中 — Memphis 纹理 */
.option-chip {
	padding: 16rpx 26rpx;
	border-radius: 999rpx;
	background-image:
		repeating-linear-gradient(45deg, transparent, transparent 6rpx, rgba(217, 92, 51, 0.03) 6rpx, rgba(217, 92, 51, 0.03) 7rpx);
	background-color: rgba(217, 92, 51, 0.06);
	font-size: 26rpx;
	color: #7d5842;
	position: relative;
}

/* 选中 — 暖橘 + Memphis 小几何 */
.option-chip.active {
	background: #d95c33;
	color: #fff;
	background-image: none;
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

.bottom-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 28rpx 34rpx;
	background: rgba(255, 255, 255, 0.98);
	box-shadow: 0 -12rpx 30rpx rgba(26, 21, 18, 0.08);
}

.bottom-price {
	display: block;
	font-size: 38rpx;
	font-weight: 700;
	color: #d95c33;
}

.bottom-hint {
	display: block;
	margin-top: 6rpx;
	font-size: 22rpx;
	color: #8a7260;
}

.bottom-button {
	padding: 20rpx 34rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #d95c33 0%, #e87840 100%);
	font-size: 28rpx;
	font-weight: 700;
	letter-spacing: 2rpx;
	color: #fff;
}

.empty-page {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding: 32rpx;
	background: #f6f1ed;
}

.empty-title {
	font-size: 38rpx;
	font-weight: 700;
	color: #2d2521;
}

.empty-desc {
	margin-top: 16rpx;
	font-size: 26rpx;
	line-height: 1.7;
	color: #846959;
}

.retry-btn {
	width: 220rpx;
	height: 76rpx;
	margin-top: 28rpx;
	border-radius: 999rpx;
	background: #fff1e4;
	text-align: center;
	line-height: 76rpx;
	font-size: 24rpx;
	font-weight: 700;
	color: #8a553a;
}
</style>
