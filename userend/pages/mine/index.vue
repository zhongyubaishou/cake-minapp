<template>
	<view class="mine-page">
		<!-- 头像区域：登录后可用微信 chooseAvatar -->
		<view class="profile-card">
			<button
				v-if="isLoggedIn"
				class="avatar-btn"
				open-type="chooseAvatar"
				@chooseavatar="onChooseAvatar"
			>
				<image class="avatar" :src="avatarSrc" mode="aspectFill"></image>
			</button>
			<image v-else class="avatar" :src="avatarSrc" mode="aspectFill"></image>
			<view class="profile-main">
				<input
					v-if="isLoggedIn"
					class="nickname-input"
					type="nickname"
					:value="displayNickname"
					placeholder="点击设置昵称"
					@blur="onNicknameBlur"
				/>
				<text v-else class="nickname">{{ displayNickname }}</text>
				<text class="status">{{ statusText }}</text>
				<text class="phone">{{ hasPhone ? `手机号：${profile.phone}` : '手机号未绑定' }}</text>
			</view>
		</view>

		<view class="panel">
			<text class="panel-title">账户与服务</text>
			<text v-if="loginError" class="panel-tip error-tip">{{ loginError }}</text>
			<text class="panel-tip">登录后可提交订单，也可以点击头像和昵称主动完善账号信息。</text>
			<view class="button-group">
				<view class="action-button primary" @click="handleLogin">微信登录</view>
				<!-- 商家要求：不强制手机号授权 -->
				<!-- #ifdef MP-WEIXIN -->
				<!-- <button class="action-button accent mini-button" open-type="getPhoneNumber" @getphonenumber="handleGetPhoneNumber"> -->
				<!-- 	手机号授权 -->
				<!-- </button> -->
				<!-- #endif -->
			</view>
		</view>

		<view class="panel">
			<text class="panel-title">常用入口</text>
			<view class="entry-list">
				<view class="entry-item" @click="go('/pages/order/list')">
					<text>我的订单</text>
					<view class="entry-right">
						<text>查看</text>
						<text v-if="orderBadge !== null" class="order-badge">{{ orderBadge }}</text>
					</view>
				</view>
				<view class="entry-item" @click="go('/pages/mine/favorite')">
					<text>我的收藏</text>
					<text>查看</text>
				</view>
				<view class="entry-item" @click="go('/pages/mine/after-sale')">
					<text>售后反馈</text>
					<text>进入</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { bindPhone, getUserProfile, login, updateProfile } from '@/api/user'
	import { uploadFile } from '@/api/upload'
	import { getOrders } from '@/api/order'
	import { API_BASE_URL, DEV_WECHAT_LOGIN_MOCK, IS_DEV_MODE } from '@/constants/app'
	import { ORDER_STATUS } from '@/constants/order'
	import { useUserStore } from '@/stores/user'
	import { normalizeUserProfile } from '@/utils/user-adapter'

	const userStore = useUserStore()

	export default {
		data() {
			return {
				loginError: '',
				orderBadge: null
			}
		},
		computed: {
			profile() {
				return userStore.state.profile || {}
			},
			isLoggedIn() {
				return userStore.isLoggedIn()
			},
			hasPhone() {
				return userStore.state.hasPhone
			},
			statusText() {
				return this.isLoggedIn ? '已登录' : '当前未登录'
			},
			/** 优先使用 store 中持久化的独立字段，其次使用 profile */
			avatarSrc() {
				const raw = userStore.state.avatar || this.profile.avatarUrl || ''
				if (!raw) return ''
				if (/^https?:\/\//.test(raw) || /^\/static\//.test(raw)) return raw
				return `${API_BASE_URL}${raw}`
			},
			/** 优先使用 store 中持久化的昵称，其次使用 profile */
			displayNickname() {
				return userStore.state.nickname || this.profile.nickname || '微信用户'
			}
		},
		onShow() {
			if (this.isLoggedIn) {
				this.fetchProfile()
				this.fetchOrderBadge()
			}
		},
		onPullDownRefresh() {
			if (this.isLoggedIn) {
				this.fetchProfile().finally(() => {
					uni.stopPullDownRefresh()
				})
			} else {
				uni.stopPullDownRefresh()
			}
		},
		methods: {
			go(url) {
				uni.navigateTo({ url })
			},
			async handleLogin() {
				try {
					this.loginError = ''
					const loginRes = await this.getLoginCode()

					const data = await login({ code: loginRes.code })
					userStore.setSession(data)
					await this.fetchProfile()
					if (!userStore.isLoggedIn()) {
						throw new Error('登录校验失败，请重新登录')
					}
					uni.showToast({ title: '登录成功', icon: 'success' })
				} catch (error) {
					this.loginError = error.message || '登录暂时不可用，请稍后重试'
					uni.showToast({ title: this.loginError, icon: 'none' })
				}
			},
			getLoginCode() {
				return new Promise((resolve, reject) => {
					if (DEV_WECHAT_LOGIN_MOCK) {
						resolve({ code: 'dev-mock-code' })
						return
					}

					// #ifdef MP-WEIXIN
					uni.login({
						provider: 'weixin',
						success: resolve,
						fail: reject
					})
					// #endif

					// #ifndef MP-WEIXIN
					if (IS_DEV_MODE) {
						resolve({ code: `dev-code-${Date.now()}` })
						return
					}

					reject(new Error('当前环境仅支持微信小程序登录'))
					// #endif
				})
			},
			async onChooseAvatar(e) {
				const tempFilePath = e.detail.avatarUrl
				if (!tempFilePath) return

				try {
					uni.showLoading({ title: '上传中…' })
					const uploadRes = await uploadFile({ filePath: tempFilePath, bizType: 'AVATAR' })
					const fileUrl = uploadRes.fileUrl
					if (fileUrl) {
						await updateProfile({ avatarUrl: fileUrl })
						userStore.setAvatar(fileUrl)
						await this.fetchProfile()
					}
					uni.hideLoading()
				} catch (error) {
					uni.hideLoading()
					uni.showToast({ title: error.message || '头像更新失败', icon: 'none' })
				}
			},
			async onNicknameBlur(e) {
				const nickname = e.detail.value
				if (!nickname || nickname === this.profile.nickname) return

				try {
					await updateProfile({ nickname })
					// 立即更新 store 昵称字段（不等 fetchProfile）
					userStore.setNickname(nickname)
					await this.fetchProfile()
				} catch (error) {
					uni.showToast({ title: '昵称更新失败', icon: 'none' })
				}
			},
			async fetchProfile() {
				try {
					this.loginError = ''
					const profile = normalizeUserProfile(await getUserProfile())
					userStore.setProfile(profile)
					userStore.setHasPhone(Boolean(profile.phone))
				// 同步服务端最新昵称和头像到 store 独立字段
				userStore.syncProfileToStore(profile)
				} catch (error) {
					this.loginError = error.message || '账号信息暂时加载失败，请稍后重试'
				}
			},
			// 商家要求：不强制手机号授权
			// async handleGetPhoneNumber(event) {
			// 	const detail = event.detail || {}
			//
			// 	if (!this.isLoggedIn) {
			// 		uni.showToast({ title: '请先完成微信登录', icon: 'none' })
			// 		return
			// 	}
			//
			// 	if (!detail.code) {
			// 		console.error('[getPhoneNumber:fail]', detail)
			// 		const message = detail.errMsg && detail.errMsg.includes('jsapi has no permission')
			// 			? '当前暂不支持手机号授权，请稍后再试'
			// 			: detail.errMsg || '未获取到手机号授权'
			// 		uni.showToast({ title: message, icon: 'none' })
			// 		return
			// 	}
			//
			// 	try {
			// 		await bindPhone({ code: detail.code })
			// 		await this.fetchProfile()
			// 		uni.showToast({ title: '手机号已绑定', icon: 'success' })
			// 	} catch (error) {
			// 		uni.showToast({
			// 			title: error.message || '手机号绑定失败，请稍后重试',
			// 			icon: 'none'
			// 		})
			// 	}
			// }
			async fetchOrderBadge() {
				try {
					const res = await getOrders({ page: 1, pageSize: 200 })
					const list = res.list || []
					const waitAccept = list.filter(o => o.status === ORDER_STATUS.WAIT_ACCEPT).length
					const making = list.filter(o => o.status === ORDER_STATUS.MAKING).length
					if (waitAccept > 0) {
						this.orderBadge = waitAccept
					} else if (making > 0) {
						this.orderBadge = making
					} else {
						this.orderBadge = null
					}
				} catch (e) {
					this.orderBadge = null
				}
			},
		}
	}
</script>

<style lang="scss">
.mine-page {
	min-height: 100vh;
	padding: 32rpx;
	background: #f6f1ed;
	/* Memphis 低透明度几何圆点纹理 */
	background-image:
		radial-gradient(circle at 18% 22%, rgba(45, 95, 191, 0.05) 3rpx, transparent 3rpx),
		radial-gradient(circle at 78% 65%, rgba(232, 184, 48, 0.06) 4rpx, transparent 4rpx),
		radial-gradient(circle at 42% 78%, rgba(217, 92, 51, 0.04) 2rpx, transparent 2rpx);
}

.profile-card,
.panel {
	padding: 28rpx;
	border-radius: 24rpx;
	background: #fff;
	box-shadow: 0 16rpx 40rpx rgba(26, 21, 18, 0.08);
}

.panel {
	margin-top: 24rpx;
}

/* Mondrian 蓝色粗线 + 双环头像 */
.profile-card {
	display: flex;
	align-items: center;
	gap: 20rpx;
	border-left: 6rpx solid #2d5fbf;
}

.avatar {
	width: 110rpx;
	height: 110rpx;
	border-radius: 50%;
	background: #f3e2d5;
	/* 双环装饰 — 内圈暖橘 + 外圈蓝色 */
	box-shadow:
		0 0 0 4rpx #d95c33,
		0 0 0 8rpx rgba(45, 95, 191, 0.25);
}

/* 微信 chooseAvatar 按钮 — 去掉默认样式，透出头像 */
.avatar-btn {
	padding: 0;
	margin: 0;
	border: none;
	background: transparent;
	line-height: 0;
	width: 110rpx;
	height: 110rpx;
	border-radius: 50%;
}

.avatar-btn::after {
	border: none;
}

.profile-main {
	flex: 1;
}

.nickname {
	display: block;
	font-size: 34rpx;
	font-weight: 700;
	letter-spacing: 0.5rpx;
	color: #2d2521;
}

/* 微信 nickname 输入框 — 与 nickname 文字样式一致 */
.nickname-input {
	display: block;
	width: 100%;
	padding: 0;
	font-size: 34rpx;
	font-weight: 700;
	letter-spacing: 0.5rpx;
	color: #2d2521;
	background: transparent;
}

.status,
.phone {
	display: block;
	margin-top: 10rpx;
	font-size: 24rpx;
	color: #826756;
}

.panel-title {
	display: block;
	font-size: 28rpx;
	font-weight: 700;
	letter-spacing: 0.5rpx;
	color: #2d2521;
}

.panel-tip {
	display: block;
	margin-top: 14rpx;
	font-size: 24rpx;
	line-height: 1.7;
	color: #826756;
}

.error-tip {
	color: #d95c33;
}

.button-group {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	margin-top: 20rpx;
}

.action-button {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 84rpx;
	padding: 0 28rpx;
	border-radius: 999rpx;
	font-size: 26rpx;
	font-weight: 600;
	position: relative;
}

.mini-button {
	margin: 0;
	line-height: 84rpx;
}

.mini-button::after {
	border: 0;
}

/* 覆盖微信 button 默认样式，使登录按钮与 action-button 一致 */
.login-btn {
	margin: 0;
	line-height: 84rpx;
}

.login-btn::after {
	border: 0;
}

/* 暖橘主按钮 + 蓝色小几何 */
.primary {
	background: #d95c33;
	color: #fff;
}

.primary::after {
	content: '';
	position: absolute;
	right: 12rpx;
	bottom: 10rpx;
	width: 10rpx;
	height: 10rpx;
	background: #2d5fbf;
}

/* 浅黄底色 + 左侧暖橘色块 */
.accent {
	background: rgba(232, 184, 48, 0.14);
	color: #6b501e;
	border-left: 4rpx solid #d95c33;
	padding-left: 24rpx;
}

.ghost {
	margin-top: 16rpx;
	background: #fff1e3;
	color: #8a573b;
}

.entry-list {
	margin-top: 16rpx;
}

.entry-right {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.order-badge {
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 36rpx;
	height: 36rpx;
	padding: 0 8rpx;
	font-size: 22rpx;
	font-weight: 600;
	color: #fff;
	background: #d95c33;
	border-radius: 999rpx;
}

/* Mondrian 式非对称分隔 — 右侧 ~66% 处粗线 */
.entry-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 0;
	font-size: 28rpx;
	color: #2d2521;
	position: relative;
}

.entry-item::after {
	content: '';
	position: absolute;
	bottom: 0;
	right: 0;
	width: 34%;
	height: 3rpx;
	background: rgba(26, 21, 18, 0.12);
	border-radius: 2rpx;
}

.entry-item:last-child::after {
	display: none;
}
</style>
