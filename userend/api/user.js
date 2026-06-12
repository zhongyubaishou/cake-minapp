import { request } from '@/utils/request'

export function login(data) {
	return request.post('/api/user/login', data)
}

export function bindPhone(data) {
	return request.post('/api/user/bind-phone', data)
}

export function getUserProfile() {
	return request.get('/api/user/profile')
}

export function updateProfile(data) {
	return request.put('/api/user/profile', data)
}
