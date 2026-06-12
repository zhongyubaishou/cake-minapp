import { getMockHomeData, getMockProductList, getMockProductDetail, mockCategories } from '@/mock/home'
import { getMockCaseList, getMockCaseDetail, getMockFavoritesList, setFavorite } from '@/mock/case'
import { getMockLoginResult, getMockUserProfile } from '@/mock/user'
import { getOrderById, getMockOrders, appendMockOrder, createMockOrderFromDraft, getOrderDraft, updateMockOrder } from '@/utils/order-draft'
import { ORDER_STATUS, ORDER_STATUS_TEXT } from '@/constants/order'
import { MOCK_ENABLED, PRODUCT_IMAGE_FALLBACK, STORE_INFO } from '@/constants/app'

/**
 * 快递费计算 mock 返回值
 * 使用用户传入的坐标或生成 mock 随机距离
 */
function getMockCalculateDeliveryResult(userLng, userLat) {
	const storeLng = STORE_INFO.lng || 114.95
	const storeLat = STORE_INFO.lat || 23.65
	const randomOffset = () => (Math.random() - 0.5) * 0.04
	const lng = Number(userLng) || (storeLng + randomOffset())
	const lat = Number(userLat) || (storeLat + randomOffset())
	const distanceKm = Math.sqrt((lng - storeLng) ** 2 + (lat - storeLat) ** 2) * 111
	const roundedDistance = Math.max(0.1, Math.round(distanceKm * 100) / 100)
	const inRange = roundedDistance <= STORE_INFO.deliveryRangeKm
	const deliveryFee = inRange ? 0 : Math.round((roundedDistance - STORE_INFO.deliveryRangeKm) * 3 * 100) / 100

	return {
		distanceKm: roundedDistance,
		deliveryFee,
		isInRange: inRange
	}
}

/**
 * 解析 URL 中的路径参数，例如 /api/orders/12345 → orderId = '12345'
 */
function parsePathParam(url, pattern) {
	const match = url.match(pattern)
	return match ? match[1] : ''
}

/**
 * Mock API 处理器映射表
 * 当真实后端不可达时，返回本地模拟数据
 */
