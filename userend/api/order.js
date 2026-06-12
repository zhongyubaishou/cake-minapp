import { request } from '@/utils/request'

export function calculateDelivery(data) {
	return request.post('/api/delivery/calculate', data)
}

export function createOrder(data) {
	return request.post('/api/orders', data)
}

export function getOrders(params) {
	return request.get('/api/orders', params)
}

export function getOrderDetail(orderId) {
	return request.get(`/api/orders/${orderId}`)
}

export function cancelOrder(orderId) {
	return request.post(`/api/orders/${orderId}/cancel`)
}

export function submitAfterSale(orderId, data) {
	return request.post(`/api/orders/${orderId}/after-sales`, data)
}
