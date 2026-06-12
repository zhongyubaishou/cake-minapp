<template>
	<view class="favorite-page">
		<SkeletonCard v-if="loading && !favoriteList.length && !loadError" type="list" :count="3" />

		<ErrorCard
			v-if="loadError && !favoriteList.length"
			:message="loadError"
			@retry="fetchFavorites(true)"
		/>

		<scroll-view
			v-if="!loading || favoriteList.length"
			class="list-scroll"
			scroll-y
			@scrolltolower="loadMore"
		>
			<view class="list-wrap">
				<view v-for="item in favoriteList" :key="item.id" class="fav-card" @click="goDetail(item.id)">
					<image class="fav-image" :src="getImage(item)" mode="aspectFill" @error="onImageError(item.id)"></image>
					<view class="fav-body">
						<text class="fav-title">{{ item.name }}</text>
						<view class="tag-row">
							<text class="theme-chip">{{ item.theme }}</text>
							<text v-for="tag in (item.tags || []).slice(0, 2)" :key="tag" class="tag">{{ tag }}</text>
						</view>
						<text class="fav-desc">{{ item.description }}</text>
					</view>
					<view class="unfav-btn" @click.stop="handleUnfavorite(item)">
						<text>取消</text>
					</view>
				</view>

				<view v-if="loadingMore" class="loading-more">加载中...</view>
				<view v-if="!hasMore && favoriteList.length > 0" class="no-more">— 没有更多了 —</view>
			</view>
		</scroll-view>

		<EmptyState
			v-if="!loading && !loadError && !favoriteList.length"
			icon="💝"
			title="暂无收藏"
			description="浏览蛋糕案例时，点击收藏即可在这里看到"
			actionText="去看看案例"
			@action="goCases"
		/>
	</view>
</template>

<script>
	import { getFavorites, unfavoriteCase } from '@/api/case'
	import { PRODUCT_IMAGE_FALLBACK } from '@/constants/app'
	import { getImageOrFallback } from '@/utils/format'
	import { useUserStore } from '@/stores/user'
	import SkeletonCard from '@/components/SkeletonCard.vue'
	import ErrorCard from '@/components/ErrorCard.vue'
	import EmptyState from '@/components/EmptyState.vue'

	const userStore = useUserStore()

	export default {
		components: { SkeletonCard, ErrorCard, EmptyState },
		data() {
			return {
				favoriteList: [],
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
			if (userStore.isLoggedIn()) {
				this.fetchFavorites(true)
			} else {
				this.favoriteList = []
				this.loadError = ''
				this.loading = false
			}
		},
		methods: {
			getImage(item) {
				return this.imageErrors[item.id] ? PRODUCT_IMAGE_FALLBACK : getImageOrFallback(item.imageUrl)
			},
			onImageError(id) {
				this.imageErrors = { ...this.imageErrors, [id]: true }
			},
			onPullDownRefresh() {
				if (userStore.isLoggedIn()) {
					this.fetchFavorites(true).finally(() => {
						uni.stopPullDownRefresh()
					})
				} else {
					uni.stopPullDownRefresh()
				}
			},
			async fetchFavorites(reset = false) {
				if (!userStore.isLoggedIn()) {
					this.favoriteList = []
					this.loading = false
					return
				}

				try {
					if (reset) {
						this.page = 1
						this.hasMore = true
						this.loadError = ''
						this.loading = true
					}
					const data = await getFavorites({ page: this.page, pageSize: this.pageSize })
					const list = Array.isArray(data) ? data : data && Array.isArray(data.list) ? data.list : []
					if (reset) {
						this.favoriteList = list
					}
					this.hasMore = list.length >= this.pageSize
				} catch (error) {
					if (reset) {
						this.favoriteList = []
					}
					this.loadError = error.message || '收藏暂时加载失败，请稍后重试'
				} finally {
					this.loading = false
				}
			},
			async loadMore() {
				if (this.loadingMore || !this.hasMore) return
				this.loadingMore = true
				try {
					this.page += 1
					const data = await getFavorites({ page: this.page, pageSize: this.pageSize })
					const list = Array.isArray(data) ? data : data && Array.isArray(data.list) ? data.list : []
					this.favoriteList = this.favoriteList.concat(list)
					this.hasMore = list.length >= this.pageSize
				} catch (error) {
					this.page -= 1
				} finally {
					this.loadingMore = false
				}
			},
			async handleUnfavorite(item) {
				const confirmResult = await new Promise((resolve) => {
					uni.showModal({
						title: '取消收藏',
						content: `确定要取消收藏"${item.name}"吗？`,
						confirmText: '确定',
						cancelText: '取消',
						confirmColor: '#c55d38',
						success: (res) => resolve(res.confirm)
					})
				})

				if (!confirmResult) {
					return
				}

				try {
					await unfavoriteCase(item.id)
					this.favoriteList = this.favoriteList.filter((fav) => fav.id !== item.id)
					uni.showToast({ title: '已取消收藏', icon: 'success' })
				} catch (error) {
					uni.showToast({ title: error.message || '操作失败，请稍后重试', icon: 'none' })
				}
			},
			goDetail(caseId) {
				uni.navigateTo({ url: `/pages/case/detail?caseId=${caseId}` })
			},
			goCases() {
				uni.switchTab({ url: '/pages/case/list' })
			}
		}
	}
</script>

<style lang="scss">
.favorite-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #fff8f1 0%, #f4ede3 100%);
	display: flex;
	flex-direction: column;
}

.list-scroll {
	flex: 1;
}

.list-wrap {
	padding: 24rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.fav-card {
	display: flex;
	align-items: center;
	gap: 18rpx;
	padding: 20rpx;
	border-radius: 24rpx;
	background: #fffdf9;
	box-shadow: 0 14rpx 30rpx rgba(97, 59, 30, 0.06);
}

.fav-image {
	width: 160rpx;
	height: 160rpx;
	border-radius: 18rpx;
	background: #f3e2d4;
	flex-shrink: 0;
}

.fav-body {
	flex: 1;
	min-width: 0;
}

.fav-title {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	color: #4d3123;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.tag-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8rpx;
	margin-top: 10rpx;
}

.theme-chip {
	padding: 4rpx 12rpx;
	border-radius: 999rpx;
	background: #c55d38;
	font-size: 20rpx;
	color: #fff9f5;
}

.tag {
	padding: 4rpx 12rpx;
	border-radius: 999rpx;
	background: #fff3e7;
	font-size: 20rpx;
	color: #a06a48;
}

.fav-desc {
	display: block;
	margin-top: 12rpx;
	font-size: 22rpx;
	line-height: 1.6;
	color: #806655;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.unfav-btn {
	padding: 14rpx 20rpx;
	border-radius: 999rpx;
	background: #fff1e4;
	font-size: 22rpx;
	color: #8a553a;
	flex-shrink: 0;
}

.loading-more,
.no-more {
	text-align: center;
	font-size: 24rpx;
	color: #a89888;
	padding: 8rpx 0;
}
</style>
