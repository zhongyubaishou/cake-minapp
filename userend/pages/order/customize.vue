<template>
	<scroll-view class="custom-page" scroll-y>
		<view class="step-progress">
			<view class="step-bar">
				<view class="step-fill" :style="{ width: stepPercent }"></view>
			</view>
			<view class="step-labels">
				<view v-for="(label, idx) in stepLabels" :key="idx" class="step-label" :class="{ active: step >= idx + 1, current: step === idx + 1 }">
					<view class="step-dot">{{ idx + 1 }}</view>
					<text>{{ label }}</text>
				</view>
			</view>
		</view>

		<view v-if="loadError" class="error-card">
			<text class="notice-title">页面加载失败</text>
			<text class="notice-desc">{{ loadError }}</text>
			<view class="retry-inline" @click="initializePage(queryOptions)">重新加载</view>
		</view>

		<block v-if="!loadError && step === 1">
		<view class="notice-card">
			<text class="notice-title">定制说明</text>
			<text class="notice-desc">提交需求后先进入待接单，商家接单后订单会直接进入制作流程。</text>
		</view>

		<view class="form-card source-card">
			<text class="section-title">下单来源</text>
			<text class="source-title">{{ sourceTitle }}</text>
			<text class="sub-note">{{ sourceHint }}</text>
		</view>

		<view class="form-card">
			<text class="section-title">蛋糕分类</text>
			<view class="option-row">
				<view
					v-for="item in categories"
					:key="item.id"
					class="option-chip"
					:class="{ active: Number(form.categoryId) === Number(item.id) }"
					@click="selectCategory(item.id)"
				>
					{{ item.name }}
				</view>
			</view>
		</view>

		<view class="form-card">
			<text class="section-title">磅数</text>
			<view class="option-row">
				<view v-for="item in poundOptions" :key="item" class="option-chip" :class="{ active: form.buyPound === item }" @click="selectPound(item)">
					{{ item }} 磅
				</view>
			</view>
			<text class="sub-note">实际制作：{{ actualMakePound }} 磅</text>
			<text v-if="form.pricePerPound > 0" class="price-hint">{{ priceHintText }}</text>
		</view>

		<view class="form-card">
			<text class="section-title">口味</text>
			<view class="option-row">
				<view v-for="item in flavorOptions" :key="item" class="option-chip" :class="{ active: form.flavor === item }" @click="form.flavor = item">
					{{ item }}
				</view>
			</view>
		</view>

		<view class="form-card">
			<text class="section-title">主题风格</text>
			<view class="option-row">
				<view v-for="item in themeOptions" :key="item" class="option-chip" :class="{ active: form.theme === item }" @click="form.theme = item">
					{{ item }}
				</view>
			</view>
		</view>

		<view class="form-card">
			<text class="section-title">祝福文字</text>
			<input class="text-input" v-model="form.blessingText" placeholder="例如：生日快乐，天天开心" />
		</view>

		<view class="form-card two-col-card">
			<view class="field-col">
				<text class="section-title">碟子数量</text>
				<input class="text-input" type="number" v-model="form.plateCount" placeholder="请输入数量" />
			</view>
			<view class="field-col">
				<text class="section-title">蜡烛数量</text>
				<input class="text-input" type="number" v-model="form.candleCount" placeholder="请输入数量" />
			</view>
		</view>

		<view class="step-bottom">
			<view class="submit-button" @click="nextStep">下一步 — 填写预约信息</view>
		</view>
		</block>

		<block v-if="!loadError && step === 2">
		<view class="form-card">
			<view class="section-row">
				<text class="section-title">参考图片</text>
				<text class="section-action" @click="chooseReferenceImage">{{ uploading ? '上传中...' : '上传图片' }}</text>
			</view>
			<text class="sub-note">最多上传 3 张，案例定制会自动带入案例图。</text>
			<view class="upload-row">
				<view v-for="(item, index) in form.referenceImages" :key="`${item}-${index}`" class="image-thumb">
					<image class="thumb-image" :src="item" mode="aspectFill"></image>
					<view class="thumb-remove" @click="removeReferenceImage(index)">删除</view>
				</view>
				<view v-if="form.referenceImages.length < 3" class="upload-box" @click="chooseReferenceImage">+ 上传图片</view>
			</view>
		</view>

		<view class="form-card">
			<text class="section-title">取货方式</text>
			<view class="option-row">
				<view class="option-chip" :class="{ active: form.pickupType === 'SELF_PICKUP' }" @click="changePickupType('SELF_PICKUP')">到店自提</view>
				<view class="option-chip" :class="{ active: form.pickupType === 'DELIVERY' }" @click="changePickupType('DELIVERY')">商家配送</view>
			</view>
		</view>

		<view class="form-card">
			<text class="section-title">预约时间</text>
			<view class="picker-row">
				<picker class="picker-item" mode="date" :value="appointmentDate" :start="minDate" @change="onDateChange">
					<view class="picker-display" :class="{ selected: appointmentDate }">
						{{ appointmentDate || '选择日期' }}
					</view>
				</picker>
				<picker class="picker-item" mode="time" :value="appointmentTime" start="06:00" end="18:00" @change="onTimeChange">
					<view class="picker-display" :class="{ selected: appointmentTime }">
						{{ appointmentTime || '选择时间' }}
					</view>
				</picker>
			</view>
			<text class="sub-note">蛋糕需至少提前 {{ minAdvanceHours }} 小时预约，营业时间 06:00-18:00</text>
		</view>

		<view v-if="form.pickupType === 'DELIVERY'" class="form-card">
			<view class="section-row">
				<text class="section-title">配送地址</text>
				<text class="section-action" @click="chooseDeliveryLocation">地图选点</text>
			</view>
			<textarea class="text-area" :value="form.address" placeholder="请输入配送地址，建议先使用地图选点" @input="onAddressInput"></textarea>
			<text class="sub-note">手动修改地址后会清空坐标，请重新地图选点并计算配送费。</text>
			<view class="location-actions">
				<view class="secondary-button" @click="chooseDeliveryLocation">重新选择位置</view>
				<view class="secondary-button primary-outline" @click="calculateDeliveryFee">{{ calculatingDelivery ? '计算中...' : '计算配送费' }}</view>
			</view>
			<view class="fee-panel">
				<view class="fee-row">
					<text class="sub-note">配送距离</text>
					<text class="fee-value">{{ deliveryDistanceText }}</text>
				</view>
				<view class="fee-row">
					<text class="sub-note">配送费</text>
					<text class="fee-value">¥{{ deliveryFeeText }}</text>
				</view>
				<text v-if="deliveryStatusText" class="status-note" :class="{ danger: form.isInRange === false }">{{ deliveryStatusText }}</text>
			</view>
		</view>

		<view class="form-card">
			<text class="section-title">特殊备注</text>
			<textarea class="text-area" v-model="form.userRemark" placeholder="如：少糖、不要坚果、写字颜色偏金色"></textarea>
		</view>

		<view class="step-bottom">
			<view class="back-link" @click="prevStep">← 返回修改款式</view>
			<view class="submit-button" @click="nextStep">下一步 — 确认并提交</view>
		</view>
		</block>

		<block v-if="!loadError && step === 3">
		<view class="form-card summary-card">
			<text class="section-title">蛋糕信息</text>
			<view class="summary-row">
				<text class="summary-label">商品名称</text>
				<text class="summary-value">{{ form.productName }}</text>
			</view>
			<view class="summary-row">
				<text class="summary-label">蛋糕分类</text>
				<text class="summary-value">{{ getCategoryName(form.categoryId) }}</text>
			</view>
			<view class="summary-row">
				<text class="summary-label">选购磅数</text>
				<text class="summary-value">{{ form.buyPound }} 磅（实际制作 {{ actualMakePound }} 磅）</text>
			</view>
			<view class="summary-row">
				<text class="summary-label">口味</text>
				<text class="summary-value">{{ form.flavor }}</text>
			</view>
			<view class="summary-row">
				<text class="summary-label">主题风格</text>
				<text class="summary-value">{{ form.theme }}</text>
			</view>
			<view class="summary-row" v-if="form.blessingText">
				<text class="summary-label">祝福文字</text>
				<text class="summary-value">{{ form.blessingText }}</text>
			</view>
			<view class="summary-row">
				<text class="summary-label">碟子 / 蜡烛</text>
				<text class="summary-value">{{ form.plateCount }} 碟 / {{ form.candleCount }} 蜡烛</text>
			</view>
		</view>

		<view class="form-card summary-card">
			<text class="section-title">预约信息</text>
			<view class="summary-row">
				<text class="summary-label">预约时间</text>
				<text class="summary-value">{{ form.appointmentTime || '未选择' }}</text>
			</view>
			<view class="summary-row">
				<text class="summary-label">取货方式</text>
				<text class="summary-value">{{ form.pickupType === 'DELIVERY' ? '商家配送' : '到店自提' }}</text>
			</view>
			<block v-if="form.pickupType === 'DELIVERY' && form.address">
				<view class="summary-row">
					<text class="summary-label">配送地址</text>
					<text class="summary-value">{{ form.address }}</text>
				</view>
				<view class="summary-row">
					<text class="summary-label">配送费</text>
					<text class="summary-value price">¥{{ deliveryFeeText }}</text>
				</view>
			</block>
		</view>

		<view class="form-card summary-card" v-if="effectivePricePerPound > 0">
			<text class="section-title">费用预览</text>
			<view class="summary-row">
				<text class="summary-label">蛋糕单价</text>
				<text class="summary-value">¥{{ effectivePricePerPound.toFixed(2) }} / 磅</text>
			</view>
			<view class="summary-row">
				<text class="summary-label">蛋糕估算</text>
				<text class="summary-value price">¥{{ estimatedProductPrice.toFixed(2) }}</text>
			</view>
			<text class="sub-note">最终价格以商家确认为准</text>
		</view>

		<view class="form-card summary-card" v-if="form.userRemark">
			<text class="section-title">特殊备注</text>
			<text class="summary-value" style="margin-top:12rpx;display:block;line-height:1.6;">{{ form.userRemark }}</text>
		</view>

		<view class="step-bottom">
			<view class="back-link" @click="prevStep">← 返回修改</view>
		</view>

		<view class="submit-wrap">
			<view class="submit-button" :class="{ disabled: submitting }" @click="submitDraft">
				{{ submitting ? '提交中...' : '提交定制需求' }}
			</view>
		</view>
		</block>
	</scroll-view>
