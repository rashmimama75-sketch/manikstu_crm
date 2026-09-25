// Sample complaints for the telecalling head's Complaints page, linked to the sample orders
// and telecallers in managerDashboard.ts. The backend has no complaints table yet
// (TelecallingController::complaints() returns an empty list), so everything here is sample
// data shaped like the table the backend would need.

import { SALES_ORDERS, TELECALLERS, TODAY, SalesOrder } from './managerDashboard';

export type ComplaintStatus = 'open' | 'in_progress' | 'waiting' | 'escalated' | 'resolved' | 'closed';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type Category =
  | 'Delivery delay'
  | 'Wrong item'
  | 'Damaged / leaking'
  | 'Product not working'
  | 'Payment / refund'
  | 'Staff behaviour'
  | 'Other';
export type Channel = 'Phone call' | 'WhatsApp' | 'Website' | 'Field agent';
export type ResolutionType = 'Replacement' | 'Refund' | 'Explanation' | 'Field visit';

/** Who a complaint is with: a telecaller id, the telecalling head, or nobody yet. */
export type Assignee = number | 'head' | null;

export interface ComplaintEvent {
  at: string;
  by: string;
  kind: 'raised' | 'assigned' | 'reassigned' | 'returned' | 'note' | 'call' | 'status' | 'priority' | 'resolved' | 'closed' | 'reopened' | 'escalated';
  text: string;
}

export interface Complaint {
  id: number;
  ticket: string;
  customer_name: string;
  phone: string;
  city: string;
  order_number: string | null;
  product: string | null;
  category: Category;
  channel: Channel;
  description: string;
  priority: Priority;
  status: ComplaintStatus;
  assigned_to: Assignee;
  assigned_at: string | null;
  created_at: string;
  due_at: string;
  resolved_at: string | null;
  resolution_type: ResolutionType | null;
  resolution_note: string | null;
  refund_amount: number | null;
  satisfaction: number | null;
  reopened: boolean;
  /** Set when a telecaller handed the complaint back to the head. */
  returned_note: string | null;
  events: ComplaintEvent[];
}

export const CATEGORIES: Category[] = ['Delivery delay', 'Wrong item', 'Damaged / leaking', 'Product not working', 'Payment / refund', 'Staff behaviour', 'Other'];
export const CHANNELS: Channel[] = ['Phone call', 'WhatsApp', 'Website', 'Field agent'];
export const RESOLUTION_TYPES: ResolutionType[] = ['Replacement', 'Refund', 'Explanation', 'Field visit'];
export const PRIORITIES: Priority[] = ['urgent', 'high', 'medium', 'low'];

/** Hours to resolve, by priority. */
export const SLA_HOURS: Record<Priority, number> = { urgent: 4, high: 24, medium: 48, low: 72 };

/** Priority to suggest for a new complaint. */
export function suggestPriority(category: Category, order?: SalesOrder): Priority {
  if (category === 'Payment / refund' || category === 'Damaged / leaking') return 'high';
  if (category === 'Staff behaviour') return 'high';
  if (category === 'Delivery delay' && order && order.total >= 1500) return 'high';
  if (category === 'Other') return 'low';
  return 'medium';
}

