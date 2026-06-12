import { DRAFT_STORAGE_KEYS } from '@/constants/draft'
import { ORDER_STATUS, ORDER_STATUS_TEXT, PICKUP_TYPE_TEXT } from '@/constants/order'
import { PRODUCT_IMAGE_FALLBACK } from '@/constants/app'
import { getStorage, setStorage } from '@/utils/storage'

export function saveOrderDraft(draft) {
	return setStorage(DRAFT_STORAGE_KEYS.orderDraft, draft)
}

export function getOrderDraft() {
	return getStorage(DRAFT_STORAGE_KEYS.orderDraft, null)
}

export function clearOrderDraft() {
	uni.removeStorageSync(DRAFT_STORAGE_KEYS.orderDraft)
}

export function getMockOrders() {
	return getStorage(DRAFT_STORAGE_KEYS.orderList, [])
}

export function createMockOrderFromDraft(draft) {
	const now = new Date()
	const orderId = now.getTime()
	const orderNo = `${now.getFullYear()}${`${now.getMonth() + 1}`.padStart(2, '0')}${`${now.getDate()}`.padStart(2, '0')}${`${now.getHours()}`.padStart(2, '0')}${`${now.getMinutes()}`.padStart(2, '0')}${`${now.getSeconds()}`.padStart(2, '0')}`
	const deliveryFee = draft.pickupType === 'DELIVERY' ? Number(draft.deliveryFee || 0) : 0
	const distanceKm = draft.pickupType === 'DELIVERY'
		? (draft.distanceKm ?? draft.deliveryDistanceKm ?? null)
		: null
	const addressLng = draft.pickupType === 'DELIVERY' ? draft.addressLng || null : null
	const addressLat = draft.pickupType === 'DELIVERY' ? draft.addressLat || null : null

	return {
		id: orderId,
		orderNo,
		productName: draft.productName || '定制蛋糕',
		productImageUrl: draft.productImageUrl || PRODUCT_IMAGE_FALLBACK,
		categoryName: draft.categoryName || '定制蛋糕',
		appointmentTime: draft.appointmentTime,
		pickupType: draft.pickupType,
		pickupTypeText: PICKUP_TYPE_TEXT[draft.pickupType] || '到店自提',
		status: ORDER_STATUS.WAIT_ACCEPT,
		statusText: ORDER_STATUS_TEXT[ORDER_STATUS.WAIT_ACCEPT],
		productAmount: '待商家确认',
		deliveryFee,
		totalAmount: '待商家确认',
		buyPound: draft.buyPound,
		actualMakePound: draft.actualMakePound || Number(draft.buyPound || 0) * 1.5,
		flavor: draft.flavor,
		theme: draft.theme,
		blessingText: draft.blessingText,
		plateCount: draft.plateCount,
		candleCount: draft.candleCount,
		referenceImages: draft.referenceImages || [],
		address: draft.address || '',
		distanceKm,
		addressLng,
		addressLat,
		userRemark: draft.userRemark || '',
		phone: draft.phone || '',
		createdAt: now.toISOString()
	}
}

export function appendMockOrder(order) {
	const orders = getMockOrders()
	orders.unshift(order)
	setStorage(DRAFT_STORAGE_KEYS.orderList, orders)
	return order
}

export function getOrderById(orderId) {
	const orders = getMockOrders()
	return orders.find((item) => String(item.id) === String(orderId)) || null
}

export function updateMockOrder(orderId, updater) {
	const orders = getMockOrders()
	const nextOrders = orders.map((item) => {
		if (String(item.id) !== String(orderId)) {
			return item
		}

		return typeof updater === 'function' ? updater(item) : Object.assign({}, item, updater)
	})

	setStorage(DRAFT_STORAGE_KEYS.orderList, nextOrders)
	return nextOrders.find((item) => String(item.id) === String(orderId)) || null
}