</template>

<script>
	import { getCategories, getHomeData } from '@/api/home'
	import { calculateDelivery } from '@/api/order'
	import { getProductDetail } from '@/api/product'
	import { getCaseDetail } from '@/api/case'
	import { uploadFile } from '@/api/upload'
	import { PRODUCT_IMAGE_FALLBACK, STORE_INFO } from '@/constants/app'
	import { UPLOAD_BIZ_TYPE } from '@/constants/order'
	import { normalizeCategories } from '@/utils/home-adapter'
	import { saveOrderDraft, getOrderDraft } from '@/utils/order-draft'
	import { normalizeProductDetail } from '@/utils/product-adapter'
	import { formatDistance } from '@/utils/format'

	const DEFAULT_POUND_OPTIONS = [1, 2, 3, 4]
	const DEFAULT_FLAVOR_OPTIONS = ['原味', '巧克力', '草莓', '香芋']
	const DEFAULT_THEME_OPTIONS = ['生日', '节日', '成人', '儿童', '老人']

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
			return value.filter(Boolean)
		}

		if (typeof value === 'string') {
			const text = value.trim()
			if (!text) {
				return fallback
			}

			try {
				const parsed = JSON.parse(text)
				return Array.isArray(parsed) ? parsed.filter(Boolean) : fallback
			} catch (error) {
				return text.split(',').map((item) => item.trim()).filter(Boolean)
			}
		}

		return fallback
	}

	function normalizeCaseDetail(detail = {}) {
		const themeValue = pickValue(detail, ['theme', 'themeName', 'themeStyle'], '')
		const themes = parseStringArray(pickValue(detail, ['themes'], []), [])

		if (themeValue && !themes.includes(themeValue)) {
			themes.unshift(themeValue)
		}

		return {
			id: pickValue(detail, ['id', 'caseId']),
			name: pickValue(detail, ['name', 'caseName', 'title'], '蛋糕案例'),
			imageUrl: pickValue(detail, ['imageUrl', 'image', 'coverUrl'], PRODUCT_IMAGE_FALLBACK),
			categoryId: Number(pickValue(detail, ['categoryId', 'category_id'], 3)) || 3,
			referencePound: Number(pickValue(detail, ['referencePound', 'pound', 'defaultPound'], 2)) || 2,
			themes: themes.length ? themes : DEFAULT_THEME_OPTIONS,
			description: pickValue(detail, ['description', 'intro'], '')
		}
	}

	export default {
		data() {
			return {
				queryOptions: {},
				loadError: '',
				uploading: false,
				calculatingDelivery: false,
				submitting: false,
				step: 1,
				stepLabels: ['款式口味', '预约配送', '确认提交'],
				appointmentDate: '',
				appointmentTime: '',
				draftTimer: null,
				categories: [],
				poundOptions: DEFAULT_POUND_OPTIONS,
				flavorOptions: DEFAULT_FLAVOR_OPTIONS,
				themeOptions: DEFAULT_THEME_OPTIONS,
				form: {
				source: 'CUSTOM',
				productId: '',
				caseId: '',
				productName: '定制蛋糕',
				productImageUrl: PRODUCT_IMAGE_FALLBACK,
				basePrice: 0,
				pricePerPound: 0,
				defaultPound: 2,
				categoryId: '',
				categoryName: '定制蛋糕',
				buyPound: 2,
				flavor: '原味',
				theme: '成人',
				blessingText: '',
				plateCount: '1',
				candleCount: '1',
				referenceImages: [],
				pickupType: 'SELF_PICKUP',
				appointmentTime: '',
				address: '',
				addressLng: null,
				addressLat: null,
				deliveryDistanceKm: null,
				deliveryFee: 0,
				isInRange: null,
				deliveryMessage: '',
				userRemark: ''
				}
			}
		},
		computed: {
			actualMakePound() {
				return Number(this.form.buyPound || 0) * 1.5
			},
			effectivePricePerPound() {
				return Number(this.form.pricePerPound || 0)
			},
			estimatedProductPrice() {
				return this.effectivePricePerPound * Number(this.form.buyPound || 0)
			},
			priceHintText() {
				const pricePerPound = this.effectivePricePerPound
				if (!pricePerPound) return ''
				const buyPound = Number(this.form.buyPound || 0)
				return `¥${pricePerPound.toFixed(2)} × ${buyPound}磅 = ¥${this.estimatedProductPrice.toFixed(2)}`
			},
			deliveryFeeText() {
				return Number(this.form.deliveryFee || 0).toFixed(2)
			},
			deliveryDistanceText() {
				return formatDistance(this.form.deliveryDistanceKm)
			},
			sourceTitle() {
				if (this.form.source === 'PRODUCT') {
					return this.form.productName || '商品详情下单'
				}

				if (this.form.source === 'CASE') {
					return this.form.productName || '案例定制'
				}

				if (this.form.source === 'REBUY') {
					return '再次购买'
				}

				return '直接定制蛋糕'
			},
			sourceHint() {
				if (this.form.source === 'PRODUCT') {
					return '已带入商品的推荐规格，仍可继续调整口味、主题和备注。'
				}

				if (this.form.source === 'CASE') {
					return '已自动带入案例图片作为参考图，请继续完善磅数、时间和配送信息。'
				}

				if (this.form.source === 'REBUY') {
					return '已带入前序订单的规格参数，仍可继续调整磅数、口味、主题和备注。'
				}

				return '适合直接提交定制需求，也可以补充参考图帮助商家理解款式。'
			},
			deliveryStatusText() {
				if (this.form.deliveryMessage) {
					return this.form.deliveryMessage
				}

				if (this.form.isInRange === false) {
					return '当前地址超出配送范围，请选择到店自提'
				}

				if (this.form.deliveryDistanceKm !== null) {
					return `门店服务范围 ${STORE_INFO.deliveryRangeKm}km 内，最终配送费以商家确认为准。`
				}

				return ''
			},
			minAdvanceHours() {
				return STORE_INFO.minAdvanceHours
			},
			minDate() {
				const d = new Date()
				d.setHours(d.getHours() + this.minAdvanceHours)
				const y = d.getFullYear()
				const m = `${d.getMonth() + 1}`.padStart(2, '0')
				const day = `${d.getDate()}`.padStart(2, '0')
				return `${y}-${m}-${day}`
			},
			stepPercent() {
				return `${((this.step - 1) / 2) * 100}%`
			}
		},
		watch: {
			'form.categoryId'() { this.scheduleDraftSave() },
			'form.buyPound'() { this.scheduleDraftSave() },
			'form.flavor'() { this.scheduleDraftSave() },
			'form.theme'() { this.scheduleDraftSave() },
			'form.blessingText'() { this.scheduleDraftSave() },
			'form.plateCount'() { this.scheduleDraftSave() },
			'form.candleCount'() { this.scheduleDraftSave() },
			'form.pickupType'() { this.scheduleDraftSave() },
			'form.address'() { this.scheduleDraftSave() },
			'form.userRemark'() { this.scheduleDraftSave() }
		},
		onLoad(options) {
			this.queryOptions = Object.assign({}, options)
			this.initializePage(this.queryOptions)
			const savedDraft = getOrderDraft()
			if (savedDraft && savedDraft.autoSaved && !options.productId && !options.caseId && options.source !== 'REBUY') {
				uni.showModal({
					title: '恢复草稿',
					content: '检测到上次未提交的草稿，是否恢复？',
					confirmText: '恢复',
					cancelText: '放弃',
					confirmColor: '#2d5fbf',
					success: (res) => {
						if (res.confirm) {
							Object.assign(this.form, savedDraft)
							const parts = (savedDraft.appointmentTime || '').split(' ')
							if (parts.length === 2) {
								this.appointmentDate = parts[0]
								this.appointmentTime = parts[1]
							}
						}
					}
				})
			}
		},
		onHide() {
			this.submitting = false
		},
		onBackPress(options) {
			if (this.submitting) return
			if (this.hasFormContent()) {
				uni.showModal({
					title: '离开页面',
					content: '您填写的内容尚未提交，确定要离开吗？已自动保存为草稿，下次进入可恢复。',
					confirmText: '离开',
					cancelText: '留下',
					confirmColor: '#c55d38',
					success: (res) => {
						if (res.confirm) {
							this.scheduleDraftSave()
							uni.navigateBack()
						}
					}
				})
				return true
			}
		},
		methods: {
			async initializePage(options = {}) {
				this.loadError = ''
				this.queryOptions = Object.assign({}, options)
				this.form.appointmentTime = this.form.appointmentTime || this.getDefaultAppointmentTime()

				try {
					await this.fetchCategories()

					if (options.productId) {
						await this.applyProductSource(options)
					} else if (options.caseId) {
						await this.applyCaseSource(options)
					} else if (options.source === 'REBUY') {
						this.applyRebuySource(options)
					} else {
						this.applyCustomSource(options)
					}

					this.ensureCategorySelection()
					this.form.categoryName = this.getCategoryName(this.form.categoryId)
					const parts = (this.form.appointmentTime || '').split(' ')
					if (parts.length === 2) {
						this.appointmentDate = parts[0]
						this.appointmentTime = parts[1]
					}
					await this.fetchStorePricePerPound()
				} catch (error) {
					this.loadError = error.message || '定制页数据加载失败，请检查接口或网络配置'
				}
			},
			async fetchCategories() {
				try {
					this.categories = normalizeCategories(await getCategories())
				} catch (error) {
					this.categories = []
					throw error
				}
			},
			async fetchStorePricePerPound() {
				if (this.form.source === 'PRODUCT' && this.form.pricePerPound > 0) {
					return
				}
				try {
					const data = await getHomeData()
					if (data && data.store && data.store.pricePerPound) {
						this.form.pricePerPound = Number(data.store.pricePerPound) || 0
					}
				} catch {
					// 获取失败时保持默认值
				}
			},
			applyCustomSource(options = {}) {
				const customCategoryId = this.getCustomCategoryId()
				this.form.source = 'CUSTOM'
				this.form.productId = ''
				this.form.caseId = ''
				this.form.productName = '定制蛋糕'
				this.form.productImageUrl = PRODUCT_IMAGE_FALLBACK
				this.form.categoryId = options.categoryId || customCategoryId || pickValue(this.categories[0], ['id'], '')
				this.resetOptionSets()
			},
			applyRebuySource(options = {}) {
				const customCategoryId = this.getCustomCategoryId()
				this.form.source = 'REBUY'
				this.form.productId = ''
				this.form.caseId = ''
				this.form.productName = '定制蛋糕'
				this.form.productImageUrl = PRODUCT_IMAGE_FALLBACK
				this.resetOptionSets()
				if (options.buyPound !== undefined && options.buyPound !== '') {
					this.form.buyPound = this.pickNumberOption(this.poundOptions, Number(options.buyPound), 2)
				}
				if (options.flavor !== undefined && options.flavor !== '') {
					this.form.flavor = this.pickTextOption(this.flavorOptions, decodeURIComponent(options.flavor), '原味')
				}
				if (options.theme !== undefined && options.theme !== '') {
					this.form.theme = this.pickTextOption(this.themeOptions, decodeURIComponent(options.theme), '成人')
				}
				if (options.blessingText !== undefined && options.blessingText !== '') {
					this.form.blessingText = decodeURIComponent(options.blessingText)
				}
				this.form.categoryId = options.categoryId || customCategoryId || pickValue(this.categories[0], ['id'], '')
			},
			async applyProductSource(options = {}) {
			const detail = normalizeProductDetail(await getProductDetail(options.productId))
			this.form.source = 'PRODUCT'
			this.form.productId = detail.id
			this.form.caseId = ''
			this.form.productName = detail.name
			this.form.productImageUrl = detail.imageUrl
			this.form.basePrice = detail.basePrice
			this.form.pricePerPound = detail.pricePerPound || 0
			this.form.defaultPound = detail.defaultPound || 2
			this.form.categoryId = detail.categoryId || this.getCustomCategoryId() || ''
			this.poundOptions = detail.pounds.length ? detail.pounds : DEFAULT_POUND_OPTIONS
			this.flavorOptions = detail.flavors.length ? detail.flavors : DEFAULT_FLAVOR_OPTIONS
			this.themeOptions = detail.themes.length ? detail.themes : DEFAULT_THEME_OPTIONS
			this.form.buyPound = this.pickNumberOption(this.poundOptions, Number(options.buyPound || detail.defaultPound || 2), 2)
			this.form.flavor = this.pickTextOption(this.flavorOptions, decodeURIComponent(options.flavor || detail.flavors[0] || '原味'), '原味')
			this.form.theme = this.pickTextOption(this.themeOptions, decodeURIComponent(options.theme || detail.themes[0] || '成人'), '成人')
			},
			async applyCaseSource(options = {}) {
				const detail = normalizeCaseDetail(await getCaseDetail(options.caseId))
				this.form.source = 'CASE'
				this.form.productId = ''
				this.form.caseId = detail.id
				this.form.productName = detail.name
				this.form.productImageUrl = detail.imageUrl
				this.form.categoryId = detail.categoryId || this.getCustomCategoryId() || ''
				this.resetOptionSets()
				this.themeOptions = detail.themes.length ? detail.themes : DEFAULT_THEME_OPTIONS
				this.form.buyPound = this.pickNumberOption(this.poundOptions, detail.referencePound, 2)
				this.form.theme = this.pickTextOption(this.themeOptions, this.themeOptions[0] || '成人', '成人')
				this.form.referenceImages = detail.imageUrl ? [detail.imageUrl] : []
			},
			resetOptionSets() {
				this.poundOptions = DEFAULT_POUND_OPTIONS
				this.flavorOptions = DEFAULT_FLAVOR_OPTIONS
				this.themeOptions = DEFAULT_THEME_OPTIONS
				this.form.buyPound = this.pickNumberOption(this.poundOptions, this.form.buyPound, 2)
				this.form.flavor = this.pickTextOption(this.flavorOptions, this.form.flavor, '原味')
				this.form.theme = this.pickTextOption(this.themeOptions, this.form.theme, '成人')
			},
			pickNumberOption(options = [], value, fallback) {
				const target = Number(value)
				if (options.some((item) => Number(item) === target)) {
					return target
				}

				return options.some((item) => Number(item) === Number(fallback)) ? Number(fallback) : Number(options[0] || fallback || 2)
			},
			pickTextOption(options = [], value, fallback) {
				const target = String(value || '').trim()
				if (target && options.includes(target)) {
					return target
				}

				if (fallback && options.includes(fallback)) {
					return fallback
				}

				return options[0] || fallback || ''
			},
			getDefaultAppointmentTime() {
				const date = new Date(Date.now() + STORE_INFO.minAdvanceHours * 60 * 60 * 1000)
				const year = date.getFullYear()
				const month = `${date.getMonth() + 1}`.padStart(2, '0')
				const day = `${date.getDate()}`.padStart(2, '0')
				const hours = `${date.getHours()}`.padStart(2, '0')
				const minutes = `${date.getMinutes()}`.padStart(2, '0')
				return `${year}-${month}-${day} ${hours}:${minutes}`
			},
			getCustomCategoryId() {
				const current = this.categories.find((item) => item.name === '定制蛋糕')
				return current ? current.id : ''
			},
			ensureCategorySelection() {
				if (this.categories.some((item) => Number(item.id) === Number(this.form.categoryId))) {
					return
				}

				this.form.categoryId = this.getCustomCategoryId() || pickValue(this.categories[0], ['id'], '')
			},
			onDateChange(e) {
				this.appointmentDate = e.detail.value
				this.syncAppointmentTime()
			},
			onTimeChange(e) {
				this.appointmentTime = e.detail.value
				this.syncAppointmentTime()
			},
			syncAppointmentTime() {
				if (this.appointmentDate && this.appointmentTime) {
					this.form.appointmentTime = `${this.appointmentDate} ${this.appointmentTime}`
				}
			},
			getCategoryName(categoryId) {
				const current = this.categories.find((item) => Number(item.id) === Number(categoryId))
				return current ? current.name : '定制蛋糕'
			},
			selectCategory(categoryId) {
				this.form.categoryId = categoryId
				this.form.categoryName = this.getCategoryName(categoryId)
			},
			selectPound(pound) {
				this.form.buyPound = Number(pound)
			},
			removeReferenceImage(index) {
				this.form.referenceImages.splice(index, 1)
			},
			async chooseReferenceImage() {
				if (this.uploading) {
					return
				}

				if (this.form.referenceImages.length >= 3) {
					uni.showToast({ title: '最多上传 3 张参考图', icon: 'none' })
					return
				}

				try {
					const chooseResult = await new Promise((resolve, reject) => {
						uni.chooseImage({
							count: 1,
							sizeType: ['compressed'],
							sourceType: ['album', 'camera'],
							success: resolve,
							fail: reject
						})
					})

					const filePath = chooseResult.tempFilePaths && chooseResult.tempFilePaths[0]
					if (!filePath) {
						return
					}

					this.uploading = true
					const uploadResult = await uploadFile({ filePath, bizType: UPLOAD_BIZ_TYPE.ORDER_REF })
					const fileUrl = pickValue(uploadResult, ['fileUrl', 'url'], '')

					if (!fileUrl) {
						throw new Error('上传成功但未返回图片地址')
					}

					this.form.referenceImages.push(fileUrl)
				} catch (error) {
					if (error && error.errMsg && error.errMsg.includes('cancel')) {
						return
					}

					uni.showToast({
						title: error.message || '图片上传失败，请稍后重试',
						icon: 'none'
					})
				} finally {
					this.uploading = false
				}
			},
			changePickupType(type) {
				this.form.pickupType = type
				if (type === 'SELF_PICKUP') {
					this.resetDeliveryFields(false)
				}
			},
			resetDeliveryFields(clearAddress = false) {
				if (clearAddress) {
					this.form.address = ''
				}

				this.form.addressLng = null
				this.form.addressLat = null
				this.form.deliveryDistanceKm = null
				this.form.deliveryFee = 0
				this.form.isInRange = null
				this.form.deliveryMessage = ''
			},
			onAddressInput(event) {
			this.form.address = event.detail.value
			this.resetDeliveryFields(false)
		},
			async chooseDeliveryLocation() {
				try {
					const location = await new Promise((resolve, reject) => {
						uni.chooseLocation({
							success: resolve,
							fail: reject
						})
					})

					const addressParts = [location.address, location.name].filter(Boolean)
					this.form.address = addressParts.join(' ')
					this.form.addressLng = Number(location.longitude)
					this.form.addressLat = Number(location.latitude)
					await this.calculateDeliveryFee()
				} catch (error) {
					if (error && error.errMsg && error.errMsg.includes('cancel')) {
						return
					}

					uni.showToast({
						title: error.message || '选择位置失败，请检查定位权限',
						icon: 'none'
					})
				}
			},
			async calculateDeliveryFee() {
				if (this.calculatingDelivery) {
					return
				}

				if (!this.form.address.trim()) {
					uni.showToast({ title: '请先填写配送地址', icon: 'none' })
					return
				}

				if (typeof this.form.addressLng !== 'number' || typeof this.form.addressLat !== 'number') {
					uni.showToast({ title: '请先地图选点后再计算配送费', icon: 'none' })
					return
				}

				try {
					this.calculatingDelivery = true
					const result = await calculateDelivery({
						address: this.form.address.trim(),
						longitude: this.form.addressLng,
						latitude: this.form.addressLat
					})

					this.form.deliveryDistanceKm = Number(pickValue(result, ['distanceKm', 'distance_km'], 0))
					this.form.deliveryFee = Number(pickValue(result, ['deliveryFee', 'delivery_fee'], 0))
					this.form.isInRange = Boolean(pickValue(result, ['isInRange', 'is_in_range'], false))
					this.form.deliveryMessage = pickValue(result, ['message'], '')
				} catch (error) {
					this.form.deliveryMessage = error.message || '配送费计算失败'
					uni.showToast({ title: this.form.deliveryMessage, icon: 'none' })
				} finally {
					this.calculatingDelivery = false
				}
			},
			scheduleDraftSave() {
				if (this.draftTimer) clearTimeout(this.draftTimer)
				this.draftTimer = setTimeout(() => {
					const draft = {
						...this.form,
						appointmentTime: this.form.appointmentTime,
						address: this.form.address,
						plateCount: String(this.form.plateCount),
						candleCount: String(this.form.candleCount),
						distanceKm: this.form.pickupType === 'DELIVERY' ? this.form.deliveryDistanceKm : null,
						actualMakePound: this.actualMakePound,
						autoSaved: true
					}
					saveOrderDraft(draft)
				}, 1000)
			},
			hasFormContent() {
				return Boolean(
					this.form.categoryId ||
					this.form.blessingText ||
					this.form.userRemark ||
					this.form.referenceImages.length ||
					this.form.address
				)
			},
			parseAppointmentTime(value) {
				if (!value) {
					return null
				}

				const normalized = String(value).trim().replace(/-/g, '/')
				const date = new Date(normalized)
				return Number.isNaN(date.getTime()) ? null : date
			},
			nextStep() {
				if (this.step >= 3) return
				if (this.step === 1) {
					if (!this.form.categoryId) { uni.showToast({ title: '请选择蛋糕分类', icon: 'none' }); return }
					if (!this.form.buyPound) { uni.showToast({ title: '请选择磅数', icon: 'none' }); return }
					if (!this.form.flavor) { uni.showToast({ title: '请选择口味', icon: 'none' }); return }
					if (!this.form.theme) { uni.showToast({ title: '请选择主题风格', icon: 'none' }); return }
					if (!/^[1-9]\d*$/.test(String(this.form.plateCount))) { uni.showToast({ title: '请填写正确的碟子数量', icon: 'none' }); return }
					if (!/^[1-9]\d*$/.test(String(this.form.candleCount))) { uni.showToast({ title: '请填写正确的蜡烛数量', icon: 'none' }); return }
				}
				if (this.step === 2) {
					if (!this.form.appointmentTime) { uni.showToast({ title: '请选择预约时间', icon: 'none' }); return }
				}
				this.step += 1
			},
			prevStep() {
				if (this.step <= 1) return
				this.step -= 1
			},
			validate() {
				const appointmentDate = this.parseAppointmentTime(this.form.appointmentTime)
				if (!appointmentDate) {
					return '请填写正确的预约时间'
				}

				if (appointmentDate.getTime() - Date.now() < STORE_INFO.minAdvanceHours * 60 * 60 * 1000) {
					return `蛋糕需至少提前${STORE_INFO.minAdvanceHours}小时预约`
				}

				if (this.form.pickupType === 'DELIVERY') {
					if (!this.form.address.trim()) {
						return '选择配送时请填写配送地址'
					}

					if (typeof this.form.addressLng !== 'number' || typeof this.form.addressLat !== 'number') {
						return '请先地图选点并计算配送费'
					}

					if (this.form.deliveryDistanceKm === null) {
						return '请选择位置后计算配送费'
					}

					if (this.form.isInRange === false) {
						return '当前地址超出配送范围，请选择到店自提'
					}
				}

				if (this.form.source === 'PRODUCT' && !this.form.productId) {
					return '商品信息缺失，请返回重新选择'
				}

				if (this.form.source === 'CASE' && !this.form.caseId) {
					return '案例信息缺失，请返回重新选择'
				}

				return ''
			},
			submitDraft() {
				if (this.submitting) {
					return
				}

				this.form.categoryName = this.getCategoryName(this.form.categoryId)
				const errorText = this.validate()

				if (errorText) {
					uni.showToast({ title: errorText, icon: 'none' })
					return
				}

				this.submitting = true
				saveOrderDraft({
					...this.form,
					appointmentTime: this.form.appointmentTime.trim(),
					address: this.form.address.trim(),
					plateCount: String(this.form.plateCount),
					candleCount: String(this.form.candleCount),
					distanceKm: this.form.pickupType === 'DELIVERY' ? this.form.deliveryDistanceKm : null,
					actualMakePound: this.actualMakePound
				})

				uni.navigateTo({
				url: '/pages/order/confirm',
				success: () => {
					this.submitting = false
				}
			})
			}
		}
	}
