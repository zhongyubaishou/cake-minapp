import { request } from '@/utils/request'

export function getProducts(params) {
	return request.get('/api/products', params)
}

export function getProductDetail(productId) {
	return request.get(`/api/products/${productId}`)
}
