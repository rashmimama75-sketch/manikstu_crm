import type { CatalogProduct } from '../../data/catalogProducts';
import type { OrderItem, OrderStatus, SalesOrder } from '../../data/managerDashboard';
import { TODAY } from '../../data/today';
import type { Seller } from '../../data/sellers';
import { daysBefore } from '../../lib/format';

/** One order as a seller sees it: only their own items, and their share of the money. */
export interface SellerOrder {
  order: SalesOrder;
  items: OrderItem[];
  units: number;
  gross: number;
  commission: number;
  net: number;
  deliveredAt: string | null;
  payout: PayoutStatus;
}

/** Order/tracking reference a seller types in by hand when confirming an order (sample data, not backed by the API yet). */
export interface ShipmentDetails {
  orderNo: string;
  trackingNo: string;
  confirmedAt: string;
}

export type PayoutStatus = 'Paid out' | 'Due' | 'On hold' | 'None';

/** Chip class for each payout status. */
export const PAYOUT_CHIP: Record<PayoutStatus, string> = {
  'Paid out': 'delivered',
  Due: 'transit',
  'On hold': 'pending',
  None: 'muted',
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'New',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/** The next step a seller can take on an order, if any. */
export const NEXT_STEP: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  pending: { to: 'confirmed', label: 'Confirm' },
  confirmed: { to: 'shipped', label: 'Mark shipped' },
};

/**
 * The seller's orders, newest first. Payout rule (sample, until the backend has settlements):
 * delivered and paid orders are paid out `payoutAfterDays` after delivery; orders not yet
 * delivered are on hold; cancelled or refunded orders earn nothing.
 */
export function sellerOrders(orders: SalesOrder[], seller: Seller, products: CatalogProduct[]): SellerOrder[] {
  const mine = new Set(products.filter(p => seller.productIds.includes(p.id)).map(p => p.name));
  return orders
    .map(order => {
      const items = order.items.filter(i => mine.has(i.product_name));
      if (items.length === 0) return null;
      const gross = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const commission = Math.round((gross * seller.commissionPct) / 100);
      const deliveredAt = order.status === 'delivered'
        ? [...order.status_history].reverse().find(h => h.status === 'delivered')?.at ?? order.created_at
        : null;
      let payout: PayoutStatus;
      if (order.status === 'cancelled' || order.payment_status === 'refunded') payout = 'None';
      else if (deliveredAt) payout = daysBefore(deliveredAt) >= seller.payoutAfterDays ? 'Paid out' : 'Due';
      else payout = 'On hold';
      return {
        order,
        items,
        units: items.reduce((s, i) => s + i.quantity, 0),
        gross,
        commission,
        net: gross - commission,
        deliveredAt,
        payout,
      };
    })
    .filter((x): x is SellerOrder => x !== null)
    .sort((a, b) => b.order.created_at.localeCompare(a.order.created_at));
}

/** Earnings counted for sales figures: everything except cancelled or refunded orders. */
export const counts = (o: SellerOrder) => o.payout !== 'None';

/** Date of the next weekly payout (Mondays), from the sample TODAY. */
export function nextPayoutDate(): string {
  const d = new Date(`${TODAY}T00:00:00`);
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