</script>

<style lang="scss">
.custom-page {
	min-height: 100vh;
	padding: 32rpx 32rpx 150rpx;
	background: #f6f1ed;
}

/* ── 卡片差异化 — 偶数左侧蓝线 / 奇数顶部细线 ── */
.error-card,
.notice-card,
.form-card {
	margin-bottom: 24rpx;
	padding: 28rpx;
	border-radius: 24rpx;
	background: #fff;
	box-shadow: 0 16rpx 40rpx rgba(26, 21, 18, 0.08);
	position: relative;
	overflow: hidden;
}

.error-card {
	border-left: 6rpx solid #d95c33;
	background: #fff3f1;
}

/* 偶数卡片 — 左侧蓝色竖线 (Mondrian) */
.form-card:nth-child(even) {
	border-left: 4rpx solid #2d5fbf;
}

/* 奇数卡片 — 顶部浅灰细线 */
.form-card:nth-child(odd) {
	/* 顶部线通过下面的 sticky 情况处理，避免重叠 */
}

/* 来源卡片 — Memphis 几何圆点 */
.source-card {
	background-image:
		radial-gradient(circle at 85% 20%, rgba(45, 95, 191, 0.05) 4rpx, transparent 4rpx),
		radial-gradient(circle at 15% 75%, rgba(232, 184, 48, 0.06) 3rpx, transparent 3rpx);
}

