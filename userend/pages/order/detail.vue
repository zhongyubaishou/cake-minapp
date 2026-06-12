<template>
	<scroll-view v-if="order" class="detail-page" scroll-y>
		<view class="status-card">
			<text class="status-label">订单状态</text>
			<text class="status-value">{{ order.statusText }}</text>
			<text class="status-desc">{{ getStatusDescription(order) }}</text>
			<text v-if="order.isOutsideHours" class="status-tag">当前订单预约时间不在门店常规营业时段内</text>
		</view>

		<view class="card">
			<text class="section-title">履约进度</text>
			<view class="progress-list">
				<view v-for="step in progressSteps" :key="step.key" class="progress-item" :class="{ active: step.active, current: step.current }">
					<view class="progress-dot"></view>
					<view class="progress-main">
						<view class="progress-head">
							<text class="progress-title">{{ step.title }}</text>
							<text class="progress-time">{{ step.time ? formatDateTime(step.time) : step.active ? '进行中' : '待更新' }}</text>
						</view>
						<text class="progress-desc">{{ step.description }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="card product-card">
			<image class="product-image" :src="getProductImageSrc()" mode="aspectFill" @error="onProductImageError()"></image>
			<view class="product-main">
				<text class="product-title">{{ order.productName }}</text>
				<text class="product-meta">分类：{{ order.categoryName || '定制蛋糕' }}</text>
				<text class="product-meta">订单号：{{ order.orderNo }}</text>
			</view>
		</view>

		<view class="card">
			<text class="section-title">定制信息</text>
			<view class="info-list">
				<view class="info-row"><text>购买磅数</text><text>{{ order.buyPound }} 磅</text></view>
				<view class="info-row"><text>实际制作</text><text>{{ order.actualMakePound }} 磅</text></view>
				<view class="info-row"><text>口味</text><text>{{ order.flavor || '原味' }}</text></view>
				<view class="info-row"><text>主题</text><text>{{ order.theme || '成人' }}</text></view>
				<view class="info-row"><text>祝福文字</text><text>{{ order.blessingText || '未填写' }}</text></view>
				<view class="info-row"><text>碟子 / 蜡烛</text><text>{{ order.plateCount || 1 }} / {{ order.candleCount || 1 }}</text></view>
				<view class="info-row top-align"><text>特殊备注</text><text class="multiline">{{ order.userRemark || '未填写' }}</text></view>
				<view v-if="order.referenceImages.length" class="reference-block">
					<text class="reference-label">参考图片</text>
					<view class="reference-list">
						<image v-for="(image, index) in order.referenceImages" :key="`${image}-${index}`" class="reference-image" :src="image" mode="aspectFill" @click="previewImage(index)"></image>
					</view>
				</view>
			</view>
		</view>

		<view class="card">
			<text class="section-title">预约与配送</text>
			<view class="info-list">
				<view class="info-row"><text>预约时间</text><text>{{ order.appointmentTime }}</text></view>
				<view class="info-row"><text>取货方式</text><text>{{ order.pickupTypeText }}</text></view>
				<view class="info-row"><text>联系人</text><text>{{ order.contactName || order.receiverName || '未填写' }}</text></view>
				<view v-if="order.phone" class="info-row"><text>联系电话</text><text>{{ order.phone }}</text></view>
				<view v-if="order.address" class="info-row top-align"><text>配送地址</text><text class="multiline">{{ order.address }}</text></view>
				<view v-if="order.distanceKm !== ''" class="info-row"><text>配送距离</text><text>{{ getDistanceText(order.distanceKm) }}</text></view>
				<view class="info-row"><text>配送费</text><text>{{ getAmountText(order.deliveryFee) }}</text></view>
			</view>
		</view>

		<view class="card">
			<text class="section-title">费用明细</text>
			<view class="info-list">
				<view class="info-row"><text>商品金额</text><text>{{ getAmountText(order.productAmount) }}</text></view>
				<view class="info-row"><text>配送费</text><text>{{ getAmountText(order.deliveryFee) }}</text></view>
				<view class="info-row total-row"><text>应付金额</text><text>{{ getAmountText(order.totalAmount) }}</text></view>
			</view>
		</view>

		<view v-if="order.afterSale" class="card">
			<text class="section-title">售后反馈</text>
			<view class="after-sale-status">
				<text class="after-sale-badge">{{ order.afterSale.statusText || '已提交' }}</text>
				<text class="after-sale-time">提交时间：{{ formatDateTime(order.afterSale.createdAt) }}</text>
			</view>
			<view class="info-list">
				<view class="info-row top-align"><text>问题描述</text><text class="multiline">{{ order.afterSale.description || '未填写' }}</text></view>
				<view v-if="order.afterSale.images && order.afterSale.images.length" class="reference-block">
					<text class="reference-label">凭证图片</text>
					<view class="reference-list">
						<image v-for="(image, index) in order.afterSale.images" :key="`as-${image}-${index}`" class="reference-image" :src="image" mode="aspectFill" @click="previewAfterSaleImage(index)"></image>
					</view>
				</view>
			</view>
			<view class="after-sale-action" @click="goAfterSale">
				<text>查看售后详情</text>
			</view>
		</view>

		<view class="card">
			<text class="section-title">订单信息</text>
			<view class="info-list">
				<view class="info-row"><text>订单号</text><text>{{ order.orderNo }}</text></view>
				<view class="info-row"><text>下单时间</text><text>{{ formatDateTime(order.createdAt) }}</text></view>
				<view class="info-row"><text>支付方式</text><text>{{ order.paymentMethodText || '线下确认' }}</text></view>
				<view class="info-row"><text>确认支付时间</text><text>{{ formatDateTime(order.paidAt || order.acceptedAt) }}</text></view>
				<view class="info-row"><text>联系手机</text><text>{{ order.phone || '未填写' }}</text></view>
				<view v-if="order.bossRemark" class="info-row top-align"><text>商家备注</text><text class="multiline">{{ order.bossRemark }}</text></view>
				<view v-if="order.cancelReason" class="info-row top-align"><text>取消原因</text><text class="multiline">{{ order.cancelReason }}</text></view>
			</view>
		</view>

		<view v-if="actions.length" class="bottom-actions">
			<view v-for="action in actions" :key="action" class="bottom-btn" @click="handleAction(action)">
				{{ actionTextMap[action] }}
			</view>
		</view>
	</scroll-view>
	<view v-else class="empty-page">
		<text class="empty-title">{{ loadError ? '订单加载失败' : '订单不存在' }}</text>
		<text class="empty-desc">{{ loadError || '请返回我的订单重新进入。' }}</text>
		<view v-if="loadError" class="retry-btn" @click="loadOrder">重新加载</view>
	</view>
</template>

<script>
	import { cancelOrder, getOrderDetail } from '@/api/order'
	import { PRODUCT_IMAGE_FALLBACK } from '@/constants/app'
	import {
		ORDER_ACTIONS,
		ORDER_STATUS,
		USER_AFTER_SALE_ORDER_STATUSES,
		USER_CANCELABLE_ORDER_STATUSES,
		USER_REBUY_ORDER_STATUSES
	} from '@/constants/order'
	import { formatDateTime, formatDistance, formatPrice, getImageOrFallback } from '@/utils/format'
	import { normalizeOrderDetail } from '@/utils/order-adapter'

	export default {
		data() {
			return {
				orderId: '',
				order: null,
				loadError: '',
				productImageLoadError: false,
				actionTextMap: {
					[ORDER_ACTIONS.CANCEL]: '取消订单',
					[ORDER_ACTIONS.AFTER_SALE]: '申请售后',
					rebuy: '再次购买'
				}
			}
		},
		computed: {
			actions() {
				if (!this.order) {
					return []
				}

				const actions = []

				if (this.canCancel(this.order)) {
					actions.push(ORDER_ACTIONS.CANCEL)
				}

				if (this.canAfterSale(this.order)) {
					actions.push(ORDER_ACTIONS.AFTER_SALE)
				}

				if (this.canRebuy(this.order)) {
					actions.push('rebuy')
				}

				return actions
			},
			progressSteps() {
				if (!this.order) {
					return []
				}

				if (this.order.status === ORDER_STATUS.CANCELED) {
					return [
						{
							key: 'CANCELED',
							title: '订单已取消',
							description: this.order.cancelReason || '订单在开始制作前已取消。',
							time: this.order.updatedAt || this.order.createdAt,
							active: true,
							current: true
						}
					]
				}

				if (this.order.status === ORDER_STATUS.REFUNDED) {
					return [
						{
							key: 'REFUNDED',
							title: '订单已退款',
							description: '退款已完成，可重新发起新的定制需求。',
							time: this.order.completedAt || this.order.paidAt || this.order.createdAt,
							active: true,
							current: true
						}
					]
				}

				if (this.order.status === ORDER_STATUS.REFUNDING) {
					return [
						{
							key: 'REFUNDING',
							title: '退款处理中',
							description: '退款正在处理中，请耐心等待。',
							time: this.order.updatedAt || this.order.createdAt,
							active: true,
							current: true
						}
					]
				}

				const steps = [
					{
						key: 'WAIT_ACCEPT',
						title: '提交订单',
						description: '订单已提交，等待商家确认。',
						time: this.order.createdAt,
						statuses: [
							ORDER_STATUS.WAIT_ACCEPT,
							ORDER_STATUS.PAID_WAIT_MAKE,
							ORDER_STATUS.MAKING,
							ORDER_STATUS.WAIT_PICKUP,
							ORDER_STATUS.WAIT_DELIVERY,
							ORDER_STATUS.DELIVERING,
							ORDER_STATUS.COMPLETED
						]
					},
					{
						key: 'PAID_WAIT_MAKE',
						title: '线下确认支付',
						description: '商家确认报价并线下确认支付成功。',
						time: this.order.paidAt || this.order.acceptedAt,
						statuses: [
							ORDER_STATUS.PAID_WAIT_MAKE,
							ORDER_STATUS.MAKING,
							ORDER_STATUS.WAIT_PICKUP,
							ORDER_STATUS.WAIT_DELIVERY,
							ORDER_STATUS.DELIVERING,
							ORDER_STATUS.COMPLETED
						]
					},
					{
						key: 'MAKING',
						title: '开始制作',
						description: '蛋糕进入制作流程。',
						time: this.order.startMakingAt,
						statuses: [
							ORDER_STATUS.MAKING,
							ORDER_STATUS.WAIT_PICKUP,
							ORDER_STATUS.WAIT_DELIVERY,
							ORDER_STATUS.DELIVERING,
							ORDER_STATUS.COMPLETED
						]
					},
					{
						key: 'READY',
						title: this.order.pickupType === 'DELIVERY' ? '待配送' : '待自提',
						description: this.order.pickupType === 'DELIVERY' ? '蛋糕已制作完成，等待商家配送。' : '蛋糕已制作完成，可到店自提。',
						time: this.order.finishedProductionAt,
						statuses: this.order.pickupType === 'DELIVERY'
							? [ORDER_STATUS.WAIT_DELIVERY, ORDER_STATUS.DELIVERING, ORDER_STATUS.COMPLETED]
							: [ORDER_STATUS.WAIT_PICKUP, ORDER_STATUS.COMPLETED]
					},
					{
						key: 'FINISH',
						title: this.order.pickupType === 'DELIVERY' ? '配送完成' : '取货完成',
						description: this.order.pickupType === 'DELIVERY' ? '商家已确认送达，本次订单完成。' : '商家已确认取货，本次订单完成。',
						time: this.order.completedAt || this.order.startedDeliveryAt,
						statuses: this.order.pickupType === 'DELIVERY'
							? [ORDER_STATUS.DELIVERING, ORDER_STATUS.COMPLETED]
							: [ORDER_STATUS.COMPLETED]
					}
				]

				return steps.map((step) => ({
					...step,
					active: step.statuses.includes(this.order.status),
					current: this.getCurrentProgressKey() === step.key
				}))
			}
		},
		onLoad(options) {
			this.orderId = options.orderId || ''
			this.loadOrder()
		},
		onShow() {
			this.loadOrder()
		},
		methods: {
			formatDateTime,
			getProductImageSrc() {
				if (this.productImageLoadError) {
					return PRODUCT_IMAGE_FALLBACK
				}
				return this.order ? getImageOrFallback(this.order.productImageUrl) : PRODUCT_IMAGE_FALLBACK
			},
			onProductImageError() {
				this.productImageLoadError = true
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
			getCurrentProgressKey() {
				if (!this.order) {
					return ''
				}

				if (this.order.status === ORDER_STATUS.WAIT_ACCEPT) {
					return 'WAIT_ACCEPT'
				}

				if (this.order.status === ORDER_STATUS.PAID_WAIT_MAKE) {
					return 'PAID_WAIT_MAKE'
				}

				if (this.order.status === ORDER_STATUS.MAKING) {
					return 'MAKING'
				}

				if ([ORDER_STATUS.WAIT_PICKUP, ORDER_STATUS.WAIT_DELIVERY].includes(this.order.status)) {
					return 'READY'
				}

				if ([ORDER_STATUS.DELIVERING, ORDER_STATUS.COMPLETED].includes(this.order.status)) {
					return 'FINISH'
				}

				return ''
			},
			async loadOrder() {
				if (!this.orderId) {
					this.order = null
					this.loadError = '缺少订单编号'
					return
				}

				try {
					this.loadError = ''
					const detail = await getOrderDetail(this.orderId)
					this.order = normalizeOrderDetail(detail)
				} catch (error) {
					this.order = null
					this.loadError = error.message || '订单详情暂时加载失败，请稍后重试'
				}
			},
			getAmountText(value) {
				return typeof value === 'number' ? `¥${formatPrice(value)}` : value
			},
			getDistanceText(value) {
				return formatDistance(value)
			},
			getStatusDescription(order) {
				const descriptionMap = {
					[ORDER_STATUS.WAIT_ACCEPT]: '订单已提交，商家确认后会直接进入已支付/待制作。',
					[ORDER_STATUS.PAID_WAIT_MAKE]: '当前版本为线下确认支付，暂不展示微信支付入口。',
					[ORDER_STATUS.MAKING]: '蛋糕正在制作中，完成后会按自提或配送流程继续履约。',
					[ORDER_STATUS.WAIT_PICKUP]: '蛋糕已制作完成，请按预约时间到店自提。',
					[ORDER_STATUS.WAIT_DELIVERY]: '蛋糕已制作完成，等待商家安排配送。',
					[ORDER_STATUS.DELIVERING]: '蛋糕正在配送途中，请保持联系电话畅通。',
					[ORDER_STATUS.COMPLETED]: '订单已完成，如有问题可在订单完成后 3 天内提交售后反馈。',
					[ORDER_STATUS.CANCELED]: `订单已取消${order.cancelReason ? `，原因：${order.cancelReason}` : ''}`,
					[ORDER_STATUS.REFUNDING]: '订单退款处理中，请耐心等待。',
					[ORDER_STATUS.REFUNDED]: '订单已退款，可重新选择喜欢的款式下单。'
				}

				return descriptionMap[order.status] || '请以订单状态和商家联系结果为准。'
			},
			previewImage(current) {
				if (!this.order.referenceImages.length) {
					return
				}

				uni.previewImage({
					current,
					urls: this.order.referenceImages
				})
			},
			previewAfterSaleImage(current) {
				const images = this.order && this.order.afterSale && this.order.afterSale.images
				if (!images || !images.length) {
					return
				}
				uni.previewImage({
					current,
					urls: images
				})
			},
			goAfterSale() {
				uni.navigateTo({ url: `/pages/mine/after-sale?orderId=${this.order.id}` })
			},
			async handleAction(action) {
				if (action === ORDER_ACTIONS.CANCEL) {
					const isPaidOrder = this.order.status === ORDER_STATUS.PAID_WAIT_MAKE
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
						await cancelOrder(this.order.id)
						uni.showToast({ title: '订单已取消', icon: 'success' })
						this.loadOrder()
					} catch (error) {
						uni.showToast({ title: error.message || '取消失败，请稍后重试', icon: 'none' })
					}
					return
				}

				if (action === ORDER_ACTIONS.AFTER_SALE) {
					uni.navigateTo({ url: `/pages/mine/after-sale?orderId=${this.order.id}` })
					return
				}

				uni.navigateTo({ url: `/pages/order/customize?source=REBUY&buyPound=${this.order.buyPound}&flavor=${encodeURIComponent(this.order.flavor || '原味')}&theme=${encodeURIComponent(this.order.theme || '成人')}&blessingText=${encodeURIComponent(this.order.blessingText || '')}&categoryId=${this.order.categoryId || ''}` })
		}
		}
	}
</script>

<style lang="scss">
.detail-page {
	min-height: 100vh;
	padding: 32rpx 32rpx 150rpx;
	background: #f6f1ed;
}

/* ── 状态卡片 — Mondrian 粗侧边条 + 右上色块 ── */
.status-card,
.card {
	margin-bottom: 24rpx;
	padding: 28rpx;
	border-radius: 24rpx;
	background: #fff;
	box-shadow: 0 16rpx 40rpx rgba(26, 21, 18, 0.08);
	position: relative;
	overflow: hidden;
}

.status-card {
	border-left: 8rpx solid #d95c33;
	background: rgba(217, 92, 51, 0.03);
}

/* 右上角蓝色小色块 */
.status-card::after {
	content: '';
	position: absolute;
	top: -16rpx;
	right: -16rpx;
	width: 64rpx;
	height: 64rpx;
	background: rgba(45, 95, 191, 0.08);
	transform: rotate(45deg);
}

.status-label,
.section-title {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	letter-spacing: 0.5rpx;
	color: #2d2521;
}

.status-value {
	display: block;
	margin-top: 10rpx;
	font-size: 40rpx;
	font-weight: 900;
	color: #d95c33;
	position: relative;
	z-index: 1;
}

.status-desc {
	display: block;
	margin-top: 14rpx;
	font-size: 24rpx;
	line-height: 1.7;
	color: #7f604d;
	position: relative;
	z-index: 1;
}

.status-tag {
	display: inline-flex;
	margin-top: 18rpx;
	padding: 8rpx 18rpx;
	border-radius: 999rpx;
	background: rgba(45, 95, 191, 0.08);
	font-size: 22rpx;
	color: #2d5fbf;
	position: relative;
	z-index: 1;
}

/* ── 进度条 — Mondrian 三色同心圆 ── */
.progress-list {
	margin-top: 20rpx;
}

.progress-item {
	display: flex;
	gap: 18rpx;
	padding: 0 0 28rpx;
}

.progress-item:last-child {
	padding-bottom: 0;
}

.progress-dot {
	position: relative;
	width: 24rpx;
	height: 24rpx;
	margin-top: 6rpx;
	border-radius: 50%;
	background: #e2d4c7;
	flex-shrink: 0;
}

/* 活跃态 — 三色同心圆 */
.progress-item.active .progress-dot,
.progress-item.current .progress-dot {
	background: #d95c33;
	box-shadow:
		0 0 0 4rpx rgba(45, 95, 191, 0.15),
		0 0 0 8rpx rgba(232, 184, 48, 0.10);
}

/* 进度线 — 活跃段暖橘实线 */
.progress-item:not(:last-child) .progress-dot::after {
	content: '';
	position: absolute;
	left: 50%;
	top: 28rpx;
	width: 4rpx;
	height: calc(100% + 34rpx);
	transform: translateX(-50%);
	background: #e2d4c7;
}

.progress-item.active:not(:last-child) .progress-dot::after,
.progress-item.current:not(:last-child) .progress-dot::after {
	background: #d95c33;
}

.progress-main {
	flex: 1;
	padding-bottom: 4rpx;
	border-bottom: 1rpx solid #f0e4d8;
}

.progress-item:last-child .progress-main {
	border-bottom: 0;
}

.progress-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
}

