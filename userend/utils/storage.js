import { STORAGE_KEYS } from '@/constants/app'

export function getStorage(key, fallbackValue = null) {
	try {
		const value = uni.getStorageSync(key)
		return value === '' || typeof value === 'undefined' ? fallbackValue : value
	} catch (error) {
		return fallbackValue
	}
}

export function setStorage(key, value) {
	uni.setStorageSync(key, value)
	return value
}

export function removeStorage(key) {
	uni.removeStorageSync(key)
}

export function clearUserStorage() {
	removeStorage(STORAGE_KEYS.userToken)
	removeStorage(STORAGE_KEYS.userProfile)
	removeStorage(STORAGE_KEYS.hasPhone)
	removeStorage(STORAGE_KEYS.userNickname)
	removeStorage(STORAGE_KEYS.userAvatar)
}
