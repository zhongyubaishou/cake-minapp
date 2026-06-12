import { request } from '@/utils/request'

export function getHomeData() {
	return request.get('/api/home')
}

export function getCategories() {
	return request.get('/api/categories')
}
