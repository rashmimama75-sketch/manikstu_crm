import { SalesOrder, OrderStatus } from '../../data/managerDashboard';
import { addHours } from '../../data/complaints';
import { nowStamp, shortDate } from '../../lib/format';

// Shipment tracking for the head's Orders page. The backend only stores the order status
// (pending / confirmed / shipped / delivered / cancelled); packing, courier, AWB and hub scans
// are sample details worked out from each order's status history until a shipments table exists.

export type TrackStage = 'placed' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';

export const STAGE_FLOW: TrackStage[] = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
export const STAGE_LABEL: Record<TrackStage, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'In transit',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};
export const STAGE_CHIP: Record<TrackStage, string> = {
  placed: 'pending',
  confirmed: 'confirmed',
  packed: 'confirmed',
  shipped: 'transit',
  out_for_delivery: 'transit',
  delivered: 'delivered',
  cancelled: 'muted',
};

export interface TrackEvent {
  stage: TrackStage | 'scan';
  at: string;
  text: string;
  place: string;
}

export interface Tracking {
  stage: TrackStage;
  courier: string | null;
  awb: string | null;
  /** Courier's promised date once shipped; otherwise an estimate. */
  expected_at: string | null;
  expectedIsEstimate: boolean;
  delayed: boolean;
  events: TrackEvent[];
}

const WAREHOUSE = 'Bhubaneswar warehouse';
const HUB: Record<string, string> = {
  Bhubaneswar: 'Bhubaneswar', Cuttack: 'Cuttack', Berhampur: 'Berhampur', Sambalpur: 'Sambalpur', Balasore: 'Balasore',
  Koraput: 'Berhampur', Rayagada: 'Berhampur', Bolangir: 'Sambalpur', Keonjhar: 'Balasore', Angul: 'Cuttack',
};
const COURIERS = [
  { name: 'India Post', prefix: 'EO', days: 5 },
  { name: 'Delhivery', prefix: 'DL', days: 3 },
  { name: 'DTDC', prefix: 'D7', days: 3 },
  { name: 'Ekart', prefix: 'EK', days: 4 },
];

/** Same pseudo-random numbers for the same order on every load. */
function seeded(id: number) {
  let s = id * 2654435761;
  return () => {
    s = (s ^ (s >>> 13)) * 1274126177;
    s ^= s >>> 16;
    return ((s >>> 0) % 10000) / 10000;
  };
}

const historyAt = (o: SalesOrder, s: OrderStatus) => o.status_history.find(h => h.status === s)?.at ?? null;

