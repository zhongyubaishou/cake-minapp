<template>
	<view class="case-page">
		<scroll-view class="theme-scroll" scroll-x enable-flex>
			<view class="theme-row">
				<view
					class="theme-tab"
					:class="{ active: !activeTheme }"
					@click="changeTheme('')"
				>
					全部
				</view>
				<view
					v-for="theme in themeOptions"
					:key="theme.value"
					class="theme-tab"
					:class="{ active: activeTheme === theme.value }"
					@click="changeTheme(theme.value)"
				>
					{{ theme.label }}
				</view>
			</view>
		</scroll-view>

		<SkeletonCard v-if="loading && !caseList.length && !loadError" type="list" :count="3" />

		<ErrorCard
			v-if="loadError && !caseList.length"
			:message="loadError"
			@retry="fetchCases(true)"
		/>

		<scroll-view
			v-if="!loading || caseList.length"
			class="list-scroll"
			scroll-y
			@scrolltolower="loadMore"
		>
			<view class="list-wrap">
				<view v-for="item in caseList" :key="item.id" class="case-card" @click="goDetail(item.id)">
					<image class="case-image" :src="getCaseImage(item)" mode="aspectFill" @error="onImageError(item.id)"></image>
					<view class="case-body">
						<text class="case-title">{{ item.name }}</text>
						<view class="tag-row">
							<text class="theme-chip">{{ item.theme }}</text>
							<text v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</text>
						</view>
						<text class="case-desc">{{ item.description }}</text>
						<view class="case-footer">
							<view class="favorite-hint" v-if="item.isFavorited">
								<text class="favorite-icon">♥</text>
								<text>已收藏</text>
							</view>
							<text class="customize-btn">按案例定制</text>
						</view>
					</view>
				</view>

				<view v-if="loadingMore" class="loading-more">加载中...</view>
				<view v-if="!hasMore && caseList.length > 0" class="no-more">— 没有更多了 —</view>
			</view>
		</scroll-view>

		<EmptyState
			v-if="!loading && !loadError && !caseList.length"
			title="暂无案例"
			description="换个主题看看吧"
			actionText="去看看商品"
			@action="goProducts"
		/>
	</view>
</template>

<script>
	import { getCases } from '@/api/case'
	import { PRODUCT_IMAGE_FALLBACK } from '@/constants/app'
	import { THEME_OPTIONS } from '@/constants/order'
	import { getImageOrFallback } from '@/utils/format'
	import SkeletonCard from '@/components/SkeletonCard.vue'
	import ErrorCard from '@/components/ErrorCard.vue'
	import EmptyState from '@/components/EmptyState.vue'

	export default {
		components: { SkeletonCard, ErrorCard, EmptyState },
		data() {
			return {
				activeTheme: '',
				themeOptions: THEME_OPTIONS,
				caseList: [],
				loadError: '',
				imageErrors: {},
				page: 1,
				pageSize: 10,
				hasMore: true,
				loadingMore: false,
				loading: false
			}
		},
		onShow() {
			this.fetchCases(true)
		},
		methods: {
			getCaseImage(item) {
				return this.imageErrors[item.id] ? PRODUCT_IMAGE_FALLBACK : getImageOrFallback(item.imageUrl)
			},
			onImageError(id) {
				this.imageErrors = { ...this.imageErrors, [id]: true }
			},
			onPullDownRefresh() {
				this.fetchCases(true).finally(() => {
					uni.stopPullDownRefresh()
				})
			},
			async fetchCases(reset = false) {
				try {
					if (reset) {
						this.page = 1
						this.hasMore = true
						this.loadError = ''
						this.loading = true
					}
					const params = { page: this.page, pageSize: this.pageSize }
					if (this.activeTheme) params.theme = this.activeTheme
					const data = await getCases(params)
					const list = Array.isArray(data) ? data : data && Array.isArray(data.list) ? data.list : []
					if (reset) {
						this.caseList = list
					}
					this.hasMore = list.length >= this.pageSize
				} catch (error) {
					if (reset) {
						this.caseList = []
					}
					this.loadError = error.message || '案例暂时加载失败，请稍后重试'
				} finally {
					this.loading = false
				}
			},
			async loadMore() {
				if (this.loadingMore || !this.hasMore) return
				this.loadingMore = true
				try {
					this.page += 1
					const params = { page: this.page, pageSize: this.pageSize }
					if (this.activeTheme) params.theme = this.activeTheme
					const data = await getCases(params)
					const list = Array.isArray(data) ? data : data && Array.isArray(data.list) ? data.list : []
					this.caseList = this.caseList.concat(list)
					this.hasMore = list.length >= this.pageSize
				} catch (error) {
					this.page -= 1
				} finally {
					this.loadingMore = false
				}
			},
			changeTheme(theme) {
				this.activeTheme = theme
				this.fetchCases(true)
			},
			goDetail(caseId) {
				uni.navigateTo({ url: `/pages/case/detail?caseId=${caseId}` })
			},
			goProducts() {
				uni.switchTab({ url: '/pages/product/list' })
			}
		}
	}
