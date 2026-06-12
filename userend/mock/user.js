export function getMockLoginResult() {
	return {
		token: `dev-token-${Date.now()}`,
		userId: 1,
		hasPhone: false
	}
}

export function getMockUserProfile(hasPhone = false, phone = '') {
	return {
		id: 1,
		nickname: '演示用户',
		avatarUrl: '',
		phone: hasPhone ? phone || '13800138000' : '',
		hasPhone
	}
}
