import { reactive } from 'vue'
import { STORAGE_KEYS } from '@/constants/app'
import { clearUserStorage, getStorage, setStorage } from '@/utils/storage'

const state = reactive({
	token: getStorage(STORAGE_KEYS.userToken, ''),
	profile: getStorage(STORAGE_KEYS.userProfile, null),
	hasPhone: getStorage(STORAGE_KEYS.hasPhone, false),
	nickname: getStorage(STORAGE_KEYS.userNickname, ''),
	avatar: getStorage(STORAGE_KEYS.userAvatar, '')
})

export function useUserStore() {
	function setToken(token) {
		state.token = token || ''
		setStorage(STORAGE_KEYS.userToken, state.token)
	}

	function setProfile(profile) {
		state.profile = profile || null
		setStorage(STORAGE_KEYS.userProfile, state.profile)
	}

	function setHasPhone(hasPhone) {
		state.hasPhone = Boolean(hasPhone)
		setStorage(STORAGE_KEYS.hasPhone, state.hasPhone)
	}

	function setNickname(nickname) {
		state.nickname = nickname || ''
		setStorage(STORAGE_KEYS.userNickname, state.nickname)
	}

	function setAvatar(avatar) {
		state.avatar = avatar || ''
		setStorage(STORAGE_KEYS.userAvatar, state.avatar)
	}

	/**
	 * 登录成功后调用，同步微信用户信息到 store 并持久化
	 * @param {{ nickName?: string; avatarUrl?: string }} wxUserInfo
	 */
	function setWxUserInfo(wxUserInfo = {}) {
		if (wxUserInfo.nickName) {
			setNickname(wxUserInfo.nickName)
		}
		if (wxUserInfo.avatarUrl) {
			setAvatar(wxUserInfo.avatarUrl)
		}
	}

	/**
	 * fetchProfile 后调用，将服务端最新 profile 同步到 store 独立字段
	 */
	function syncProfileToStore(profile) {
		if (!profile) return
		if (profile.nickname) {
			setNickname(profile.nickname)
		}
		if (profile.avatarUrl) {
			setAvatar(profile.avatarUrl)
		}
	}

	function setSession(payload = {}) {
		setToken(payload.token)
		setHasPhone(payload.hasPhone)
		// 登录响应中可能已包含服务端解密的微信昵称/头像
		if (payload.nickName) setNickname(payload.nickName)
		if (payload.avatarUrl) setAvatar(payload.avatarUrl)
	}

	function clearSession() {
		state.token = ''
		state.profile = null
		state.hasPhone = false
		state.nickname = ''
		state.avatar = ''
		clearUserStorage()
	}

	function isLoggedIn() {
		return Boolean(state.token)
	}

	return {
		state,
		setToken,
		setProfile,
		setHasPhone,
		setNickname,
		setAvatar,
		setWxUserInfo,
		syncProfileToStore,
		setSession,
		clearSession,
		isLoggedIn
	}
}
