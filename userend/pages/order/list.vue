<template>
	<view class="order-page">
		<scroll-view class="status-scroll" scroll-x enable-flex>
			<view class="status-row">
				<view class="status-chip" :class="{ active: activeStatus === '' }" @click="changeStatus('')">全部</view>
				<view v-for="item in statusTabs" :key="item.value" class="status-chip" :class="{ active: activeStatus === item.value }" @click="changeStatus(item.value)">
					{{ item.label }}
				</view>
			</view>
		</scroll-view>

		<scroll-view class="list-scroll" scroll-y @scrolltolower="onLoadMore">
			<SkeletonCard v-if="loading && !orderList.length && !loadError" type="list" :count="4" />

			<ErrorCard v-else-if="loadError" :message="loadError" @retry="fetchOrders" />

			<EmptyState
				v-else-if="!loading && !orderList.length && !loadError"
				icon="📦"
				title="暂无订单"
				description="先去看看喜欢的蛋糕吧"
				actionText="去看看案例"
				@action="goToCase"
			/>

			<view v-else class="list-wrap">
				<view v-for="item in filteredOrders" :key="item.id" class="order-card">
					<view class="top-row">
						<text class="order-no">订单号 {{ item.orderNo }}</text>
						<text class="status-text">{{ item.statusText }}</text>
					</view>
					<text class="status-desc">{{ getStatusDescription(item) }}</text>
					<view class="content-row">
						<image class="order-image" :src="getOrderImageSrc(item)" mode="aspectFill" @error="onOrderImageError(item.id)"></image>
						<view class="order-main">
							<text class="order-title">{{ item.productName }}</text>
							<text class="order-meta">预约时间：{{ item.appointmentTime }}</text>
							<text class="order-meta">取货方式：{{ item.pickupTypeText }}</text>
							<text class="order-price">{{ getPriceText(item.totalAmount) }}</text>
						</view>
					</view>
					<view class="action-row">
						<view v-for="action in getActions(item)" :key="action" class="action-btn" @click="handleAction(action, item)">
							{{ actionTextMap[action] }}
						</view>
					</view>
				</view>

				<view v-if="loadingMore" class="loading-more">加载中...</view>
				<view v-else-if="!hasMore && filteredOrders.length > 0" class="no-more">— 没有更多了 —</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import { cancelOrder, getOrders } from '@/api/order'
	import { PRODUCT_IMAGE_FALLBACK } from '@/constants/app'
	import {
		ORDER_ACTIONS,
		ORDER_STATUS,
		USER_AFTER_SALE_ORDER_STATUSES,
		USER_CANCELABLE_ORDER_STATUSES,
		USER_REBUY_ORDER_STATUSES
	} from '@/constants/order'
	import { formatPrice, getImageOrFallback } from '@/utils/format'
	import { normalizeOrderListItem } from '@/utils/order-adapter'
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
				activeStatus: '',
				orderList: [],
				loadError: '',
				loading: false,
				page: 1,
				hasMore: true,
				loadingMore: false,
				pollTimer: null,
				orderImageErrors: {},
				statusTabs: [
					{ label: '待接单', value: ORDER_STATUS.WAIT_ACCEPT },
					{ label: '待制作', value: ORDER_STATUS.PAID_WAIT_MAKE },
					{ label: '制作中', value: ORDER_STATUS.MAKING },
					{ label: '待自提', value: ORDER_STATUS.WAIT_PICKUP },
					{ label: '待配送', value: ORDER_STATUS.WAIT_DELIVERY },
					{ label: '配送中', value: ORDER_STATUS.DELIVERING },
					{ label: '已完成', value: ORDER_STATUS.COMPLETED },
					{ label: '已取消', value: ORDER_STATUS.CANCELED },
					{ label: '退款中', value: ORDER_STATUS.REFUNDING },
					{ label: '已退款', value: ORDER_STATUS.REFUNDED }
				],
				actionTextMap: {
					[ORDER_ACTIONS.CANCEL]: '取消订单',
					[ORDER_ACTIONS.AFTER_SALE]: '申请售后',
					rebuy: '再次购买',
					detail: '查看详情'
				}
			}
		},
		computed: {
			filteredOrders() {
				if (!this.activeStatus) {
					return this.orderList
				}

				return this.orderList.filter((item) => item.status === this.activeStatus)
			}
		},
		async onShow() {
			this.loading = true
			this.loadError = ''
			await this.fetchOrders()
			this.loading = false
			if (this.pollTimer) {
				clearInterval(this.pollTimer)
			}
			this.pollTimer = setInterval(() => this.silentRefresh(), 30000)
		},
		onHide() {
			if (this.pollTimer) {
				clearInterval(this.pollTimer)
				this.pollTimer = null
			}
		},
		methods: {
			getOrderImageSrc(item) {
				return this.orderImageErrors[item.id] ? PRODUCT_IMAGE_FALLBACK : getImageOrFallback(item.productImageUrl)
			},
			onOrderImageError(id) {
				this.orderImageErrors = { ...this.orderImageErrors, [id]: true }
			},
			canCancel(order) {
				return USER_CANCELABLE_ORDER_STATUSES.includes(order.status)
			},
			canAfterSale(order) {
				return USER_AFTER_SALE_ORDER_STATUSES.includes(order.status)
			},
			canRebuy(order) {
				return USER_REBUY_ORDER_STATUSES.includes(order.status)
			},
			onPullDownRefresh() {
				this.fetchOrders().finally(() => {
					uni.stopPullDownRefresh()
				})
			},
			async fetchOrders(isLoadMore = false) {
				if (isLoadMore) {
					if (this.loadingMore || !this.hasMore) return
					this.loadingMore = true
				}

				try {
					if (!isLoadMore) {
						this.loadError = ''
						uni.showLoading({ title: '加载中...' })
					}

					const params = {
						...(this.activeStatus ? { status: this.activeStatus } : {}),
						page: this.page,
						pageSize: 10
					}
					const data = await getOrders(params)
					const source = Array.isArray(data) ? data : data && Array.isArray(data.list) ? data.list : []
					const list = source.map(normalizeOrderListItem)

					if (isLoadMore) {
						this.orderList = [...this.orderList, ...list]
					} else {
						this.orderList = list
					}

					this.hasMore = list.length >= 10
				} catch (error) {
					if (!isLoadMore) {
						this.orderList = []
						this.loadError = error.message || '订单列表暂时加载失败，请稍后重试'
					} else {
						uni.showToast({ title: '加载失败', icon: 'none' })
					}
				} finally {
					this.loadingMore = false
					if (!isLoadMore) {
						uni.hideLoading()
					}
				}
			},
			changeStatus(status) {
				this.activeStatus = status
				this.page = 1
				this.hasMore = true
				this.loadError = ''
				this.orderList = []
				this.loading = true
				this.fetchOrders().finally(() => {
					this.loading = false
				})
			},
			onLoadMore() {
				if (this.loadingMore || !this.hasMore) return
				this.page++
				this.fetchOrders(true)
			},
			async silentRefresh() {
				try {
					const data = await getOrders(this.activeStatus ? { status: this.activeStatus, page: 1, pageSize: 50 } : { page: 1, pageSize: 50 })
					const source = Array.isArray(data) ? data : data && Array.isArray(data.list) ? data.list : []
					const list = source.map(normalizeOrderListItem)
					if (JSON.stringify(list.map(i => i.status)) !== JSON.stringify(this.orderList.map(i => i.status))) {
						this.orderList = list
					}
				} catch { }
			},
			goToCase() {
				uni.switchTab({ url: '/pages/case/list' })
			},
			getPriceText(value) {
				return typeof value === 'number' ? `¥${formatPrice(value)}` : value
			},
			getStatusDescription(order) {
				const statusTextMap = {
					[ORDER_STATUS.WAIT_ACCEPT]: '订单已提交，等待商家确认报价与接单。',
					[ORDER_STATUS.PAID_WAIT_MAKE]: '商家已线下确认支付，订单即将进入制作。',
					[ORDER_STATUS.MAKING]: '蛋糕正在制作中，请留意预约时间。',
					[ORDER_STATUS.WAIT_PICKUP]: '蛋糕已制作完成，可按预约时间到店自提。',
					[ORDER_STATUS.WAIT_DELIVERY]: '蛋糕已制作完成，等待商家安排配送。',
					[ORDER_STATUS.DELIVERING]: '蛋糕正在配送中，请保持电话畅通。',
					[ORDER_STATUS.COMPLETED]: '订单已完成，如有问题可在 3 天内反馈。',
					[ORDER_STATUS.CANCELED]: `订单已取消${order.cancelReason ? `：${order.cancelReason}` : ''}`,
					[ORDER_STATUS.REFUNDING]: '订单退款处理中，请耐心等待。',
					[ORDER_STATUS.REFUNDED]: '订单已退款，可重新发起下单。'
				}

				return statusTextMap[order.status] || '可进入详情查看订单最新进度。'
			},
			getActions(order) {
				const actions = []

				if (this.canCancel(order)) {
					actions.push(ORDER_ACTIONS.CANCEL)
				}

				if (this.canRebuy(order)) {
					actions.push('rebuy')
				}

				if (this.canAfterSale(order)) {
					actions.push(ORDER_ACTIONS.AFTER_SALE)
				}

				actions.push('detail')
				return actions
			},
			async handleAction(action, order) {
				if (action === ORDER_ACTIONS.CANCEL) {
					const isPaidOrder = order.status === ORDER_STATUS.PAID_WAIT_MAKE
					const confirmResult = await new Promise((resolve) => {
						uni.showModal({
							title: '确认取消订单',
							content: isPaidOrder
								? '该订单商家已线下确认支付。取消后如有费用问题请与商家线下沟通，确定要取消吗？'
								: '确定要取消该订单吗？',
							confirmText: '确定取消',
							cancelText: '我再想想',
							confirmColor: '#c55d38',
							success: (res) => resolve(res.confirm)
						})
					})

					if (!confirmResult) {
						return
					}

					try {
						await cancelOrder(order.id)
						uni.showToast({ title: '订单已取消', icon: 'success' })
						this.fetchOrders()
					} catch (error) {
						uni.showToast({ title: error.message || '取消失败', icon: 'none' })
					}
					return
				}

				if (action === ORDER_ACTIONS.AFTER_SALE) {
					uni.navigateTo({ url: `/pages/mine/after-sale?orderId=${order.id}` })
					return
				}

				if (action === 'rebuy') {
					uni.navigateTo({ url: `/pages/order/customize?source=REBUY&buyPound=${order.buyPound}&flavor=${encodeURIComponent(order.flavor || '原味')}&theme=${encodeURIComponent(order.theme || '成人')}&blessingText=${encodeURIComponent(order.blessingText || '')}&categoryId=${order.categoryId || ''}` })
					return
				}

				uni.navigateTo({ url: `/pages/order/detail?orderId=${order.id}` })
			}
		}
	}