.notice-title,
.section-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	letter-spacing: 1rpx;
	color: #2d2521;
}

.notice-desc,
.sub-note {
	display: block;
	margin-top: 12rpx;
	font-size: 24rpx;
	line-height: 1.65;
	color: #7b6d66;
}

/* 价格计算公式 — 陶土橙主色调，粗黑线边框 */
.price-hint {
	display: block;
	margin-top: 14rpx;
	padding: 16rpx 22rpx;
	border-radius: 16rpx;
	background: rgba(217, 92, 51, 0.06);
	border: 2rpx solid rgba(217, 92, 51, 0.2);
	border-left: 6rpx solid #d95c33;
	font-size: 26rpx;
	font-weight: 700;
	color: #9a4a2d;
	letter-spacing: 0.5rpx;
}

.retry-inline,
.section-action {
	font-size: 24rpx;
	font-weight: 700;
	color: #2d5fbf;
}

.source-title {
	display: block;
	margin-top: 16rpx;
	font-size: 32rpx;
	font-weight: 700;
	color: #2d2521;
}

.section-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.option-row {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	margin-top: 20rpx;
}

.option-chip {
	padding: 16rpx 24rpx;
	border: 2rpx solid #eadfd8;
	border-radius: 999rpx;
	background: #fff;
	font-size: 26rpx;
	font-weight: 700;
	color: #4d443f;
}

