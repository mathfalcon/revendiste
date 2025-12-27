import type {OrderStatus} from '@revendiste/shared';

/**
 * Maps order status from English to Spanish
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  expired: 'Expirada',
} as const;

/**
 * Get Spanish label for order status
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}

