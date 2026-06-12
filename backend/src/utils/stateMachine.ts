import { OrderStatus } from '@prisma/client';
import { BusinessError } from './errors';

type AllowedTransitions = Partial<Record<OrderStatus, string>>;

// 商家要求：接单后直接进入待自提/待配送（跳过 PAID_WAIT_MAKE、MAKING）。
// 待支付状态预留用于未来微信支付对接。
const ORDER_STATE_MACHINE: Record<OrderStatus, AllowedTransitions> = {
  WAIT_ACCEPT:     { WAIT_PICKUP: 'confirm', WAIT_DELIVERY: 'confirm', CANCELED: 'cancel' },
  WAIT_PAY:        { PAID_WAIT_MAKE: 'pay', CANCELED: 'cancel' },
  PAID_WAIT_MAKE:  { MAKING: 'start_production', CANCELED: 'cancel' },
  MAKING:          { WAIT_PICKUP: 'finish_production', WAIT_DELIVERY: 'finish_production', CANCELED: 'cancel' },
  WAIT_PICKUP:     { COMPLETED: 'pickup_complete', CANCELED: 'cancel' },
  WAIT_DELIVERY:   { DELIVERING: 'start_delivery', CANCELED: 'cancel' },
  DELIVERING:      { COMPLETED: 'delivery_complete', CANCELED: 'cancel' },
  REFUNDING:       { REFUNDED: 'refund_success', PAID_WAIT_MAKE: 'reject_or_fail_refund' },
  COMPLETED: {},
  CANCELED: {},
  REFUNDED: {},
};

export function assertStateTransition(current: OrderStatus, target: OrderStatus): void {
  const allowed = ORDER_STATE_MACHINE[current];
  if (!allowed || !(target in allowed)) {
    throw new BusinessError(409, `状态流转不允许：${current} → ${target}`);
  }
}

export function getTransitionAction(current: OrderStatus, target: OrderStatus): string {
  const allowed = ORDER_STATE_MACHINE[current];
  return allowed?.[target] ?? 'unknown';
}

export { ORDER_STATE_MACHINE };