/* Mondrian 粗内边框选中态 */
.option-chip.active {
	border-color: #d95c33;
	background: #d95c33;
	color: #fff;
	box-shadow: inset 0 0 0 3rpx rgba(45, 95, 191, 0.25);
}

.text-input,
.text-area {
	width: 100%;
	margin-top: 16rpx;
	padding: 22rpx 24rpx;
	border: 2rpx solid #eadfd8;
	border-radius: 18rpx;
	background: #faf7f4;
	font-size: 28rpx;
	color: #2d2521;
}

.text-area {
	min-height: 180rpx;
}

.two-col-card {
	display: flex;
	gap: 18rpx;
}

.field-col {
	flex: 1;
}

.upload-row {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	margin-top: 16rpx;
}

.image-thumb,
.upload-box {
	width: 160rpx;
	height: 160rpx;
	border-radius: 18rpx;
}

.image-thumb {
	position: relative;
}

.thumb-image {
	width: 100%;
	height: 100%;
	border-radius: 18rpx;
	background: #f3e2d4;
}

.thumb-remove {
	position: absolute;
	right: 10rpx;
	bottom: 10rpx;
	padding: 6rpx 12rpx;
	border-radius: 999rpx;
	background: rgba(26, 21, 18, 0.72);
	font-size: 20rpx;
	color: #fff;
}

