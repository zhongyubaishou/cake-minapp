<template>
	<scroll-view class="page" scroll-y @scrolltolower="loadMoreCases">
		<view class="hero">
			<text class="hero-title">{{ homeData.store.name }}</text>
			<text class="hero-subtitle">{{ homeData.store.address }}</text>
			<view class="meta-row">
				<text class="meta-chip">营业时间 {{ homeData.store.businessHours }}</text>
				<text class="meta-chip">{{ homeData.store.deliveryRange }}</text>
				<text v-if="homeData.store.pricePerPound > 0" class="meta-chip">每磅 ¥{{ homeData.store.pricePerPound.toFixed(2) }}</text>
			</view>
		</view>

		<SkeletonCard v-if="loading && !loadError" type="card" count="2" />

		<ErrorCard v-else-if="loadError" :message="loadError" @retry="fetchHomeData" />

		<template v-else>
			<view v-if="bannerCases.length" class="panel banner-panel">
				<swiper class="case-swiper" indicator-dots circular autoplay :interval="4000">
					<swiper-item v-for="item in bannerCases" :key="item.id" @click="goCaseDetail(item.id)">
						<view class="swiper-image-wrap">
							<image class="swiper-image" :src="item.imageUrl" mode="aspectFill"></image>
							<view class="swiper-label">{{ item.name }}</view>
						</view>
					</swiper-item>
				</swiper>
			</view>

			<view class="panel">
				<text class="panel-title">快速入口</text>
				<view class="action-row">
					<view class="action-card primary" @click="go('/pages/order/customize')">
						<text class="action-title">立即定制蛋糕</text>
						<text class="action-desc">从口味、磅数到祝福语快速填写</text>
					</view>
					<view class="action-card secondary" @click="switchTab('/pages/case/list')">
						<text class="action-title">查看蛋糕案例</text>
						<text class="action-desc">先看案例风格，再决定如何定制</text>
					</view>
				</view>
			</view>

			<view v-if="recentItems.length" class="panel">
				<view class="section-head">
					<text class="panel-title">最近浏览</text>
					<text class="section-link" @click="clearRecent">清空</text>
				</view>
				<scroll-view class="recent-scroll" scroll-x enable-flex>
					<view v-for="item in recentItems" :key="item.id" class="recent-card" @click="goRecentItem(item)">
						<image class="recent-thumb" :src="item.imageUrl" mode="aspectFill"></image>
						<text class="recent-name">{{ item.name }}</text>
					</view>
				</scroll-view>
			</view>

			<view class="panel">
				<view class="section-head">
					<text class="panel-title">商品分类</text>
					<text class="section-link" @click="go('/pages/product/list')">查看全部</text>
				</view>
				<view class="category-row">
					<view
						v-for="category in homeData.categories"
						:key="category.id"
						class="category-chip"
						@click="goProductList(category.id)"
					>
						{{ category.name }}
					</view>
				</view>
			</view>

			<view class="panel">
				<view class="section-head">
					<text class="panel-title">推荐商品</text>
					<text class="section-note">共 {{ homeData.caseCount }} 个案例可参考</text>
				</view>
				<view class="product-list">
					<view
						v-for="item in homeData.hotProducts"
						:key="item.id"
						class="product-card"
						@click="goProductDetail(item.id)"
					>
						<image class="product-image" :src="getProductImageSrc(item)" mode="aspectFill" @error="onProductImageError(item.id)"></image>
						<view class="product-body">
							<text class="product-title">{{ item.name }}</text>
							<view class="tag-row">
								<text v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</text>
							</view>
							<view class="price-row">
								<text class="price-label">每磅</text>
								<text class="price-value">¥{{ item.pricePerPound > 0 ? item.pricePerPound.toFixed(2) : formatPrice(item.basePrice) }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</template>
	</scroll-view>
</template>

<script>
	import { getHomeData } from '@/api/home'
	import { getCases } from '@/api/case'
	import { PRODUCT_IMAGE_FALLBACK, STORE_INFO } from '@/constants/app'
	import { formatPrice, getImageOrFallback } from '@/utils/format'
	import { normalizeHomeData } from '@/utils/home-adapter'
	import { getRecentBrowsing } from '@/utils/browsing-history'
	import SkeletonCard from '@/components/SkeletonCard.vue'
	import ErrorCard from '@/components/ErrorCard.vue'

	export default {
		components: {
			SkeletonCard,
			ErrorCard
		},
		data() {
			return {
				homeData: {
					store: {
						name: STORE_INFO.name,
						address: STORE_INFO.address,
						businessHours: STORE_INFO.businessHours,
						deliveryRange: `${STORE_INFO.deliveryRangeKm}km内配送 / 支持到店自提`
					},
					categories: [],
					hotProducts: [],
					caseCount: 0
				},
				loadError: '',
				productImageErrors: {},
				loading: false,
				bannerCases: [],
				recentItems: [],
				casePage: 1,
				hasMoreCases: true
			}
		},
		onLoad() {
			this.fetchHomeData()
		},
		onShow() {
			this.loadRecentItems()
		},
		methods: {
			formatPrice,
			getProductImageSrc(item) {
				return this.productImageErrors[item.id] ? PRODUCT_IMAGE_FALLBACK : getImageOrFallback(item.imageUrl)
			},
			onProductImageError(id) {
				this.productImageErrors = { ...this.productImageErrors, [id]: true }
			},
			async fetchHomeData() {
				try {
					this.loadError = ''
					this.loading = true
					const [homeResult] = await Promise.all([
						getHomeData(),
						this.fetchBannerCases()
					])
					this.homeData = normalizeHomeData(homeResult)
				} catch (error) {
					this.loadError = error.message || '首页暂时加载失败，请稍后重试'
				} finally {
					this.loading = false
				}
			},
			async fetchBannerCases() {
				try {
					const res = await getCases({ page: 1, pageSize: 5 })
					this.bannerCases = res.list || res.rows || res.data || []
				} catch (e) {
					this.bannerCases = []
				}
			},
			loadRecentItems() {
				this.recentItems = getRecentBrowsing(3)
			},
			loadMoreCases() {
				if (!this.hasMoreCases) return
				this.casePage++
			},
			goCaseDetail(id) {
				uni.navigateTo({ url: `/pages/case/detail?caseId=${id}` })
			},
			goRecentItem(item) {
				if (item.type === 'case') {
					this.goCaseDetail(item.id)
				} else {
					this.go(`/pages/product/detail?productId=${item.id}`)
				}
			},
			clearRecent() {
				uni.removeStorageSync('browsing_history')
				this.recentItems = []
			},
			go(url) {
				uni.navigateTo({ url })
			},
			switchTab(url) {
				uni.switchTab({ url })
			},
			goProductList(categoryId) {
				this.go(`/pages/product/list?categoryId=${categoryId}`)
			},
			goProductDetail(productId) {
				this.go(`/pages/product/detail?productId=${productId}`)
			}
		}
	}
</script>

<style lang="scss">
.page {
	min-height: 100vh;
	padding: 32rpx 32rpx 64rpx;
	background: #f6f1ed;
}

/* ── Hero — 非对称留白 + Memphis 斜色块 ── */
.hero {
	position: relative;
	overflow: hidden;
	padding: 40rpx 32rpx;
	border-radius: 24rpx;
	background: #fff;
	box-shadow: 0 16rpx 40rpx rgba(26, 21, 18, 0.08);
}

/* Memphis 风格 — 右上角倾斜蓝色几何色块 */
.hero::before {
	content: '';
	position: absolute;
	top: -24rpx;
	right: -32rpx;
	width: 180rpx;
	height: 160rpx;
	background: rgba(45, 95, 191, 0.07);
	transform: rotate(15deg);
	border-radius: 8rpx;
}

.hero-title {
	display: block;
	font-size: 52rpx;
	font-weight: 800;
	line-height: 1.2;
	letter-spacing: 1rpx;
	color: #2d2521;
	position: relative;
	z-index: 1;
}

.hero-subtitle {
	display: block;
	margin-top: 16rpx;
	font-size: 25rpx;
	line-height: 1.65;
	color: #7b6d66;
	position: relative;
	z-index: 1;
	max-width: 80%;
}

.meta-row {
	display: flex;
	flex-wrap: wrap;
	margin-top: 20rpx;
	gap: 12rpx;
	position: relative;
	z-index: 1;
}

/* Mondrian 式 — meta-chip 左侧色条 */
.meta-chip {
	position: relative;
	padding: 12rpx 20rpx;
	padding-left: 28rpx;
	border-radius: 999rpx;
	background: #fff1e8;
	font-size: 22rpx;
	font-weight: 700;
	color: #9a4a2d;
}

.meta-chip::before {
	content: '';
	position: absolute;
	left: 10rpx;
	top: 50%;
	transform: translateY(-50%);
	width: 6rpx;
	height: 16rpx;
	border-radius: 3rpx;
}

.meta-chip:nth-child(odd)::before {
	background: #2d5fbf;
}

.meta-chip:nth-child(even)::before {
	background: #e8b830;
}

/* ── 案例轮播 Banner ── */
.banner-panel {
	padding: 16rpx;
}

.case-swiper {
	height: 320rpx;
	border-radius: 20rpx;
	overflow: hidden;
}

.swiper-image-wrap {
	position: relative;
	width: 100%;
	height: 100%;
}

.swiper-image {
	width: 100%;
	height: 100%;
	background: #f0e7e0;
}

.swiper-label {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 16rpx 24rpx;
	background: linear-gradient(transparent, rgba(26, 21, 18, 0.6));
	color: #fff;
	font-size: 26rpx;
	font-weight: 700;
}

/* ── Panel 卡片差异化 ── */
.panel {
	margin-top: 32rpx;
	padding: 32rpx;
	border-radius: 24rpx;
	background: #fff;
	box-shadow: 0 16rpx 40rpx rgba(26, 21, 18, 0.08);
	position: relative;
	overflow: hidden;
}

/* 分类面板 — 顶部 Mondrian 蓝色横线 */
.panel:nth-child(3)::before {
	content: '';
	position: absolute;
	top: 0;
	left: 32rpx;
	right: 32rpx;
	height: 4rpx;
	background: #2d5fbf;
	border-radius: 0 0 2rpx 2rpx;
}

.panel-title {
	display: block;
	font-size: 32rpx;
	font-weight: 700;
	letter-spacing: 0.5rpx;
	color: #2d2521;
}

.section-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

/* Swiss 风格 — 下划线链接 */
.section-link,
.section-note {
	font-size: 24rpx;
	color: #2d5fbf;
	padding-bottom: 4rpx;
	border-bottom: 2rpx dashed rgba(45, 95, 191, 0.35);
}

.section-note {
	color: #9b6c4e;
	border-bottom: 0;
}

/* ── 最近浏览 ── */
.recent-scroll {
	white-space: nowrap;
	margin-top: 20rpx;
}

.recent-card {
	display: inline-block;
	width: 200rpx;
	margin-right: 16rpx;
}

.recent-thumb {
	width: 200rpx;
	height: 200rpx;
	border-radius: 18rpx;
	background: #f0e7e0;
	border-left: 4rpx solid #2d5fbf;
}

.recent-name {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	font-weight: 600;
	color: #2d2521;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* ── 快速入口 — Memphis 非对称 CTA ── */
.action-row {
	margin-top: 24rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.action-card {
	position: relative;
	overflow: hidden;
	padding: 28rpx;
	border-radius: 20rpx;
}

/* 主 CTA — Memphis 黄色几何三角色块 */
.action-card.primary {
	background: #d95c33;
}

.action-card.primary::after {
	content: '';
	position: absolute;
	right: -16rpx;
	bottom: -16rpx;
	width: 120rpx;
	height: 120rpx;
	background: rgba(232, 184, 48, 0.22);
	transform: rotate(45deg);
	border-radius: 8rpx;
}

/* 副 CTA — Mondrian 蓝色竖线 */
.action-card.secondary {
	background: #fff;
	border: 2rpx solid #f0d5c8;
	border-left: 6rpx solid #2d5fbf;
}

.action-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: #2d2521;
	position: relative;
	z-index: 1;
}

.primary .action-title,
.primary .action-desc {
	color: #fff;
	position: relative;
	z-index: 1;
}

.action-desc {
	display: block;
	margin-top: 12rpx;
	font-size: 24rpx;
	line-height: 1.6;
	color: #775c4d;
	max-width: 75%;
	position: relative;
	z-index: 1;
}

/* ── 分类 chips — Memphis 色彩轮换 ── */
.category-row {
	display: flex;
	flex-wrap: wrap;
	margin-top: 24rpx;
	gap: 16rpx;
}

.category-chip {
	padding: 14rpx 24rpx;
	border-radius: 999rpx;
	font-size: 26rpx;
	font-weight: 700;
	color: #4d443f;
}

.category-chip:nth-child(4n+1) {
	background: #fff1e8;
}

.category-chip:nth-child(4n+2) {
	background: rgba(45, 95, 191, 0.08);
}

.category-chip:nth-child(4n+3) {
	background: rgba(232, 184, 48, 0.12);
}

.category-chip:nth-child(4n) {
	background: #f6f1ed;
}

/* ── 商品列表 ── */
.product-list {
	margin-top: 24rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.product-card {
	overflow: hidden;
	border-radius: 22rpx;
	background: #fff;
	box-shadow: 0 8rpx 24rpx rgba(26, 21, 18, 0.06);
	/* 移除全包围边框 — Mondrian 仅底部边界 */
	position: relative;
}

/* 图片下方 Mondrian 分割线 */
.product-card::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 3rpx;
	background: linear-gradient(90deg, #2d5fbf 0%, #e8b830 50%, #2d5fbf 100%);
}

.product-image {
	width: 100%;
	height: 300rpx;
	background: #f0e7e0;
}

.product-body {
	padding: 24rpx;
	position: relative;
}

.product-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	letter-spacing: 0.5rpx;
	color: #2d2521;
}

.tag-row {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 14rpx;
}

/* Memphis 色彩轮换标签 */
.tag {
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
}

.tag:nth-child(3n+1) {
	background: rgba(217, 92, 51, 0.08);
	color: #9a4a2d;
}

.tag:nth-child(3n+2) {
	background: rgba(45, 95, 191, 0.08);
	color: #2d5fbf;
}

.tag:nth-child(3n) {
	background: rgba(232, 184, 48, 0.12);
	color: #8a6a20;
}

.price-row {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	margin-top: 20rpx;
}

.price-label {
	font-size: 24rpx;
	color: #8a6a56;
}

.price-value {
	font-size: 34rpx;
	font-weight: 700;
	color: #d95c33;
}
</style>
