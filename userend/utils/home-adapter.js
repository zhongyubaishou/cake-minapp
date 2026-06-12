import { PRODUCT_IMAGE_FALLBACK, STORE_INFO } from '@/constants/app'

function pickValue(source, keys, fallback = '') {
	for (let index = 0; index < keys.length; index += 1) {
		const key = keys[index]
		if (source && source[key] !== null && typeof source[key] !== 'undefined') {
			return source[key]
		}
	}

	return fallback
}

function normalizeCategory(item = {}) {
	return {
		id: pickValue(item, ['id', 'categoryId']),
		name: pickValue(item, ['name', 'categoryName'], '未命名分类')
	}
}

function normalizeProduct(item = {}) {
	return {
		id: pickValue(item, ['id', 'productId']),
		name: pickValue(item, ['name', 'productName'], '未命名商品'),
		imageUrl: pickValue(item, ['imageUrl', 'image', 'coverUrl'], PRODUCT_IMAGE_FALLBACK),
		basePrice: Number(pickValue(item, ['basePrice', 'base_price'], 0)) || 0,
		pricePerPound: Number(pickValue(item, ['pricePerPound', 'price_per_pound'], 0)) || 0,
		tags: Array.isArray(item.tags) ? item.tags : []
	}
}

export function normalizeCategories(list = []) {
	return Array.isArray(list) ? list.map(normalizeCategory) : []
}

export function normalizeHomeData(data = {}) {
	const store = pickValue(data, ['store'], {}) || {}

	return {
		store: {
			name: pickValue(store, ['name'], STORE_INFO.name),
			address: pickValue(store, ['address'], STORE_INFO.address),
			businessHours: pickValue(
				store,
				['businessHours', 'business_hours'],
				`${pickValue(store, ['businessHoursStart', 'business_hours_start'], '06:00')}-${pickValue(store, ['businessHoursEnd', 'business_hours_end'], '18:00')}`
			),
			deliveryRange: pickValue(store, ['deliveryRange', 'delivery_range'], `${STORE_INFO.deliveryRangeKm}km内配送 / 支持到店自提`),
			pricePerPound: Number(pickValue(store, ['pricePerPound', 'price_per_pound'], 0)) || 0,
			qrCodeUrl: pickValue(store, ['qrCodeUrl', 'qr_code_url'], '')
		},
		categories: normalizeCategories(pickValue(data, ['categories'], [])),
		hotProducts: Array.isArray(data.hotProducts) ? data.hotProducts.map(normalizeProduct) : [],
		caseCount: Number(pickValue(data, ['caseCount', 'case_count'], 0)) || 0
	}
}
