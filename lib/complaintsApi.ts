import {
  CATEGORIES, CHANNELS, SLA_HOURS, Category, Channel, Complaint, ComplaintEvent, Priority, ResolutionType, RESOLUTION_TYPES,
} from '../data/complaints';
import { addHours } from './time';

// Complaints as the CRM backend stores them, and the shape the dashboards work with. The backend keeps the
// customer's own words and the trail; the deadline (SLA by priority) is worked out here.

/** One ticket as GET /complaints returns it. */
export interface BackendComplaint {
  id: number;
  ticket: string;
  customer_name: string;
  phone: string | null;
  city: string | null;
  order_number: string | null;
  product: string | null;
  category: string | null;
  description: string | null;
  channel: string | null;
  priority: Priority;
  status: Complaint['status'];
  assigned_to: number | 'head' | null;
  assigned_at: string | null;
  created_at: string;
  resolved_at: string | null;
  resolution_type: string | null;
  resolution_note: string | null;
  refund_amount: number | null;
  satisfaction: number | null;
  reopened: boolean;
  returned_note: string | null;
  events: { at: string; by: string | null; kind: string; text: string | null }[];
}

/** The website's complaint form uses these keys; the dashboards use the longer names. */
const WEBSITE_CATEGORY: Record<string, Category> = {
  delivery: 'Delivery delay',
  product: 'Product not working',
  payment: 'Payment / refund',
  service: 'Staff behaviour',
  order: 'Other',
  other: 'Other',
};
const EVENT_KINDS: ComplaintEvent['kind'][] = ['raised', 'assigned', 'reassigned', 'returned', 'note', 'call', 'status', 'priority', 'resolved', 'closed', 'reopened', 'escalated'];

export function fromBackend(b: BackendComplaint): Complaint {
  const category: Category = (CATEGORIES as string[]).includes(b.category ?? '')
    ? (b.category as Category)
    : WEBSITE_CATEGORY[(b.category ?? '').toLowerCase()] ?? 'Other';
  const channel: Channel = (CHANNELS as string[]).includes(b.channel ?? '')
    ? (b.channel as Channel)
    : (b.channel ?? '').toLowerCase() === 'website' ? 'Website' : 'Phone call';
  return {
    id: b.id,
    ticket: b.ticket,
    customer_name: b.customer_name,
    phone: b.phone ?? '',
    city: b.city ?? '',
    order_number: b.order_number,
    product: b.product,
    category,
    channel,
    description: b.description ?? '',
    priority: b.priority,
    status: b.status,
    assigned_to: b.assigned_to,
    assigned_at: b.assigned_at,
    created_at: b.created_at,
    due_at: addHours(b.created_at, SLA_HOURS[b.priority] ?? SLA_HOURS.medium),
    resolved_at: b.resolved_at,
    resolution_type: (RESOLUTION_TYPES as string[]).includes(b.resolution_type ?? '') ? (b.resolution_type as ResolutionType) : null,
    resolution_note: b.resolution_note,
    refund_amount: b.refund_amount,
    satisfaction: b.satisfaction,
    reopened: b.reopened,
    returned_note: b.returned_note,
    events: b.events.map(e => ({
      at: e.at,
      by: e.by ?? '',
      // Older lines use the status itself as the kind (in_progress, waiting…): show those as status changes.
      kind: (EVENT_KINDS as string[]).includes(e.kind) ? (e.kind as ComplaintEvent['kind']) : 'status',
      text: e.text ?? '',
    })),
  };
}

/** The fields a change can carry to the backend. */
export const PATCH_FIELDS = [
  'status', 'priority', 'assigned_to', 'resolution_type', 'resolution_note', 'refund_amount', 'satisfaction', 'reopened', 'returned_note',
] as const;

/** What changed between two versions of one ticket, as a PATCH body. Null when nothing the backend stores changed. */
export function diffToPatch(before: Complaint, after: Complaint): { patch: Record<string, unknown>; event?: { kind: string; text: string } } | null {
  const patch: Record<string, unknown> = {};
  for (const f of PATCH_FIELDS) {
    if (before[f] !== after[f]) patch[f] = after[f];
  }
  const added = after.events.slice(before.events.length);
  const last = added[added.length - 1];
  if (Object.keys(patch).length === 0 && !last) return null;
  return { patch, event: last ? { kind: last.kind, text: last.text } : undefined };
}

/** The body for raising a new ticket. */
export function toCreateBody(c: Complaint): Record<string, unknown> {
  return {
    customer_name: c.customer_name,
    phone: c.phone,
    city: c.city || null,
    order_number: c.order_number,
    product: c.product,
    category: c.category,
    channel: c.channel,
    description: c.description,
    priority: c.priority,
    assigned_to: c.assigned_to,
  };
}
