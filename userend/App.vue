<template>
	<view>
		<NetworkBar />
		<Onboarding />
	</view>
</template>

<script>
	import { useUserStore } from '@/stores/user'
	import NetworkBar from '@/components/NetworkBar.vue'
	import Onboarding from '@/components/Onboarding.vue'

	const userStore = useUserStore()
	let loginModalShown = false

	export default {
		components: {
			NetworkBar,
			Onboarding
		},
		onLaunch: function() {
			console.log('[app] start')
			try {
				const testCN = '蛋糕定制 - \u86cb\u7cd5\u5b9a\u5236'
				console.log('[app] encoding check:', testCN)
				console.log('[app] env:', typeof uni !== 'undefined' ? 'uni OK' : 'uni MISSING')
			} catch (e) {
				console.error('[app] init error:', e)
			}
		},
		onShow: function() {
			console.log('[app] show')
			this.promptLogin()
		},
		onHide: function() {
			console.log('[app] hide')
		},
		methods: {
			promptLogin() {
				if (loginModalShown) return
				if (userStore.isLoggedIn()) return
				loginModalShown = true
				uni.showModal({
					title: '欢迎光临',
					content: '登录后可提交蛋糕定制订单，方便商家与您联系确认。',
					confirmText: '去登录',
					cancelText: '稍后再说',
					success: (res) => {
						if (res.confirm) {
							uni.switchTab({ url: '/pages/mine/index' })
						}
						loginModalShown = false
					}
				})
			}
		}
	}
</script>

<style lang="scss">
	page {
		background: #f6f1ed;
		/* Mondrian 哲学 — 隐约网格纹理作为秩序感锚点 */
		background-image:
			repeating-linear-gradient(0deg, transparent, transparent 79rpx, rgba(26, 21, 18, 0.015) 79rpx, rgba(26, 21, 18, 0.015) 80rpx),
			repeating-linear-gradient(90deg, transparent, transparent 79rpx, rgba(26, 21, 18, 0.015) 79rpx, rgba(26, 21, 18, 0.015) 80rpx);
		color: #2d2521;
		font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
	}

	view,
	text {
		box-sizing: border-box;
	}
</style>
