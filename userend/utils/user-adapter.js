function pickValue(source, keys, fallback = '') {
	for (let index = 0; index < keys.length; index += 1) {
		const key = keys[index]
		if (source && source[key] !== null && typeof source[key] !== 'undefined') {
			return source[key]
		}
	}

	return fallback
}

export function normalizeUserProfile(profile = {}) {
	return {
		id: pickValue(profile, ['id', 'userId']),
		nickname: pickValue(profile, ['nickname', 'nickName', 'name'], '微信用户'),
		avatarUrl: pickValue(profile, ['avatarUrl', 'avatar', 'avatar_url'], ''),
		phone: pickValue(profile, ['phone', 'mobile'], '')
	}
}