export function trackingFor(o: SalesOrder, now = nowStamp()): Tracking {
  const r = seeded(o.id);
  const courier = COURIERS[Math.floor(r() * COURIERS.length)];
  const hub = HUB[o.city] ?? 'Bhubaneswar';
  const where = `${o.city}${hub !== o.city ? ` (via ${hub})` : ''}`;
  const events: TrackEvent[] = [];
  const add = (stage: TrackEvent['stage'], at: string, text: string, place: string) => { if (at <= now) events.push({ stage, at, text, place }); };

  add('placed', o.created_at, o.source === 'website' ? 'Order placed on the website' : 'Order taken on a call', o.source === 'website' ? 'Website' : 'Telecalling team');

  if (o.status === 'cancelled') {
    const at = historyAt(o, 'cancelled') ?? o.created_at;
    add('cancelled', at, `Order cancelled${o.payment_status === 'refunded' ? ', payment refunded' : ''}`, WAREHOUSE);
    return { stage: 'cancelled', courier: null, awb: null, expected_at: null, expectedIsEstimate: false, delayed: false, events };
  }

  const confirmedAt = historyAt(o, 'confirmed');
  const shippedAt = historyAt(o, 'shipped');
  const deliveredAt = historyAt(o, 'delivered');
  if (confirmedAt) add('confirmed', confirmedAt, 'Order confirmed with the customer', WAREHOUSE);

  let packedAt: string | null = null;
  if (shippedAt) packedAt = addHours(shippedAt, -(3 + Math.round(r() * 7)));
  else if (confirmedAt && r() < 0.6) {
    const at = addHours(confirmedAt, 6 + Math.round(r() * 4));
    if (at <= now) packedAt = at;
  }
  if (packedAt) add('packed', packedAt, `Packed: ${o.items.map(i => `${i.product_name} × ${i.quantity}`).join(', ')}`, WAREHOUSE);

  const awb = shippedAt ? `${courier.prefix}${String(o.id * 7919).padStart(9, '0').slice(-9)}IN` : null;
  let expected_at: string | null = null;
  let stage: TrackStage = deliveredAt ? 'delivered' : shippedAt ? 'shipped' : packedAt ? 'packed' : confirmedAt ? 'confirmed' : 'placed';

  if (shippedAt) {
    expected_at = `${addHours(shippedAt, courier.days * 24).slice(0, 10)}T18:00`;
    add('shipped', shippedAt, `Handed to ${courier.name} · AWB ${awb}`, WAREHOUSE);
    if (hub !== 'Bhubaneswar') add('scan', addHours(shippedAt, 14 + Math.round(r() * 8)), `Reached ${hub} hub`, `${hub} hub`);
    if (deliveredAt) {
      add('out_for_delivery', addHours(deliveredAt, -(3 + Math.round(r() * 3))), 'Out for delivery', where);
      add('delivered', deliveredAt, `Delivered to ${o.customer_name}${o.payment_method === 'COD' ? (o.payment_status === 'paid' ? ' · cash collected' : ' · cash not collected yet') : ''}`, o.city);
    } else {
      const ofd = `${now.slice(0, 10)}T09:${String(10 + Math.round(r() * 40)).padStart(2, '0')}`;
      // Out for delivery today only if it's not already past the courier's date (those are just late)
      if (addHours(shippedAt, 40) <= now && expected_at.slice(0, 10) >= now.slice(0, 10) && r() < 0.6) {
        add('out_for_delivery', ofd, 'Out for delivery', where);
        if (events.some(e => e.stage === 'out_for_delivery')) stage = 'out_for_delivery';
      }
    }
  } else {
    expected_at = `${addHours(o.created_at, 5 * 24).slice(0, 10)}T18:00`;
  }

  events.sort((a, b) => a.at.localeCompare(b.at));
  return {
    stage,
    courier: shippedAt ? courier.name : null,
    awb,
    expected_at: stage === 'delivered' ? null : expected_at,
    expectedIsEstimate: !shippedAt,
    delayed: (stage === 'shipped' || stage === 'out_for_delivery') && !!expected_at && expected_at < now,
    events,
  };
}

/** Index of the stage in the normal flow (cancelled = -1). */
export const stageIndex = (s: TrackStage) => STAGE_FLOW.indexOf(s);

/** Short text to send the customer on WhatsApp / SMS. */
export function customerUpdate(o: SalesOrder, t: Tracking): string {
  const items = o.items.map(i => `${i.product_name} × ${i.quantity}`).join(', ');
  const head = `Namaskar ${o.customer_name.split(' ')[0]}, this is Manikstu. Your order ${o.order_number} (${items})`;
  switch (t.stage) {
    case 'cancelled': return `${head} was cancelled.${o.payment_status === 'refunded' ? ' Your payment has been refunded.' : ''}`;
    case 'delivered': return `${head} was delivered. Thank you!`;
    case 'placed': return `${head} is received and will be confirmed shortly.`;
    case 'confirmed': return `${head} is confirmed and being packed. Expected by ${shortDate(t.expected_at!)}.`;
    case 'packed': return `${head} is packed and will be handed to the courier soon. Expected by ${shortDate(t.expected_at!)}.`;
    default: return `${head} is ${t.stage === 'out_for_delivery' ? 'out for delivery today' : 'on the way'} with ${t.courier}, tracking number ${t.awb}.${t.stage === 'shipped' ? ` Expected by ${shortDate(t.expected_at!)}.` : ''}${o.payment_method === 'COD' && o.payment_status !== 'paid' ? ` Please keep ₹${o.total} ready (cash on delivery).` : ''}`;
  }
}
