import { PRODUCT_IMAGE_FALLBACK } from '@/constants/app'

const FAVORITE_STORAGE_KEY = 'mock_favorite_ids'

const mockCasesData = [
	{
		id: 201,
		name: '梦幻公主城堡蛋糕',
		imageUrl: PRODUCT_IMAGE_FALLBACK,
		images: [PRODUCT_IMAGE_FALLBACK],
		theme: '儿童',
		description: '双层城堡造型，粉紫色调，适合小公主的生日派对。顶部装饰皇冠与魔法棒，侧边点缀花朵与蝴蝶结。',
		tags: ['造型款', '儿童', '主题', '热门'],
		isFavorited: false
	},
	{
		id: 202,
		name: '简约森系花环蛋糕',
		imageUrl: PRODUCT_IMAGE_FALLBACK,
		images: [PRODUCT_IMAGE_FALLBACK],
		theme: '成人',
		description: '奶油原色基底，搭配新鲜水果与可食用花环装饰。风格清新自然，适合生日、纪念日等场景。',
		tags: ['鲜花', '成人', '简约', '推荐'],
		isFavorited: false
	},
	{
		id: 203,
		name: '中国风寿桃蛋糕',
		imageUrl: PRODUCT_IMAGE_FALLBACK,
		images: [PRODUCT_IMAGE_FALLBACK],
		theme: '老人',
		description: '寿桃造型搭配传统纹样，适合长辈寿宴。可选低糖配方，口感松软不腻。',
		tags: ['老人', '寿宴', '传统', '低糖'],
		isFavorited: false
	},
	{
		id: 204,
		name: '星空宇航员主题蛋糕',
		imageUrl: PRODUCT_IMAGE_FALLBACK,
		images: [PRODUCT_IMAGE_FALLBACK],
		theme: '儿童',
		description: '深蓝星空渐变底色，搭配翻糖宇航员与星球装饰。满足小朋友对宇宙的想象。',
		tags: ['造型款', '儿童', '男孩', '热门'],
		isFavorited: false
	},
	{
		id: 205,
		name: '复古玫瑰奶油蛋糕',
		imageUrl: PRODUCT_IMAGE_FALLBACK,
		images: [PRODUCT_IMAGE_FALLBACK],
		theme: '成人',
		description: '韩式裱花风格，多色玫瑰造型覆盖顶部。可搭配定制祝福牌，适合告白与纪念日。',
		tags: ['裱花', '成人', '纪念日', '推荐'],
		isFavorited: false
	},
	{
		id: 206,
		name: '圣诞主题雪景蛋糕',
		imageUrl: PRODUCT_IMAGE_FALLBACK,
		images: [PRODUCT_IMAGE_FALLBACK],
		theme: '节日',
		description: '雪景场景造型，糖霜雪松与翻糖雪人装饰。节日氛围十足，适合圣诞聚会。',
		tags: ['节日', '圣诞', '场景', '季节限时'],
		isFavorited: false
	},
	{
		id: 207,
		name: '渐变花束蛋糕',
		imageUrl: PRODUCT_IMAGE_FALLBACK,
		images: [PRODUCT_IMAGE_FALLBACK],
		theme: '成人',
		description: '从深到浅的花瓣渐变效果，如捧花般精致。适合送给妈妈、女友等特殊的人。',
		tags: ['裱花', '成人', '送花', '推荐'],
		isFavorited: false
	},
	{
		id: 208,
		name: '童趣动物园蛋糕',
		imageUrl: PRODUCT_IMAGE_FALLBACK,
		images: [PRODUCT_IMAGE_FALLBACK],
		theme: '儿童',
		description: '小动物造型集合，长颈鹿、小象、小狮子等可爱动物环绕蛋糕。色彩明亮活泼。',
		tags: ['造型款', '儿童', '动物', '热门'],
		isFavorited: false
	},
	{
		id: 209,
		name: '素雅白色婚礼蛋糕',
		imageUrl: PRODUCT_IMAGE_FALLBACK,
		images: [PRODUCT_IMAGE_FALLBACK],
		theme: '成人',
		description: '纯白奶油裱花三层设计，点缀珍珠糖粒与淡雅蕾丝纹样。适合小型婚礼或求婚场景。',
		tags: ['婚礼', '成人', '精致', '高端'],
		isFavorited: false
	},
	{
		id: 210,
		name: '新年团圆蛋糕',
		imageUrl: PRODUCT_IMAGE_FALLBACK,
		images: [PRODUCT_IMAGE_FALLBACK],
		theme: '节日',
		description: '红色喜庆主题，搭配"福"字糖牌与金色装饰。适合春节家庭团聚。',
		tags: ['节日', '春节', '传统', '全家'],
		isFavorited: false
	}
]

function getFavoriteIds() {
	try {
		const raw = uni.getStorageSync(FAVORITE_STORAGE_KEY)
		return Array.isArray(raw) ? raw.map(Number) : []
	} catch (_) {
		return []
	}
}

function setFavoriteIds(ids) {
	try {
		uni.setStorageSync(FAVORITE_STORAGE_KEY, ids.map(Number))
	} catch (_) {
		// 静默失败，storage 写入失败不影响页面操作
	}
}

function syncFavoriteFlags() {
	const favoriteIds = getFavoriteIds()
	mockCasesData.forEach((item) => {
		item.isFavorited = favoriteIds.includes(Number(item.id))
	})
}

syncFavoriteFlags()

export function setFavorite(caseId, isFavorited) {
	const favoriteIds = getFavoriteIds()
	const numericId = Number(caseId)
	const updated = isFavorited
		? [...new Set([...favoriteIds, numericId])]
		: favoriteIds.filter((id) => id !== numericId)
	setFavoriteIds(updated)

	const caseItem = mockCasesData.find((item) => Number(item.id) === numericId)
	if (caseItem) {
		caseItem.isFavorited = isFavorited
	}
}

export { mockCasesData as mockCases }

export function getMockCaseList(params) {
	const { theme, page = 1, pageSize = 10 } = params || {}
	let list = [...mockCasesData]

	if (theme) {
		list = list.filter((item) => item.theme === theme)
	}

	const start = (page - 1) * pageSize
	const end = start + pageSize

	return {
		list: list.slice(start, end),
		total: list.length,
		page,
		pageSize
	}
}

export function getMockCaseDetail(caseId) {
	return mockCasesData.find((item) => Number(item.id) === Number(caseId)) || null
}

export function getMockFavoritesList(params) {
	const { page = 1, pageSize = 10 } = params || {}
	const list = mockCasesData.filter((item) => item.isFavorited)
	const start = (page - 1) * pageSize
	const end = start + pageSize

	return {
		list: list.slice(start, end),
		total: list.length,
		page,
		pageSize
	}
}