</script>

<style lang="scss">
.case-page {
	min-height: 100vh;
	background: #f6f1ed;
	display: flex;
	flex-direction: column;
}

.theme-scroll {
	white-space: nowrap;
	padding: 24rpx 24rpx 10rpx;
	flex-shrink: 0;
}

.theme-row {
	display: inline-flex;
	gap: 16rpx;
}

.theme-tab {
	padding: 14rpx 28rpx;
	border: 2rpx solid #c8beb8;
	border-radius: 999rpx;
	background: #fff;
	font-size: 26rpx;
	font-weight: 700;
	color: #4d443f;
	position: relative;
}

.theme-tab.active {
	border-color: #d95c33;
	background: #d95c33;
	color: #fff;
}

.theme-tab.active::after {
	content: '';
	position: absolute;
	bottom: -4rpx;
	left: 50%;
	transform: translateX(-50%);
	width: 36rpx;
	height: 4rpx;
	background: #1a1512;
	border-radius: 2rpx;
}

.list-scroll {
	flex: 1;
}

.list-wrap {
	padding: 16rpx 24rpx 40rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.case-card {
	overflow: hidden;
	border-radius: 24rpx;
	background: #fff;
	box-shadow: 0 16rpx 40rpx rgba(26, 21, 18, 0.08);
}

.case-image {
	width: 100%;
	height: 340rpx;
	background: #f0e7e0;
}

.case-body {
	padding: 24rpx;
	position: relative;
}

.case-body::before {
	content: '';
	position: absolute;
	top: 0;
	left: 24rpx;
	width: 48rpx;
	height: 4rpx;
	background: #d95c33;
	border-radius: 2rpx;
}

.case-title {
	display: block;
	font-size: 32rpx;
	font-weight: 800;
	letter-spacing: 0.5rpx;
	color: #2d2521;
}

.tag-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12rpx;
	margin-top: 14rpx;
}

.theme-chip {
	position: relative;
	padding: 6rpx 16rpx;
	border-radius: 999rpx;
	background: #d95c33;
	font-size: 22rpx;
	color: #fff;
}

.theme-chip::after {
	content: '';
	position: absolute;
	right: -4rpx;
	bottom: 0;
	width: 14rpx;
	height: 14rpx;
	background: rgba(232, 184, 48, 0.7);
	border-radius: 2rpx;
}

.tag {
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
}

.tag:nth-child(3n+1) {
	background: rgba(217, 92, 51, 0.08);
	color: #a06a48;
}

.tag:nth-child(3n+2) {
	background: rgba(45, 95, 191, 0.08);
	color: #2d5fbf;
}

.tag:nth-child(3n) {
	background: rgba(232, 184, 48, 0.12);
	color: #8a6a20;
}

.case-desc {
	display: block;
	margin-top: 14rpx;
	font-size: 24rpx;
	line-height: 1.7;
	color: #806655;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.case-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 20rpx;
}

.favorite-hint {
	display: flex;
	align-items: center;
	gap: 8rpx;
	font-size: 22rpx;
	color: #d95c33;
}

.favorite-icon {
	font-size: 26rpx;
}

.customize-btn {
	position: relative;
	padding: 14rpx 24rpx;
	border-radius: 999rpx;
	background: #d95c33;
	font-size: 24rpx;
	font-weight: 800;
	color: #fff;
	margin-left: auto;
}

.customize-btn::after {
	content: '';
	position: absolute;
	right: 8rpx;
	bottom: 6rpx;
	width: 10rpx;
	height: 10rpx;
	background: #2d5fbf;
}

.loading-more,
.no-more {
	text-align: center;
	font-size: 24rpx;
	color: #a89888;
	padding: 8rpx 0;
}
</style>