const MOCK_HANDLERS = {
	'POST /api/delivery/calculate': (_, data) => {
		const userLng = data.longitude ?? data.userLng
		const userLat = data.latitude ?? data.userLat
		return getMockCalculateDeliveryResult(userLng, userLat)
	},

	'POST /api/orders': (_, data) => {
		const draft = getOrderDraft()
		if (!draft) {
			// 草稿过期时，用 API 载荷创建最小化 mock 订单
			const now = new Date()
			const orderId = now.getTime()
			const order = {
				id: orderId,
				orderNo: `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`,
				productName: '定制蛋糕',
				productImageUrl: PRODUCT_IMAGE_FALLBACK,
				categoryName: '定制蛋糕',
				appointmentTime: data.appointmentTime || '',
				pickupType: data.pickupType || 'SELF_PICKUP',
				pickupTypeText: data.pickupType === 'DELIVERY' ? '商家配送' : '到店自提',
				status: ORDER_STATUS.WAIT_ACCEPT,
				statusText: ORDER_STATUS_TEXT[ORDER_STATUS.WAIT_ACCEPT],
				productAmount: '待商家确认',
				deliveryFee: data.pickupType === 'DELIVERY' ? 0 : 0,
				totalAmount: '待商家确认',
				buyPound: data.buyPound || 2,
				actualMakePound: Number(data.buyPound || 2) * 1.5,
				flavor: data.flavor || '原味',
				theme: data.theme || '生日',
				blessingText: data.blessingText || '',
				plateCount: data.plateCount || 1,
				candleCount: data.candleCount || 1,
				referenceImages: data.referenceImages || [],
				address: data.address || '',
				distanceKm: data.distanceKm || null,
				addressLng: data.addressLng || null,
				addressLat: data.addressLat || null,
				userRemark: data.userRemark || '',
				phone: data.receiverPhone || '',
				createdAt: now.toISOString()
			}
			appendMockOrder(order)
			return {
				orderId: order.id,
				orderNo: order.orderNo,
				status: ORDER_STATUS.WAIT_ACCEPT,
				statusText: ORDER_STATUS_TEXT[ORDER_STATUS.WAIT_ACCEPT],
				createdAt: order.createdAt
			}
		}
		const mockOrder = createMockOrderFromDraft(draft)
		appendMockOrder(mockOrder)
		return {
			orderId: mockOrder.id,
			orderNo: mockOrder.orderNo,
			status: ORDER_STATUS.WAIT_ACCEPT,
			statusText: ORDER_STATUS_TEXT[ORDER_STATUS.WAIT_ACCEPT],
			createdAt: mockOrder.createdAt
		}
	},

	'GET /api/orders': () => {
		return {
			list: getMockOrders(),
			total: getMockOrders().length,
			page: 1,
			pageSize: 20
		}
	},

	// 订单详情 mock
	// URL pattern: /api/orders/{orderId}
	'GET /api/orders/:id': (url) => {
		const orderId = parsePathParam(url, /\/api\/orders\/(\d+)/)
		const order = getOrderById(orderId)
		if (!order) {
			const err = new Error('订单不存在')
			err.code = 404
			throw err
		}
		return order
	},

	// 取消订单 mock
	// URL pattern: /api/orders/{orderId}/cancel
	'POST /api/orders/:id/cancel': (url) => {
		const orderId = parsePathParam(url, /\/api\/orders\/(\d+)\/cancel/)
		const order = getOrderById(orderId)
		if (!order) {
			const err = new Error('订单不存在')
			err.code = 404
			throw err
		}
		if (order.status !== ORDER_STATUS.WAIT_ACCEPT && order.status !== ORDER_STATUS.PAID_WAIT_MAKE) {
			const err = new Error('当前订单状态不支持取消')
			err.code = 409
			throw err
		}
		updateMockOrder(orderId, {
			status: ORDER_STATUS.CANCELED,
			statusText: ORDER_STATUS_TEXT[ORDER_STATUS.CANCELED]
		})
		return { success: true }
	},

	// 首页数据 mock
	'GET /api/home': () => {
		return getMockHomeData()
	},

	// 分类列表 mock
	'GET /api/categories': () => {
		return mockCategories
	},

	// 商品列表 mock
	'GET /api/products': (url, data) => {
		return getMockProductList(data && data.categoryId)
	},

	// 商品详情 mock
	'GET /api/products/:id': (url) => {
		const productId = parsePathParam(url, /\/api\/products\/(\d+)/)
		return getMockProductDetail(productId)
	},

	// 案例列表 mock
	'GET /api/cases': (url, data) => {
		return getMockCaseList(data)
	},

	// 案例详情 mock
	// URL pattern: /api/cases/{caseId}
	'GET /api/cases/:id': (url) => {
		const caseId = parsePathParam(url, /\/api\/cases\/(\d+)/)
		const caseItem = getMockCaseDetail(caseId)
		if (!caseItem) {
			const err = new Error('案例不存在')
			err.code = 404
			throw err
		}
		return caseItem
	},

	// 收藏案例 mock
	// URL pattern: /api/cases/{caseId}/favorite
	'POST /api/cases/:id/favorite': (url) => {
		const caseId = parsePathParam(url, /\/api\/cases\/(\d+)\/favorite/)
		const caseItem = getMockCaseDetail(caseId)
		if (!caseItem) {
			const err = new Error('案例不存在')
			err.code = 404
			throw err
		}
		setFavorite(caseId, true)
		return { success: true, isFavorited: true }
	},

	// 取消收藏 mock
	// URL pattern: /api/cases/{caseId}/favorite
	'DELETE /api/cases/:id/favorite': (url) => {
		const caseId = parsePathParam(url, /\/api\/cases\/(\d+)\/favorite/)
		const caseItem = getMockCaseDetail(caseId)
		if (!caseItem) {
			const err = new Error('案例不存在')
			err.code = 404
			throw err
		}
		setFavorite(caseId, false)
		return { success: true, isFavorited: false }
	},

	// 我的收藏列表 mock
	'GET /api/user/favorites': (url, data) => {
		return getMockFavoritesList(data)
	},

	// 提交售后反馈 mock
	// URL pattern: /api/orders/{orderId}/after-sales
	'POST /api/orders/:id/after-sales': (url, data) => {
		const orderId = parsePathParam(url, /\/api\/orders\/(\d+)\/after-sales/)
		const order = getOrderById(orderId)
		if (!order) {
			const err = new Error('订单不存在')
			err.code = 404
			throw err
		}
		if (order.status !== ORDER_STATUS.COMPLETED) {
			const err = new Error('仅已完成订单可提交售后')
			err.code = 409
			throw err
		}
		const now = new Date()
		if (order.completedAt) {
			const completedDate = new Date(order.completedAt)
			const daysDiff = (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24)
			if (daysDiff > 3) {
				const err = new Error('售后入口已关闭（已完成超过 3 天）')
				err.code = 409
				throw err
			}
		}
		const afterSaleRecord = {
			id: now.getTime(),
			description: data.description || '',
			images: data.images || [],
			status: 'SUBMITTED',
			statusText: '已提交，待处理',
			createdAt: now.toISOString()
		}
		updateMockOrder(orderId, { afterSale: afterSaleRecord })
		return { success: true, afterSale: afterSaleRecord }
	},

	// 用户登录 mock
	'POST /api/user/login': () => {
		return getMockLoginResult()
	},

	// 用户资料 mock
	'GET /api/user/profile': () => {
		return getMockUserProfile()
	}
}

