export const APP_NAME = '蛋糕定制'

// ============================================================
// API 域名配置
//
// 配置步骤：
//   1. 开发环境可使用本机或内网穿透地址
//   2. 测试环境通过 UNI_APP_TEST_API_BASE_URL 注入真实 HTTPS 域名
//   3. 生产环境通过 UNI_APP_PROD_API_BASE_URL 注入真实 HTTPS 域名
//   4. 在微信小程序后台将上述域名加入 request 合法域名白名单
//   5. 将 MOCK_ENABLED 改为 false
//
// 测试/生产环境未配置真实 HTTPS 域名时，请求会被主动阻断
// ============================================================

function getEnvValue(key) {
	return (typeof process !== 'undefined' && process.env && process.env[key]) || ''
}

const DEV_API_BASE_URL = getEnvValue('UNI_APP_DEV_API_BASE_URL') || 'http://192.168.152.219:3000'
const TEST_API_BASE_URL = getEnvValue('UNI_APP_TEST_API_BASE_URL')
const PROD_API_BASE_URL = getEnvValue('UNI_APP_PROD_API_BASE_URL')

function getNodeEnv() {
	return (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) || 'development'
}

function getMiniProgramEnv() {
	// #ifdef MP-WEIXIN
	try {
		const accountInfo = uni.getAccountInfoSync && uni.getAccountInfoSync()
		const envVersion = accountInfo && accountInfo.miniProgram && accountInfo.miniProgram.envVersion
		if (envVersion === 'trial') {
			return 'testing'
		}

		if (envVersion === 'release') {
			return 'production'
		}
	} catch (error) {
		console.warn('[env:detect:fail]', error)
	}
	// #endif

	return ''
}

export const CURRENT_ENV = getMiniProgramEnv() || (getNodeEnv() === 'production' ? 'production' : 'development')

const API_BASE_URL_MAP = {
	development: DEV_API_BASE_URL,
	testing: TEST_API_BASE_URL,
	production: PROD_API_BASE_URL
}

export const API_BASE_URL = API_BASE_URL_MAP[CURRENT_ENV] || ''

export const IS_DEV_MODE = CURRENT_ENV === 'development'
export const DEV_WECHAT_LOGIN_MOCK = IS_DEV_MODE && getEnvValue('UNI_APP_REAL_WECHAT_LOGIN') !== 'true'

// ============================================================
// Mock 开关（手动）
//
//   true  → 全部请求走本地 mock 数据（无需后端，离线开发）
//   false → 全部请求走真实 API（联调 / 提测 / 上线）
//
//   联调时改为 false，确保请求实际打到后端接口
// ============================================================

export const MOCK_ENABLED = false

// ============================================================
// 静态资源
// ============================================================

// 兜底图片：构建后打包到小程序包内，路径不受域名白名单限制
export const PRODUCT_IMAGE_FALLBACK = '/static/walk.jpg'

// ============================================================
// 门店信息
// ============================================================

export const STORE_INFO = {
	name: '蛋糕定制',
	address: '广东省河源市紫金县义容镇青溪信用社旁',
	businessHours: '06:00-18:00',
	deliveryRangeKm: 5,
	minAdvanceHours: 6
}

// ============================================================
// 请求配置
// ============================================================

function isPlaceholderDomain(url) {
	return /your-company\.com/.test(url || '')
}

export function getApiBaseUrlConfigError() {
	if (!API_BASE_URL) {
		return `当前${CURRENT_ENV}环境接口地址未配置`
	}

	if (currentEnvRequiresRealHttpsDomain()) {
		if (!/^https:\/\//.test(API_BASE_URL)) {
			return `当前${CURRENT_ENV}环境接口地址必须使用 HTTPS 域名`
		}

		if (isPlaceholderDomain(API_BASE_URL)) {
			return `当前${CURRENT_ENV}环境接口地址仍是占位域名，请先替换为真实公网 HTTPS 域名`
		}
	}

	return ''
}

function currentEnvRequiresRealHttpsDomain() {
	return CURRENT_ENV === 'testing' || CURRENT_ENV === 'production'
}

export const REQUEST_CONFIG = {
	baseURL: API_BASE_URL,
	timeout: 15000,
	header: {
		'Content-Type': 'application/json'
	}
}

export const STORAGE_KEYS = {
	userToken: 'user_token',
	userProfile: 'user_profile',
	hasPhone: 'user_has_phone',
	userNickname: 'user_nickname',
	userAvatar: 'user_avatar'
}
