import { getApiBaseUrlConfigError, REQUEST_CONFIG, STORAGE_KEYS } from '@/constants/app'
import { getStorage } from '@/utils/storage'
import { useUserStore } from '@/stores/user'

export function uploadFile({ filePath, bizType, name = 'file' }) {
	const token = getStorage(STORAGE_KEYS.userToken, '')
	const configError = getApiBaseUrlConfigError()
	if (configError) {
		return Promise.reject(new Error(configError))
	}

	const url = `${REQUEST_CONFIG.baseURL}/api/upload`

	return new Promise((resolve, reject) => {
		uni.uploadFile({
			url,
			filePath,
			name,
			formData: {
				bizType
			},
			header: token ? { Authorization: `Bearer ${token}` } : {},
			timeout: 30000,
			success: (response) => {
				let data = {}

				try {
					data = JSON.parse(response.data || '{}')
				} catch (error) {
					reject(new Error('上传响应异常'))
					return
				}

				if (data.code === 0) {
					resolve(data.data)
					return
				}

				// 401 时清除登录态，与 request.js 保持一致
				if (data.code === 401) {
					useUserStore().clearSession()
				}

				reject(new Error(data.message || '上传失败'))
			},
			fail: (error) => {
				reject(new Error(error.errMsg || '上传失败'))
			}
		})
	})
}
