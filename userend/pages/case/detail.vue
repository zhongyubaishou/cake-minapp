<template>
	<view class="detail-page" v-if="caseItem">
		<image class="banner" :src="bannerSrc" mode="aspectFill" @error="onBannerError"></image>

		<view class="content-card">
			<text class="title">{{ caseItem.name }}</text>
			<view class="tag-row">
				<text class="theme-chip">{{ caseItem.theme }}</text>
				<text v-for="tag in caseItem.tags" :key="tag" class="tag">{{ tag }}</text>
			</view>
			<text class="description">{{ caseItem.description }}</text>
		</view>

		<view class="content-card">
			<text class="section-title">制作说明</text>
			<text class="hint-text">按此案例定制时，商家会根据您的要求调整磅数、口味和主题风格。您也可以在下一步填写更多定制需求和上传参考图片。</text>
		</view>

		<view class="bottom-bar">
			<view class="fav-btn" :class="{ favorited: caseItem.isFavorited }" @click="toggleFavorite">
				<text>{{ caseItem.isFavorited ? '♥ 已收藏' : '♡ 收藏' }}</text>
			</view>
			<view class="bottom-button" @click="goCustomize">按此案例定制</view>
		</view>
	</view>
	<view v-else class="empty-page">
		<text class="empty-title">{{ loadError ? '案例加载失败' : '案例不存在' }}</text>
		<text class="empty-desc">{{ loadError || '请返回案例列表重新进入。' }}</text>
		<view v-if="loadError" class="retry-btn" @click="fetchDetail">重新加载</view>
	</view>
</template>

<script>
	import { getCaseDetail, favoriteCase, unfavoriteCase } from '@/api/case'
	import { PRODUCT_IMAGE_FALLBACK } from '@/constants/app'
	import { getImageOrFallback } from '@/utils/format'
	import { useUserStore } from '@/stores/user'

	const userStore = useUserStore()

	export default {
		data() {
			return {
				caseId: '',
				caseItem: null,
				loadError: '',
				bannerLoadError: false,
				initialized: false,
				needsRefresh: true
			}
		},
		computed: {
			bannerSrc() {
				if (this.bannerLoadError) {
					return PRODUCT_IMAGE_FALLBACK
				}
				return this.caseItem ? getImageOrFallback(this.caseItem.imageUrl) : PRODUCT_IMAGE_FALLBACK
			}
		},
		onLoad(options) {
			this.caseId = options.caseId || ''
			this.fetchDetail().then(() => {
				this.initialized = true
			})
		},
		onShow() {
			if (this.initialized && this.needsRefresh) {
				this.fetchDetail()
			}
			this.needsRefresh = true
		},
		methods: {
			onBannerError() {
				this.bannerLoadError = true
			},
			async fetchDetail() {
			if (!this.caseId) {
				this.caseItem = null
				this.loadError = '缺少案例编号'
				return
			}

			try {
				this.loadError = ''
				uni.showLoading({ title: '加载中...' })
				this.caseItem = await getCaseDetail(this.caseId)
			} catch (error) {
				this.caseItem = null
				this.loadError = error.message || '案例详情暂时加载失败，请稍后重试'
			} finally {
				uni.hideLoading()
			}
		},
			async toggleFavorite() {
				if (!this.caseItem) {
					return
				}

				if (!userStore.isLoggedIn()) {
					uni.showToast({ title: '请先登录后收藏', icon: 'none' })
					return
				}

				const isFavorited = this.caseItem.isFavorited

				try {
					if (isFavorited) {
						await unfavoriteCase(this.caseItem.id)
					} else {
						await favoriteCase(this.caseItem.id)
					}
					this.caseItem.isFavorited = !isFavorited
				this.needsRefresh = false
				uni.showToast({ title: isFavorited ? '已取消收藏' : '已收藏', icon: 'success' })
				} catch (error) {
					uni.showToast({ title: error.message || '操作失败，请稍后重试', icon: 'none' })
				}
			},
			goCustomize() {
				if (!this.caseItem) {
					return
				}

				uni.navigateTo({
					url: `/pages/order/customize?source=CASE&caseId=${this.caseItem.id}&caseName=${encodeURIComponent(this.caseItem.name)}&caseImageUrl=${encodeURIComponent(this.caseItem.imageUrl)}`
				})
			}
		}
	}
</script>

<style lang="scss">
.detail-page {
	min-height: 100vh;
	padding-bottom: 160rpx;
	background: linear-gradient(180deg, #fff7f0 0%, #f5ede3 100%);
}

.banner {
	width: 100%;
	height: 420rpx;
	background: #f4e4d5;
}

.content-card {
	margin: 24rpx;
	padding: 28rpx;
	border-radius: 24rpx;
	background: #fffdf8;
	box-shadow: 0 16rpx 32rpx rgba(103, 66, 37, 0.06);
}

.title {
	display: block;
	font-size: 38rpx;
	font-weight: 700;
	color: #4b3022;
}

.tag-row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12rpx;
	margin-top: 16rpx;
}

.theme-chip {
	padding: 8rpx 18rpx;
	border-radius: 999rpx;
	background: #c55d38;
	font-size: 22rpx;
	color: #fff9f5;
}

.tag {
	padding: 8rpx 14rpx;
	border-radius: 999rpx;
	background: #fff3e7;
	font-size: 22rpx;
	color: #a06a48;
}

.description {
	display: block;
	margin-top: 18rpx;
	font-size: 26rpx;
	line-height: 1.8;
	color: #7e6655;
}

.section-title {
	display: block;
	font-size: 30rpx;
	font-weight: 600;
	color: #543628;
}

.hint-text {
	display: block;
	margin-top: 14rpx;
	font-size: 24rpx;
	line-height: 1.7;
	color: #8d7564;
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
	background: rgba(255, 252, 247, 0.98);
	box-shadow: 0 -12rpx 30rpx rgba(70, 45, 30, 0.08);
}

.fav-btn {
	padding: 20rpx 30rpx;
	border-radius: 999rpx;
	background: #fff1e4;
	font-size: 26rpx;
	font-weight: 600;
	color: #8a553a;
}

.fav-btn.favorited {
	background: #fff0eb;
	color: #c55d38;
}

.bottom-button {
	padding: 20rpx 34rpx;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #c85e3c 0%, #eb8750 100%);
	font-size: 28rpx;
	font-weight: 700;
	color: #fff9f5;
}

.empty-page {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding: 32rpx;
	background: linear-gradient(180deg, #fff7f0 0%, #f5ede3 100%);
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