/** "YYYY-MM-DDTHH:mm" plus some hours. */
export function addHours(ts: string, hours: number): string {
  const d = new Date(`${ts}:00`);
  d.setMinutes(d.getMinutes() + Math.round(hours * 60));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ---- Sample generation (fixed seed, so it's the same on every load) -------------------------

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20260925);
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

function at(daysAgo: number, hour: number, minute = 0): string {
  const d = new Date(`${TODAY}T00:00:00`);
  d.setDate(d.getDate() - daysAgo);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(hour)}:${p(minute)}`;
}

const DESCRIPTIONS: Record<Category, string[]> = {
  'Delivery delay': ['Order placed a week ago and still not delivered.', 'Courier says delivered but nothing received.', 'Delivery date keeps changing, customer is upset.'],
  'Wrong item': ['Received Pachak Tatwa instead of Poshak Tatwa.', 'Got 1 block instead of the 3 ordered.', 'Wrong pack size delivered.'],
  'Damaged / leaking': ['Syrup bottle arrived broken and leaking.', 'Mineral block cracked into pieces in transit.', 'Box was wet and the soap packs were damaged.'],
  'Product not working': ['Goats still have ticks after using the soap for 2 weeks.', 'No improvement in appetite after the full course.', 'Customer says the dosage chart is unclear and the goats refused it.'],
  'Payment / refund': ['Paid by UPI twice for the same order.', 'Order was cancelled but refund not received yet.', 'Cash on delivery amount was higher than the invoice.'],
  'Staff behaviour': ['Delivery person was rude and refused to wait.', 'Telecaller kept calling after the customer said no.'],
  Other: ['Wants a printed bill for the loan paperwork.', 'Asked for the product in Odia labelling.'],
};

const HEAD = 'Pradeep Mohanty';
const nameOf = (id: number) => TELECALLERS.find(t => t.id === id)?.name ?? '—';
const active = TELECALLERS.filter(t => t.is_active);
const inactive = TELECALLERS.filter(t => !t.is_active);

function categoryFor(o: SalesOrder): Category {
  if (o.status === 'cancelled' || o.payment_status === 'refunded') return 'Payment / refund';
  if (o.status === 'shipped' || o.status === 'confirmed' || o.status === 'pending') return rand() < 0.8 ? 'Delivery delay' : 'Payment / refund';
  return pick(['Wrong item', 'Damaged / leaking', 'Damaged / leaking', 'Product not working', 'Product not working', 'Payment / refund', 'Staff behaviour', 'Other'] as const);
}

function build(): Complaint[] {
  const pool = [...SALES_ORDERS].sort(() => rand() - 0.5).slice(0, 36);
  const list: Complaint[] = pool.map((o, i) => {
    const category = categoryFor(o);
    const priority: Priority = rand() < 0.12 ? 'urgent' : suggestPriority(category, o) === 'high' ? (rand() < 0.8 ? 'high' : 'medium') : pick(['medium', 'medium', 'low'] as const);
    const age = i < 6 ? 0 : i < 12 ? int(1, 2) : int(2, 28);
    const created = at(age, int(9, 17), int(0, 59));
    const due = addHours(created, SLA_HOURS[priority]);
    const events: ComplaintEvent[] = [{ at: created, by: pick(['Customer call', 'WhatsApp', 'Website form']), kind: 'raised', text: 'Complaint raised' }];

    // Status by age: today's are mostly waiting to be assigned; older ones are progressing or done.
    let status: ComplaintStatus =
      age === 0 ? (rand() < 0.6 ? 'open' : 'in_progress')
      : age <= 2 ? pick(['open', 'in_progress', 'in_progress', 'waiting'] as const)
      : age <= 6 ? pick(['in_progress', 'waiting', 'resolved', 'resolved'] as const)
      : pick(['resolved', 'closed', 'closed', 'resolved'] as const);

    // Who has it: often whoever sold the order, otherwise anyone active.
    let assigned: Assignee = null;
    if (!(status === 'open' && (age === 0 || rand() < 0.5))) {
      assigned = o.caller_id && rand() < 0.6 ? o.caller_id : pick(active).id;
    }
    const assignedAt = assigned !== null ? addHours(created, int(1, 6)) : null;
    if (assigned !== null) events.push({ at: assignedAt!, by: HEAD, kind: 'assigned', text: `Assigned to ${nameOf(assigned as number)}` });
    if (status === 'waiting') events.push({ at: addHours(created, int(8, 30)), by: nameOf(assigned as number), kind: 'status', text: 'Waiting on customer: asked for a photo of the product' });

    let resolved_at: string | null = null;
    let resolution_type: ResolutionType | null = null;
    let resolution_note: string | null = null;
    let refund_amount: number | null = null;
    let satisfaction: number | null = null;
    if (status === 'resolved' || status === 'closed') {
      // Most on time, some late
      resolved_at = addHours(created, SLA_HOURS[priority] * (rand() < 0.75 ? 0.3 + rand() * 0.6 : 1.2 + rand()));
      resolution_type = category === 'Payment / refund' ? 'Refund' : category === 'Damaged / leaking' || category === 'Wrong item' ? 'Replacement' : category === 'Product not working' ? pick(['Explanation', 'Field visit'] as const) : 'Explanation';
      resolution_note = resolution_type === 'Refund' ? 'Refund processed to original payment method.' : resolution_type === 'Replacement' ? 'Replacement sent with the next dispatch.' : resolution_type === 'Field visit' ? 'Field agent visited and explained the dosage.' : 'Explained the process and the customer is satisfied.';
      refund_amount = resolution_type === 'Refund' ? o.total : null;
      satisfaction = rand() < 0.8 ? pick([3, 4, 4, 5, 5, 5]) : null;
      events.push({ at: resolved_at, by: nameOf(assigned as number), kind: 'resolved', text: `Resolved: ${resolution_type}` });
      if (status === 'closed') events.push({ at: addHours(resolved_at, 24), by: HEAD, kind: 'closed', text: 'Closed after follow-up call' });
    }

    return {
      id: i + 1,
      ticket: `CMP-${String(118 - i).padStart(4, '0')}`,
      customer_name: o.customer_name,
      phone: o.phone,
      city: o.city,
      order_number: o.order_number,
      product: o.items[0]?.product_name ?? null,
      category,
      channel: o.source === 'telecaller' ? pick(['Phone call', 'Phone call', 'WhatsApp'] as const) : pick(['Website', 'WhatsApp', 'Phone call'] as const),
      description: pick(DESCRIPTIONS[category]),
      priority,
      status,
      assigned_to: assigned,
      assigned_at: assignedAt,
      created_at: created,
      due_at: due,
      resolved_at,
      resolution_type,
      resolution_note,
      refund_amount,
      satisfaction,
      reopened: false,
      returned_note: null,
      events,
    };
  });

  // A few specific situations the head should see.
  const open = list.filter(c => c.status === 'in_progress' || c.status === 'waiting');
  if (inactive[0] && open[0]) {
    open[0].assigned_to = inactive[0].id; // still with the telecaller who left
    open[0].events.push({ at: open[0].created_at, by: HEAD, kind: 'reassigned', text: `Assigned to ${inactive[0].name}` });
  }
  const returned = list.find(c => c.status === 'in_progress' && c.category === 'Payment / refund') ?? open[1];
  if (returned) {
    const from = typeof returned.assigned_to === 'number' ? nameOf(returned.assigned_to) : 'Telecaller';
    returned.assigned_to = null;
    returned.returned_note = 'Customer wants a refund above ₹1,000: needs the head’s decision.';
    returned.events.push({ at: addHours(returned.created_at, 10), by: from, kind: 'returned', text: `Returned to head: ${returned.returned_note}` });
  }
  const escalated = list.find(c => c.status === 'in_progress' && c.priority !== 'low' && c !== returned);
  if (escalated) {
    escalated.status = 'escalated';
    escalated.events.push({ at: addHours(escalated.created_at, 20), by: HEAD, kind: 'escalated', text: 'Escalated to manager: repeat complaint from the same village' });
  }
  const reopened = list.find(c => c.status === 'resolved');
  if (reopened) {
    reopened.status = 'in_progress';
    reopened.reopened = true;
    reopened.events.push({ at: addHours(reopened.resolved_at!, 30), by: 'Customer call', kind: 'reopened', text: 'Reopened: the problem came back' });
    reopened.resolved_at = null;
  }
  const mine = list.find(c => c.status === 'in_progress' && c.assigned_to !== null && c !== escalated && c !== reopened);
  if (mine) {
    mine.assigned_to = 'head';
    mine.events.push({ at: addHours(mine.created_at, 3), by: HEAD, kind: 'reassigned', text: 'Taken by the telecalling head' });
  }
  return list;
}

export const INITIAL_COMPLAINTS: Complaint[] = build();