.progress-title {
	font-size: 28rpx;
	font-weight: 700;
	color: #5c4030;
}

.progress-time,
.progress-desc {
	font-size: 24rpx;
	color: #8b6d5c;
}

.progress-desc {
	display: block;
	margin-top: 10rpx;
	line-height: 1.7;
}

.reference-block {
	padding-top: 18rpx;
}

.reference-label {
	display: block;
	font-size: 26rpx;
	color: #5d4332;
}

.reference-list {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	margin-top: 18rpx;
}

.reference-image {
	width: 156rpx;
	height: 156rpx;
	border-radius: 18rpx;
	background: #f3e2d4;
}

/* ── 商品卡片 — 图片左侧蓝色竖线 ── */
.product-card {
	display: flex;
	gap: 18rpx;
}

.product-image {
	width: 180rpx;
	height: 180rpx;
	border-radius: 20rpx;
	background: #f3e2d4;
	border-left: 6rpx solid #2d5fbf;
}

.product-main {
	flex: 1;
}

.product-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: #2d2521;
}

.product-meta {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	color: #846959;
}

/* ── 信息列表 — Mondrian 非对称分隔线 ── */
.info-list {
	margin-top: 16rpx;
}

.info-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 18rpx 0;
	font-size: 26rpx;
	color: #5d4332;
	position: relative;
}

