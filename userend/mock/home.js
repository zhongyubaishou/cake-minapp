import { PRODUCT_IMAGE_FALLBACK, STORE_INFO } from '@/constants/app'

export const mockCategories = [
	{ id: 1, name: '生日蛋糕' },
	{ id: 2, name: '儿童蛋糕' },
	{ id: 3, name: '定制蛋糕' }
]

export const mockProducts = [
	{
		id: 101,
		categoryId: 1,
		name: '奶油星光生日蛋糕',
		imageUrl: PRODUCT_IMAGE_FALLBACK,
		basePrice: 88,
		pounds: [1, 2, 3, 4],
		defaultPound: 2,
		flavors: ['原味', '巧克力', '草莓'],
		themes: ['成人', '生日', '节日'],
		tags: ['现做', '可预约', '支持配送'],
		description: '适合生日聚会的经典奶油蛋糕，入口轻盈，支持祝福语定制。'
	},
	{
		id: 102,
		categoryId: 2,
		name: '童趣动物儿童蛋糕',
		imageUrl: PRODUCT_IMAGE_FALLBACK,
		basePrice: 108,
		pounds: [2, 3, 4],
		defaultPound: 2,
		flavors: ['原味', '香芋', '芒果'],
		themes: ['儿童', '生日'],
		tags: ['造型款', '可预约'],
		description: '面向儿童生日场景的趣味造型款，可按主题调整局部装饰。'
	},
	{
		id: 103,
		categoryId: 3,
		name: '轻复古鲜花定制蛋糕',
		imageUrl: PRODUCT_IMAGE_FALLBACK,
		basePrice: 128,
		pounds: [2, 3, 5],
		defaultPound: 2,
		flavors: ['原味', '抹茶', '伯爵红茶'],
		themes: ['成人', '节日', '老人'],
		tags: ['定制推荐', '支持参考图'],
		description: '支持参考图带入的鲜花风格蛋糕，更适合纪念日和轻定制场景。'
	}
]

export function getMockHomeData() {
	return {
		store: {
			name: STORE_INFO.name,
			address: STORE_INFO.address,
			businessHours: STORE_INFO.businessHours,
			deliveryRange: `${STORE_INFO.deliveryRangeKm}km内配送 / 支持到店自提`
		},
		categories: mockCategories,
		hotProducts: mockProducts,
		caseCount: 12
	}
}

export function getMockProductList(categoryId) {
	if (!categoryId) {
		return mockProducts
	}

	return mockProducts.filter((item) => Number(item.categoryId) === Number(categoryId))
}

export function getMockProductDetail(productId) {
	return mockProducts.find((item) => Number(item.id) === Number(productId)) || mockProducts[0]
}