/**
 * 查找匹配的 mock handler
 * 支持精确匹配 (method + url) 和动态路径匹配 (如 /api/orders/:id)
 */
function findMockHandler(method, url) {
	const exactKey = `${method.toUpperCase()} ${url}`
	if (MOCK_HANDLERS[exactKey]) {
		return MOCK_HANDLERS[exactKey]
	}

	// 尝试动态路径匹配
	for (const key of Object.keys(MOCK_HANDLERS)) {
		if (!key.startsWith('/') && !key.startsWith('GET /') && !key.startsWith('POST /') && !key.startsWith('PUT /') && !key.startsWith('DELETE /')) {
			continue
		}

		const keyMethod = key.split(' ')[0]
		const keyUrl = key.split(' ').slice(1).join(' ')

		if (keyMethod !== method.toUpperCase()) {
			continue
		}

		// Check if the key URL pattern matches the actual URL
		const keyPattern = keyUrl.replace(/(\/:id|:\w+)/g, '[^/]+').replace(/\//g, '\\/')
		const regex = new RegExp(`^${keyPattern}(\\/.*)?$`)
		if (regex.test(url)) {
			return MOCK_HANDLERS[key]
		}
	}

	return null
}

/**
 * 通过 mock 数据模拟 HTTP 响应
 * 返回符合统一响应格式的数据
 */
function mockResponse(handler, url, data) {
	try {
		const result = handler(url, data)
		return {
			code: 0,
			message: 'success',
			data: result
		}
	} catch (error) {
		return {
			code: error.code || 500,
			message: error.message || 'Mock 服务异常',
			data: null
		}
	}
}

/**
 * 判断当前环境是否应使用 mock 数据
 * 发展开发环境统一启用 mock，便于离线开发和调试
 */
function shouldUseMock() {
	if (!MOCK_ENABLED) {
		return false
	}

	// #ifdef MP-WEIXIN
	try {
		const accountInfo = uni.getAccountInfoSync && uni.getAccountInfoSync()
		const envVersion = accountInfo && accountInfo.miniProgram && accountInfo.miniProgram.envVersion
		if (envVersion === 'release') {
			return false
		}
	} catch (_) {
		// 开发阶段默认开启
	}
	// #endif

	return true
}

/**
 * 处理一个 API 调用 — 如果 mock 模式开启且存在对应 handler，直接返回 mock 数据
 * 否则返回 null（由调用方走真实请求）
 */
export function tryMockRequest(method, url, data) {
	if (!shouldUseMock()) {
		return null
	}

	const handler = findMockHandler(method, url)
	if (!handler) {
		return null
	}

	console.log(`[mock] ${method.toUpperCase()} ${url}`)
	return mockResponse(handler, url, data)
}
