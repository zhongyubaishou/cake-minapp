import { PRODUCT_IMAGE_FALLBACK } from '@/constants/app'

function pickValue(source, keys, fallback = '') {
	for (let index = 0; index < keys.length; index += 1) {
		const key = keys[index]
		if (source && source[key] !== null && typeof source[key] !== 'undefined') {
			return source[key]
		}
	}

	return fallback
}

function parseStringArray(value, fallback = []) {
	if (Array.isArray(value)) {
		return value
	}

	if (typeof value === 'string') {
		const text = value.trim()
		if (!text) {
			return fallback
		}

		try {
			const parsed = JSON.parse(text)
			return Array.isArray(parsed) ? parsed : fallback
		} catch (error) {
			return text.split(',').map((item) => item.trim()).filter(Boolean)
		}
	}

	return fallback
}

function normalizeProductBase(item = {}) {
	return {
		id: pickValue(item, ['id', 'productId']),
		categoryId: pickValue(item, ['categoryId', 'category_id'], ''),
		name: pickValue(item, ['name', 'productName'], '未命名商品'),
		description: pickValue(item, ['description', 'intro'], ''),
		imageUrl: pickValue(item, ['imageUrl', 'image', 'coverUrl'], PRODUCT_IMAGE_FALLBACK),
		basePrice: Number(pickValue(item, ['basePrice', 'base_price'], 0)) || 0,
		pricePerPound: Number(pickValue(item, ['pricePerPound', 'price_per_pound'], 0)) || 0,
		defaultPound: Number(pickValue(item, ['defaultPound', 'default_pound'], 2)) || 2,
		tags: parseStringArray(pickValue(item, ['tags'], []), [])
	}
}

export function normalizeProductList(list = []) {
	return Array.isArray(list)
		? list.map((item) => ({
			...normalizeProductBase(item),
			pounds: parseStringArray(pickValue(item, ['pounds', 'availablePounds', 'available_pounds'], []), []),
			defaultFlavor: pickValue(item, ['defaultFlavor', 'default_flavor'], '原味')
		}))
		: []
}

export function normalizeProductDetail(detail = {}) {
	const product = normalizeProductBase(detail)
	const pounds = parseStringArray(pickValue(detail, ['pounds', 'availablePounds', 'available_pounds'], []), [])
	const flavors = parseStringArray(pickValue(detail, ['flavors', 'availableFlavors', 'available_flavors'], []), ['原味'])
	const themes = parseStringArray(pickValue(detail, ['themes', 'availableThemes', 'available_themes'], []), ['成人'])

	return {
		...product,
		pounds: pounds.length ? pounds.map((item) => Number(item) || item) : [product.defaultPound],
		flavors,
		themes
	}
}
