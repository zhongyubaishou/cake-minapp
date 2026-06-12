import { request } from '@/utils/request'

export function getCases(params) {
	return request.get('/api/cases', params)
}

export function getCaseDetail(caseId) {
	return request.get(`/api/cases/${caseId}`)
}

export function favoriteCase(caseId) {
	return request.post(`/api/cases/${caseId}/favorite`)
}

export function unfavoriteCase(caseId) {
	return request.delete(`/api/cases/${caseId}/favorite`)
}

export function getFavorites(params) {
	return request.get('/api/user/favorites', params)
}