</script>

<style lang="scss">
.order-page {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f6f1ed;
}

.status-scroll {
	white-space: nowrap;
	padding: 24rpx 24rpx 8rpx;
	flex-shrink: 0;
}

.status-row {
	display: inline-flex;
	gap: 14rpx;
}

.status-chip {
	padding: 14rpx 24rpx;
	border: 2rpx solid #eadfd8;
	border-radius: 999rpx;
	background: #fff;
	font-size: 24rpx;
	font-weight: 700;
	color: #4d443f;
}

.status-chip.active {
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

.order-card {
	padding: 24rpx;
	border: 2rpx solid #f0e6df;
	border-radius: 24rpx;
	background: #fff;
	box-shadow: 0 10rpx 30rpx rgba(70, 45, 32, 0.06);
}

.top-row,
.action-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.content-row {
	display: flex;
	gap: 16rpx;
	margin-top: 18rpx;
}

.order-no,
.status-text,
.status-desc,
.order-meta {
	font-size: 24rpx;
	color: #856959;
}

.status-desc {
	display: block;
	margin-top: 10rpx;
	line-height: 1.6;
	color: #9a7a66;
}

.status-text,
.order-price {
	color: #d95c33;
	font-weight: 800;
}

.order-image {
	width: 140rpx;
	height: 140rpx;
	border-radius: 18rpx;
	background: #f3e2d4;
}

.order-main {
	flex: 1;
}

.order-title {
	display: block;
	font-size: 29rpx;
	font-weight: 800;
	color: #2d2521;
}

.order-meta,
.order-price {
	display: block;
	margin-top: 10rpx;
}

.action-row {
	justify-content: flex-end;
	gap: 12rpx;
	margin-top: 20rpx;
}

.action-btn {
	padding: 12rpx 22rpx;
	border-radius: 999rpx;
	background: #fff2e5;
	font-size: 24rpx;
	color: #8e5b40;
}

.loading-more {
	text-align: center;
	padding: 24rpx 0;
	font-size: 24rpx;
	color: #b5a094;
}

.no-more {
	text-align: center;
	padding: 24rpx 0;
	font-size: 24rpx;
	color: #c4b5aa;
}
</style>
