import { ORDER_STATUS_TEXT, PICKUP_TYPE_TEXT } from '@/constants/order'
import { PRODUCT_IMAGE_FALLBACK, API_BASE_URL } from '@/constants/app'

export function formatPrice(value) {
	const amount = Number(value || 0)
	return amount.toFixed(2)
}

export function formatDistance(distanceKm) {
	if (distanceKm === null || typeof distanceKm === 'undefined' || distanceKm === '') {
		return '--'
	}

	const value = Number(distanceKm)
	if (Number.isNaN(value)) {
		return '--'
	}

	return value < 1 ? `${Math.round(value * 1000)}m` : `${value.toFixed(2)}km`
}

export function formatDateTime(value) {
	if (!value) {
		return '--'
	}

	const date = new Date(value)
	if (Number.isNaN(date.getTime())) {
		return value
	}

	const year = date.getFullYear()
	const month = `${date.getMonth() + 1}`.padStart(2, '0')
	const day = `${date.getDate()}`.padStart(2, '0')
	const hours = `${date.getHours()}`.padStart(2, '0')
	const minutes = `${date.getMinutes()}`.padStart(2, '0')

	return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function getOrderStatusText(status) {
	return ORDER_STATUS_TEXT[status] || '未知状态'
}

export function getPickupTypeText(type) {
	return PICKUP_TYPE_TEXT[type] || '未选择'
}

export function getImageOrFallback(url, fallback = PRODUCT_IMAGE_FALLBACK) {
	if (!url) return fallback
	if (/^https?:\/\//.test(url) || /^\/static\//.test(url)) return url
	return `${API_BASE_URL}${url}`
}
