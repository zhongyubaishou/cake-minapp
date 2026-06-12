import { getStorage, setStorage } from '@/utils/storage'

const HISTORY_KEY = 'browsing_history'
const MAX_ITEMS = 10

export function addBrowsingHistory(item) {
	const list = getBrowsingHistory()
	const filtered = list.filter(i => i.id !== item.id)
	filtered.unshift({ ...item, timestamp: Date.now() })
	if (filtered.length > MAX_ITEMS) filtered.length = MAX_ITEMS
	setStorage(HISTORY_KEY, filtered)
}

export function getBrowsingHistory() {
	return getStorage(HISTORY_KEY, [])
}

export function getRecentBrowsing(limit = 3) {
	return getBrowsingHistory().slice(0, limit)
}
