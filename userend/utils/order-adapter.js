import { ORDER_STATUS_TEXT, PAYMENT_METHOD_TEXT, PICKUP_TYPE_TEXT } from '@/constants/order'
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

export function normalizeOrderListItem(item = {}) {
	const pickupType = pickValue(item, ['pickupType', 'pickup_type'], 'SELF_PICKUP')
	const status = pickValue(item, ['status'], 'WAIT_ACCEPT')

	return {
		id: pickValue(item, ['id', 'orderId']),
		orderNo: pickValue(item, ['orderNo', 'order_no']),
		productName: pickValue(item, ['productName', 'product_name', 'name'], '定制蛋糕'),
		productImageUrl: pickValue(item, ['productImageUrl', 'product_image_url', 'productImage', 'imageUrl'], PRODUCT_IMAGE_FALLBACK),
		appointmentTime: pickValue(item, ['appointmentTime', 'appointment_time']),
		pickupType,
		pickupTypeText: pickValue(item, ['pickupTypeText'], PICKUP_TYPE_TEXT[pickupType] || '到店自提'),
		status,
		statusText: pickValue(item, ['statusText'], ORDER_STATUS_TEXT[status] || status),
		totalAmount: pickValue(item, ['totalAmount', 'total_amount'], '待商家确认'),
		productAmount: pickValue(item, ['productAmount', 'product_amount'], '待商家确认'),
		deliveryFee: pickValue(item, ['deliveryFee', 'delivery_fee'], 0),
		categoryName: pickValue(item, ['categoryName', 'category_name'], '定制蛋糕'),
		cancelReason: pickValue(item, ['cancelReason', 'cancel_reason'], ''),
		isOutsideHours: Boolean(pickValue(item, ['isOutsideHours', 'is_outside_hours'], false))
	}
}

export function normalizeOrderDetail(detail = {}) {
	const order = normalizeOrderListItem(detail)
	const customization = pickValue(detail, ['customization', 'orderCustomization'], {}) || {}
	const delivery = pickValue(detail, ['deliveryInfo', 'delivery'], {}) || {}
	const paymentRecords = pickValue(detail, ['paymentRecords', 'payment_records'], []) || []
	const paymentRecord = Array.isArray(paymentRecords) && paymentRecords.length ? paymentRecords[0] : {}
	const paymentMethod = pickValue(detail, ['paymentMethod', 'payment_method'], pickValue(paymentRecord, ['payMethod', 'pay_method'], 'OFFLINE'))
	const referenceImages = pickValue(detail, ['referenceImages', 'reference_images'], pickValue(customization, ['referenceImages', 'reference_images'], []))

	return {
		...order,
		buyPound: pickValue(detail, ['buyPound', 'buy_pound'], pickValue(customization, ['buyPound', 'buy_pound'], 2)),
		actualMakePound: pickValue(detail, ['actualMakePound', 'actual_make_pound'], pickValue(customization, ['actualMakePound', 'actual_make_pound'], 3)),
		flavor: pickValue(detail, ['flavor'], pickValue(customization, ['flavor'], '原味')),
		theme: pickValue(detail, ['theme'], pickValue(customization, ['theme'], '成人')),
		blessingText: pickValue(detail, ['blessingText', 'blessing_text'], pickValue(customization, ['blessingText', 'blessing_text'], '')),
		plateCount: pickValue(detail, ['plateCount', 'plate_count'], pickValue(customization, ['plateCount', 'plate_count'], 1)),
		candleCount: pickValue(detail, ['candleCount', 'candle_count'], pickValue(customization, ['candleCount', 'candle_count'], 1)),
		referenceImages: Array.isArray(referenceImages) ? referenceImages : [],
		userRemark: pickValue(detail, ['userRemark', 'user_remark'], pickValue(customization, ['userRemark', 'user_remark'], '')),
		address: pickValue(detail, ['address'], pickValue(delivery, ['address'], '')),
		contactName: pickValue(detail, ['contactName', 'userNickname', 'user_nickname'], ''),
		receiverName: pickValue(detail, ['receiverName', 'receiver_name'], pickValue(delivery, ['receiverName', 'receiver_name'], '')),
		phone: pickValue(detail, ['phone', 'userPhone', 'user_phone', 'receiverPhone', 'receiver_phone'], pickValue(delivery, ['receiverPhone', 'receiver_phone'], '')),
		distanceKm: pickValue(detail, ['distanceKm', 'distance_km'], pickValue(delivery, ['distanceKm', 'distance_km'], '')),
		createdAt: pickValue(detail, ['createdAt', 'created_at']),
		updatedAt: pickValue(detail, ['updatedAt', 'updated_at']),
		acceptedAt: pickValue(detail, ['acceptedAt', 'accepted_at']),
		paidAt: pickValue(detail, ['paidAt', 'paid_at'], pickValue(paymentRecord, ['paidAt', 'paid_at'])),
		paymentMethod,
		paymentMethodText: PAYMENT_METHOD_TEXT[paymentMethod] || paymentMethod || '未确认',
		transactionNo: pickValue(detail, ['transactionNo', 'transaction_no'], pickValue(paymentRecord, ['transactionNo', 'transaction_no'], '')),
		startMakingAt: pickValue(detail, ['startMakingAt', 'start_making_at']),
		finishedProductionAt: pickValue(detail, ['finishedProductionAt', 'finished_production_at']),
		startedDeliveryAt: pickValue(detail, ['startedDeliveryAt', 'started_delivery_at']),
		completedAt: pickValue(detail, ['completedAt', 'completed_at']),
		cancelReason: pickValue(detail, ['cancelReason', 'cancel_reason'], ''),
		bossRemark: pickValue(detail, ['bossRemark', 'boss_remark'], ''),
		isOutsideHours: Boolean(pickValue(detail, ['isOutsideHours', 'is_outside_hours'], false)),
		afterSale: pickValue(detail, ['afterSale', 'after_sale', 'afterSales'], null)
	}
}