/* 非对称分隔 — 仅在行右侧 40% 处出现 */
.info-row::after {
	content: '';
	position: absolute;
	bottom: 0;
	right: 0;
	width: 40%;
	height: 3rpx;
	background: rgba(26, 21, 18, 0.08);
	border-radius: 2rpx;
}

.info-row:last-child::after {
	display: none;
}

.top-align {
	align-items: flex-start;
}

.multiline {
	max-width: 420rpx;
	text-align: right;
	line-height: 1.6;
}

.after-sale-status {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 16rpx;
}

.after-sale-badge {
	padding: 10rpx 22rpx;
	border-radius: 999rpx;
	background: rgba(232, 184, 48, 0.12);
	font-size: 24rpx;
	font-weight: 600;
	color: #8a6a20;
}

.after-sale-time {
	font-size: 24rpx;
	color: #8b6d5c;
}

.after-sale-action {
	margin-top: 20rpx;
	padding: 14rpx 0;
	border-radius: 999rpx;
	background: rgba(45, 95, 191, 0.06);
	text-align: center;
	font-size: 24rpx;
	font-weight: 600;
	color: #2d5fbf;
}

.total-row {
	font-weight: 700;
	color: #d95c33;
}

/* ── 底部操作栏 — 多按钮色彩区分 ── */
.bottom-actions {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	gap: 14rpx;
	padding: 24rpx 24rpx 34rpx;
	background: rgba(255, 255, 255, 0.97);
	backdrop-filter: blur(10rpx);
	box-shadow: 0 -10rpx 24rpx rgba(26, 21, 18, 0.08);
}

.bottom-btn {
	flex: 1;
	height: 88rpx;
	border-radius: 999rpx;
	text-align: center;
	line-height: 88rpx;
	font-size: 28rpx;
	font-weight: 800;
	letter-spacing: 1rpx;
}

.bottom-btn:nth-child(1) {
	background: rgba(26, 21, 18, 0.06);
	color: #6b5b52;
}

.bottom-btn:nth-child(2) {
	background: rgba(45, 95, 191, 0.08);
	color: #2d5fbf;
}

.bottom-btn:nth-child(3) {
	background: #d95c33;
	color: #fff;
}

/* 单个按钮时回退到暖橘 */
.bottom-btn:only-child {
	background: #d95c33;
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
