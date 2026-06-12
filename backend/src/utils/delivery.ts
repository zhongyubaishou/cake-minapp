/**
 * 配送工具函数
 * - Haversine 距离计算
 * - 配送费计算
 */

const EARTH_RADIUS_KM = 6371;

/** 计算两点间 Haversine 距离（km），保留 3 位小数 */
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = EARTH_RADIUS_KM * c;
  // 保留 3 位小数
  return Math.round(km * 1000) / 1000;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 计算配送费（元）：向上取整的公里数 × 每公里单价，不足1公里按1公里计 */
export function calcDeliveryFee(distanceKm: number, feePerKm: number): number {
  const roundedKm = Math.max(1, Math.ceil(distanceKm));
  return roundedKm * feePerKm;
}

/** 判断是否在配送范围内 */
export function isInDeliveryRange(distanceKm: number, rangeKm: number): boolean {
  return distanceKm <= rangeKm;
}
