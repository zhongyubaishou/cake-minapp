<template>
	<view class="product-page">
		<scroll-view class="category-scroll" scroll-x enable-flex>
			<view class="category-row">
				<view
					class="category-tab"
					:class="{ active: !activeCategoryId }"
					@click="changeCategory('')"
				>
					全部
				</view>
				<view
					v-for="category in categories"
					:key="category.id"
					class="category-tab"
					:class="{ active: Number(activeCategoryId) === Number(category.id) }"
					@click="changeCategory(category.id)"
				>
					{{ category.name }}
				</view>
			</view>
		</scroll-view>

		<scroll-view
			class="list-scroll"
			scroll-y
			@scrolltolower="loadMore"
		>
			<SkeletonCard v-if="loading && !productList.length" type="card" :count="3" />
			<ErrorCard v-else-if="loadError" :message="loadError" @retry="fetchPageData" />
			<EmptyState
				v-else-if="!productList.length"
				icon="🎂"
				title="暂无商品"
				description="看看其他分类吧"
				actionText="返回首页"
				@action="goHome"
			/>
			<view v-else class="list-wrap">
				<view v-for="item in productList" :key="item.id" class="product-card" @click="goDetail(item.id)">
					<image class="product-image" :src="getProductImageSrc(item)" mode="aspectFill" @error="onProductImageError(item.id)"></image>
					<view class="product-body">
						<text class="product-title">{{ item.name }}</text>
						<text class="product-desc">{{ item.description }}</text>
						<view class="tag-row">
							<text v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</text>
						</view>
						<view class="footer-row">
							<text class="price">¥{{ formatPrice(item.basePrice) }}</text>
							<text class="spec">默认 {{ item.defaultPound }} 磅</text>
						</view>
					</view>
				</view>

				<view v-if="loadingMore" class="loading-more">加载中...</view>
				<view v-else-if="!hasMore && productList.length" class="no-more">— 没有更多了 —</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { getCategories } from '@/api/home'
	import { getProducts } from '@/api/product'
	import { PRODUCT_IMAGE_FALLBACK } from '@/constants/app'
	import { formatPrice, getImageOrFallback } from '@/utils/format'
	import { normalizeCategories } from '@/utils/home-adapter'
	import { normalizeProductList } from '@/utils/product-adapter'
	import SkeletonCard from '@/components/SkeletonCard.vue'
	import ErrorCard from '@/components/ErrorCard.vue'
	import EmptyState from '@/components/EmptyState.vue'

	export default {
		components: {
			SkeletonCard,
			ErrorCard,
			EmptyState
		},
		data() {
			return {
				activeCategoryId: '',
				categories: [],
				productList: [],
				loadError: '',
				productImageErrors: {},
				page: 1,
				hasMore: true,
				loadingMore: false,
				loading: false
			}
		},
		onLoad(options) {
			this.activeCategoryId = options.categoryId || ''
			this.fetchPageData()
		},
		methods: {
			formatPrice,
			getProductImageSrc(item) {
				return this.productImageErrors[item.id] ? PRODUCT_IMAGE_FALLBACK : getImageOrFallback(item.imageUrl)
			},
			onProductImageError(id) {
				this.productImageErrors = { ...this.productImageErrors, [id]: true }
			},
			onPullDownRefresh() {
				this.page = 1
				this.hasMore = true
				this.fetchPageData().finally(() => {
					uni.stopPullDownRefresh()
				})
			},
			async fetchPageData() {
				this.loading = !this.productList.length
				this.loadError = ''
				const results = await Promise.allSettled([this.fetchCategories(), this.fetchProducts()])
				this.loading = false
				const errors = results
					.filter((item) => item.status === 'rejected')
					.map((item) => item.reason?.message || '加载失败')
				if (errors.length === 2) {
					this.loadError = errors.join('；')
				} else if (errors.length === 1) {
					this.loadError = errors[0]
				}
			},
			async fetchCategories() {
				try {
					this.categories = normalizeCategories(await getCategories())
				} catch (error) {
					this.categories = []
					throw error
				}
			},
			async fetchProducts() {
				try {
					this.loadError = ''
					const params = { page: this.page, pageSize: 10 }
					if (this.activeCategoryId) params.categoryId = this.activeCategoryId
					const data = await getProducts(params)
					const list = Array.isArray(data) ? data : data && Array.isArray(data.list) ? data.list : []
					const normalized = normalizeProductList(list)
					if (this.page === 1) {
						this.productList = normalized
					} else {
						this.productList = [...this.productList, ...normalized]
					}
					this.hasMore = normalized.length >= 10
				} catch (error) {
					if (this.page === 1) {
						this.productList = []
					}
					this.loadError = error.message || '商品列表暂时加载失败，请稍后重试'
					throw error
				}
			},
			async loadMore() {
				if (this.loadingMore || !this.hasMore) return
				this.loadingMore = true
				this.page += 1
				try {
					await this.fetchProducts()
				} catch (e) {
					this.page -= 1
				}
				this.loadingMore = false
			},
			changeCategory(categoryId) {
				this.activeCategoryId = categoryId
				this.page = 1
				this.hasMore = true
				this.loadingMore = false
				this.fetchProducts()
			},
			goDetail(productId) {
				uni.navigateTo({ url: `/pages/product/detail?productId=${productId}` })
			},
			goHome() {
				uni.switchTab({ url: '/pages/home/index' })
			}
		}
	}
</script>

<style lang="scss">
.product-page {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: #f6f1ed;
}

.category-scroll {
	flex-shrink: 0;
	white-space: nowrap;
	padding: 24rpx 24rpx 10rpx;
}

.category-row {
	display: inline-flex;
	gap: 16rpx;
}

.category-tab {
	padding: 14rpx 28rpx;
	border: 2rpx solid #eadfd8;
	border-radius: 999rpx;
	background: #fff;
	font-size: 26rpx;
	font-weight: 700;
	color: #4d443f;
}

.category-tab.active {
	border-color: #d95c33;
	background: #d95c33;
	color: #fff;
}

.list-scroll {
	flex: 1;
}

.list-wrap {
	padding: 16rpx 24rpx 40rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.product-card {
	overflow: hidden;
	border: 2rpx solid #f0e6df;
	border-radius: 24rpx;
	background: #fff;
	box-shadow: 0 10rpx 30rpx rgba(70, 45, 32, 0.06);
}

.product-image {
	width: 100%;
	height: 320rpx;
	background: #f0e7e0;
}

.product-body {
	padding: 22rpx;
}

.product-title {
	display: block;
	font-size: 31rpx;
	font-weight: 800;
	color: #2d2521;
}

.product-desc {
	display: block;
	margin-top: 12rpx;
	font-size: 24rpx;
	line-height: 1.65;
	color: #7b6d66;
}

.tag-row {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
	margin-top: 16rpx;
}

.tag {
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background: #fff1e8;
	font-size: 22rpx;
	font-weight: 700;
	color: #9a4a2d;
}

.footer-row {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	margin-top: 18rpx;
}

.price {
	font-size: 36rpx;
	font-weight: 900;
	color: #d95c33;
}

.spec {
	font-size: 24rpx;
	color: #7b6d66;
}

.loading-more,
.no-more {
	padding: 30rpx 0;
	text-align: center;
	font-size: 24rpx;
	color: #8d7564;
}
</style>