.upload-box {
	display: flex;
	align-items: center;
	justify-content: center;
	background: #fff;
	border: 2rpx dashed #2d5fbf;
	font-size: 24rpx;
	color: #2d5fbf;
}

.location-actions {
	display: flex;
	gap: 16rpx;
	margin-top: 20rpx;
}

.secondary-button {
	flex: 1;
	height: 76rpx;
	border-radius: 999rpx;
	background: rgba(217, 92, 51, 0.06);
	text-align: center;
	line-height: 76rpx;
	font-size: 24rpx;
	font-weight: 700;
	color: #9a6547;
}

.primary-outline {
	background: rgba(45, 95, 191, 0.08);
	color: #2d5fbf;
}

.fee-panel {
	margin-top: 20rpx;
	padding: 20rpx 24rpx;
	border-radius: 18rpx;
	background: #faf7f4;
	border-left: 4rpx solid #e8b830;
}

.fee-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 16rpx;
}

.fee-value {
	font-size: 32rpx;
	font-weight: 700;
	color: #d95c33;
}

.status-note {
	display: block;
	margin-top: 12rpx;
	font-size: 24rpx;
	line-height: 1.6;
	color: #826756;
}

.status-note.danger {
	color: #d95c33;
}

/* ── 提交区 — Memphis 条纹纹理 ── */
.submit-wrap {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 24rpx 24rpx 34rpx;
	background: rgba(255, 255, 255, 0.97);
	backdrop-filter: blur(10rpx);
	box-shadow: 0 -10rpx 24rpx rgba(26, 21, 18, 0.08);
}

