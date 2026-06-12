import { getApiBaseUrlConfigError, MOCK_ENABLED, REQUEST_CONFIG, STORAGE_KEYS } from '@/constants/app'
import { clearUserStorage, getStorage } from '@/utils/storage'
import { tryMockRequest } from '@/mock/api-mock'
import { useUserStore } from '@/stores/user'

function buildURL(url) {
	const configError = getApiBaseUrlConfigError()
	if (configError) {
		throw new Error(configError)
	}

	if (/^https?:\/\//.test(url)) {
		return url
	}

	return `${REQUEST_CONFIG.baseURL}${url}`
}

function buildHeader(customHeader = {}) {
	const token = getStorage(STORAGE_KEYS.userToken, '')
	const header = Object.assign({}, REQUEST_CONFIG.header, customHeader)

	if (token) {
		header.Authorization = `Bearer ${token}`
	}

	return header
}

export function request(options) {
	const config = Object.assign(
		{
			url: '',
			method: 'GET',
			data: {},
			header: {}
		},
		options
	)

	// mock 隔离：仅开发模式启用，生产环境直接走真实请求
	if (MOCK_ENABLED) {
		const mockResult = tryMockRequest(config.method, config.url, config.data)
		if (mockResult) {
			return new Promise((resolve, reject) => {
				if (mockResult.code === 0) {
					resolve(mockResult.data)
				} else {
					const error = new Error(mockResult.message)
					error.code = mockResult.code
					reject(error)
				}
			})
		}
	}

	return new Promise((resolve, reject) => {
		let requestURL = ''

		try {
			requestURL = buildURL(config.url)
		} catch (error) {
			reject(error)
			return
		}

		uni.request({
			url: requestURL,
			method: config.method,
			data: config.data,
			header: buildHeader(config.header),
			timeout: REQUEST_CONFIG.timeout,
			success: (response) => {
				const result = response.data || {}

				if (result.code === 0) {
					resolve(result.data)
					return
				}

				if (result.code === 401) {
					useUserStore().clearSession()
				}

				console.error('[request:error]', requestURL, response.statusCode, result)
				const error = new Error(result.message || `请求失败，HTTP ${response.statusCode}`)
				error.code = result.code || response.statusCode
				reject(error)
			},
			fail: (error) => {
				console.error('[request:fail]', requestURL, error)
				reject(new Error(error.errMsg || '网络连接异常，请稍后重试'))
			}
		})
	})
}

request.get = function(url, data = {}, options = {}) {
	return request(Object.assign({}, options, { url, data, method: 'GET' }))
}

request.post = function(url, data = {}, options = {}) {
	return request(Object.assign({}, options, { url, data, method: 'POST' }))
}

request.put = function(url, data = {}, options = {}) {
	return request(Object.assign({}, options, { url, data, method: 'PUT' }))
}

request.delete = function(url, data = {}, options = {}) {
	return request(Object.assign({}, options, { url, data, method: 'DELETE' }))
}