.submit-button {
	height: 92rpx;
	border-radius: 999rpx;
	background: #d95c33;
	text-align: center;
	line-height: 92rpx;
	font-size: 30rpx;
	font-weight: 800;
	letter-spacing: 2rpx;
	color: #fff;
	position: relative;
}

/* 蓝色小几何方形 */
.submit-button::after {
	content: '';
	position: absolute;
	right: 16rpx;
	bottom: 12rpx;
	width: 12rpx;
	height: 12rpx;
	background: #2d5fbf;
}

.submit-button.disabled {
	opacity: 0.7;
	}

.picker-row {
	display: flex;
	gap: 18rpx;
	margin-top: 18rpx;
}

.picker-item {
	flex: 1;
}

.picker-display {
	padding: 22rpx 24rpx;
	border: 2rpx solid #eadfd8;
	border-radius: 18rpx;
	background: #faf7f4;
	font-size: 28rpx;
	color: #b5a294;
}

.picker-display.selected {
	color: #2d2521;
}

.step-progress {
	padding: 16rpx 32rpx 24rpx;
}

.step-bar {
	height: 6rpx;
	border-radius: 3rpx;
	background: #eadfd8;
	overflow: hidden;
}

.step-fill {
	height: 100%;
	background: linear-gradient(90deg, #d95c33, #e8b830);
	transition: width 0.3s ease;
	border-radius: 3rpx;
}

.step-labels {
	display: flex;
	justify-content: space-between;
	margin-top: 14rpx;
}

.step-label {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	font-size: 22rpx;
	color: #b5a294;
}

.step-label.active {
	color: #d95c33;
}

.step-label.current {
	color: #d95c33;
	font-weight: 700;
}

.step-dot {
	width: 40rpx;
	height: 40rpx;
	border-radius: 50%;
	background: #eadfd8;
	text-align: center;
	line-height: 40rpx;
	font-size: 20rpx;
	font-weight: 700;
	color: #b5a294;
}

.step-label.active .step-dot {
	background: #d95c33;
	color: #fff;
}

.step-bottom {
	margin-top: 32rpx;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.back-link {
	text-align: center;
	font-size: 26rpx;
	color: #2d5fbf;
	padding: 14rpx;
}

.summary-card {
	border-left: 4rpx solid #e8b830;
}

.summary-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 18rpx;
	padding-bottom: 18rpx;
	border-bottom: 1rpx solid #f3ede8;
}

.summary-row:last-child {
	border-bottom: none;
	padding-bottom: 0;
}

.summary-label {
	font-size: 26rpx;
	color: #7b6d66;
}

.summary-value {
	font-size: 26rpx;
	font-weight: 700;
	color: #2d2521;
	text-align: right;
	max-width: 60%;
}

.summary-value.price {
	color: #d95c33;
	font-size: 30rpx;
}
</style>
