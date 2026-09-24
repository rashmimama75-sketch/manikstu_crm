// Sample data for the Manager Dashboard, shaped like the manikstu-backend tables
// (tracker_* telecalling tables, orders, enquiries) so it can be swapped for the
// real API later. Rows are generated from a fixed seed, so they are the same on
// every load.

import { CATALOG_PRODUCTS } from './catalogProducts';

export const TODAY = '2026-09-24';

export interface Telecaller { id: number; name: string }
export interface Vertical { id: number; name: string; slug: string; is_active: boolean }
export interface Stage { id: number; vertical_id: number; name: string; sort_order: number }
export interface TrackerProduct { id: number; vertical_id: number; name: string; price: number }

export interface TrackerLead {
  id: number;
  vertical_id: number;
  stage_id: number;
  assigned_to: number;
  customer_name: string;
  phone: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export type CallOutcome = 'Connected' | 'No answer' | 'Busy' | 'Wrong number';

/** A logged call (`tracker_lead_activities`). `outcome` and `duration_sec` are not in the backend yet. */
export interface LeadActivity {
  id: number;
  lead_id: number;
  caller_id: number;
  stage_id: number | null;
  note: string;
  outcome: CallOutcome;
  duration_sec: number | null;
  created_at: string;
}

/** Call targets per telecaller. Not in the backend yet. */
export const CALL_TARGET_DAILY = 40;
export const CALL_TARGET_MONTHLY = 800;

export interface Followup {
  id: number;
  lead_id: number;
  caller_id: number;
  due_at: string;
  note: string;
  status: 'pending' | 'done' | 'missed';
  completed_at: string | null;
}

export interface TrackerSale {
  id: number;
  lead_id: number | null;
  product_id: number;
  caller_id: number;
  customer_name: string;
  quantity: number;
  amount: number;
  sold_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'UPI' | 'COD' | 'Card' | 'Net banking';
export type OrderSource = 'website' | 'telecaller';

export interface OrderItem { product_name: string; quantity: number; price: number }

/**
 * One order, from either the website (`orders` + `order_items` + `customers`) or a
 * telecaller (`tracker_sales`). `source`, `caller_id` and `status_history` are not
 * in the backend yet: see the gaps listed on the Orders page.
 */
export interface SalesOrder {
  id: number;
  order_number: string;
  source: OrderSource;
  caller_id: number | null;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
  status_history: { status: OrderStatus; at: string }[];
}

export type EnquiryType = 'general' | 'sales' | 'partnership' | 'career';
export type EnquiryStatus = 'new' | 'read' | 'replied' | 'archived';

/** Website contact-form enquiry (`enquiries` table). `lead_id` is not in the backend yet. */
export interface WebEnquiry {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  type: EnquiryType;
  message: string;
  status: EnquiryStatus;
  admin_notes: string | null;
  replied_at: string | null;
  customer_id: number | null;
  lead_id: number | null;
  created_at: string;
}

export const TELECALLERS: Telecaller[] = [
  { id: 11, name: 'Ananya Mishra' },
  { id: 12, name: 'Bikash Pradhan' },
  { id: 13, name: 'Rashmita Sahu' },
  { id: 14, name: 'Deepak Behera' },
  { id: 15, name: 'Sonali Das' },
];

export const VERTICALS: Vertical[] = [
  { id: 1, name: 'Goat Health Products', slug: 'goat-health-products', is_active: true },
  { id: 2, name: 'Goat Insurance', slug: 'goat-insurance', is_active: true },
  { id: 3, name: 'Goat Bank', slug: 'goat-bank', is_active: true },
];

export const STAGES: Stage[] = [
  { id: 1, vertical_id: 1, name: 'New', sort_order: 1 },
  { id: 2, vertical_id: 1, name: 'Contacted', sort_order: 2 },
  { id: 3, vertical_id: 1, name: 'Interested', sort_order: 3 },
  { id: 4, vertical_id: 1, name: 'Sample sent', sort_order: 4 },
  { id: 5, vertical_id: 1, name: 'Won', sort_order: 5 },
  { id: 6, vertical_id: 1, name: 'Lost', sort_order: 6 },
  { id: 7, vertical_id: 2, name: 'New', sort_order: 1 },
  { id: 8, vertical_id: 2, name: 'Contacted', sort_order: 2 },
  { id: 9, vertical_id: 2, name: 'Documents', sort_order: 3 },
  { id: 10, vertical_id: 2, name: 'Policy issued', sort_order: 4 },
  { id: 11, vertical_id: 2, name: 'Lost', sort_order: 5 },
  { id: 12, vertical_id: 3, name: 'New', sort_order: 1 },
  { id: 13, vertical_id: 3, name: 'Contacted', sort_order: 2 },
  { id: 14, vertical_id: 3, name: 'Site visit', sort_order: 3 },
  { id: 15, vertical_id: 3, name: 'Enrolled', sort_order: 4 },
  { id: 16, vertical_id: 3, name: 'Lost', sort_order: 5 },
];

export const TRACKER_PRODUCTS: TrackerProduct[] = [
  { id: 1, vertical_id: 1, name: 'Poshak Tatwa', price: 249 },
  { id: 2, vertical_id: 1, name: 'Livtherapy Syrup', price: 173 },
  { id: 3, vertical_id: 1, name: 'Pachak Tatwa', price: 172 },
  { id: 4, vertical_id: 1, name: 'Kurmi Nashak', price: 150 },
  { id: 5, vertical_id: 1, name: 'Tickclear Soap', price: 130 },
  { id: 6, vertical_id: 1, name: 'Multi Mineral Lick Block', price: 250 },
  { id: 7, vertical_id: 1, name: 'Protein Block', price: 275 },
  { id: 8, vertical_id: 2, name: 'Goat Insurance · 1 year', price: 600 },
  { id: 9, vertical_id: 3, name: 'Goat Bank Starter Unit', price: 9500 },
];

const FIRST = ['Ramesh', 'Sunita', 'Pradeep', 'Manoj', 'Kabita', 'Sanjay', 'Laxmi', 'Bijay', 'Gita', 'Rabindra', 'Pramila', 'Ashok', 'Mamata', 'Hemant', 'Sabita', 'Niranjan', 'Jyoti', 'Tapan'];
const LAST = ['Nayak', 'Behera', 'Sahoo', 'Mallick', 'Patra', 'Das', 'Jena', 'Swain', 'Rout', 'Majhi', 'Pradhan', 'Barik'];
export const LEAD_SOURCES = ['Website', 'Missed call', 'Field agent', 'Facebook', 'Referral', 'Village camp'];

// Small deterministic PRNG (mulberry32) so the sample data is stable.
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20260924);
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

const pad = (n: number) => String(n).padStart(2, '0');
/** ISO-like local timestamp `daysAgo` days before TODAY (negative = after) at the given hour. */
function at(daysAgo: number, hour = 10, minute = 0): string {
  const d = new Date(`${TODAY}T00:00:00`);
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(hour)}:${pad(minute)}`;
}

const stagesOf = (verticalId: number) => STAGES.filter(s => s.vertical_id === verticalId);
const WON_STAGE_NAMES = ['Won', 'Policy issued', 'Enrolled'];
export const isWonStage = (stage: Stage | undefined) => !!stage && WON_STAGE_NAMES.includes(stage.name);

// ---- Leads, activities, follow-ups, sales -------------------------------------------------

export const TRACKER_LEADS: TrackerLead[] = [];
export const LEAD_ACTIVITIES: LeadActivity[] = [];
export const FOLLOWUPS: Followup[] = [];
export const TRACKER_SALES: TrackerSale[] = [];

// The last telecaller has logged nothing today, so the dashboard has someone to flag.
const IDLE_TODAY = 15;

const CALL_NOTES: Record<CallOutcome, string[]> = {
  Connected: [
    'Explained product benefits', 'Shared price list on WhatsApp', 'Interested, discussing with family',
    'Asked for dosage details', 'Will order after payday', 'Confirmed delivery address',
  ],
  'No answer': ['Not reachable', 'Rang out, will retry', 'No answer, try in the evening'],
  Busy: ['Line busy', 'Phone switched off'],
  'Wrong number': ['Wrong number, lead details need checking'],
};

function logCall(leadId: number, callerId: number, stageId: number, daysAgo: number, hour = int(9, 18)) {
  const r = rand();
  const outcome: CallOutcome = r < 0.55 ? 'Connected' : r < 0.83 ? 'No answer' : r < 0.95 ? 'Busy' : 'Wrong number';
  LEAD_ACTIVITIES.push({
    id: LEAD_ACTIVITIES.length + 1,
    lead_id: leadId,
    caller_id: callerId,
    stage_id: stageId,
    note: pick(CALL_NOTES[outcome]),
    outcome,
    duration_sec: outcome === 'Connected' ? int(60, 480) : null,
    created_at: at(daysAgo, hour, int(0, 59)),
  });
}

// When each lead was created and last touched (days ago), for placing calls realistically.
const leadWindow = new Map<number, { created: number; lastTouch: number }>();

const FOLLOWUP_NOTES: Record<number, string[]> = {
  1: ['Confirm order quantity', 'Check if sample worked', 'Share dosage chart', 'Confirm delivery address'],
  2: ['Share insurance form', 'Collect ear-tag photos', 'Confirm number of goats'],
  3: ['Schedule site visit', 'Explain Goat Bank terms', 'Collect documents'],
};

// The first few leads arrived this morning and nobody has called them yet.
const FRESH_LEADS = 8;

for (let id = 1; id <= 150; id++) {
  const fresh = id <= FRESH_LEADS;
  const vertical = pick([1, 1, 1, 1, 2, 2, 3]);
  const stages = stagesOf(vertical);
  // Weight towards early stages, like a real funnel.
  const stageIdx = fresh ? 0 : Math.min(stages.length - 1, Math.floor(Math.pow(rand(), 1.6) * stages.length));
  const stage = stages[stageIdx];
  const caller = fresh ? TELECALLERS[(id - 1) % TELECALLERS.length].id : pick(TELECALLERS).id;
  const createdDaysAgo = fresh ? 0 : int(0, 34);
  // Most leads were touched in the last few days; a few have gone quiet.
  const lastTouch = Math.min(createdDaysAgo, rand() < 0.85 ? int(0, 2) : int(3, 12));

  TRACKER_LEADS.push({
    id,
    vertical_id: vertical,
    stage_id: stage.id,
    assigned_to: caller,
    customer_name: `${pick(FIRST)} ${pick(LAST)}`,
    phone: `9${int(100000000, 999999999)}`,
    source: pick(LEAD_SOURCES),
    created_at: at(createdDaysAgo, int(9, 18), int(0, 59)),
    updated_at: at(lastTouch, int(9, 18), int(0, 59)),
  });

  // Fresh leads get no calls (created: -1 keeps them out of the daily call volume below).
  leadWindow.set(id, { created: fresh ? -1 : createdDaysAgo, lastTouch });
  if (fresh) continue;

  // Call log: a few calls between creation and last touch.
  const calls = int(1, 4);
  for (let c = 0; c < calls; c++) {
    let day = int(lastTouch, createdDaysAgo);
    if (day === 0 && caller === IDLE_TODAY) day = 1;
    logCall(id, caller, stage.id, day);
  }

  // Follow-ups for open leads.
  if (!isWonStage(stage) && stage.name !== 'Lost' && rand() < 0.8) {
    // Mostly around today; negative = in the future
    const dueDaysAgo = pick([-3, -2, -1, -1, 0, 0, 0, 0, 1, 1, 2, 4, 6]);
    const status: Followup['status'] =
      dueDaysAgo > 0 ? (rand() < 0.7 ? 'done' : 'missed') : dueDaysAgo === 0 && rand() < 0.3 ? 'done' : 'pending';
    const due = at(dueDaysAgo, int(10, 18));
    FOLLOWUPS.push({
      id: FOLLOWUPS.length + 1,
      lead_id: id,
      caller_id: caller,
      due_at: due,
      note: pick(FOLLOWUP_NOTES[vertical]),
      status,
      completed_at: status === 'done' ? due : null,
    });
  }

  // Won leads have one or two sales.
  if (isWonStage(stage)) {
    const products = TRACKER_PRODUCTS.filter(p => p.vertical_id === vertical);
    for (let s = 0; s < int(1, 2); s++) {
      const product = pick(products);
      const quantity = vertical === 1 ? int(2, 12) : 1;
      TRACKER_SALES.push({
        id: TRACKER_SALES.length + 1,
        lead_id: id,
        product_id: product.id,
        caller_id: caller,
        customer_name: TRACKER_LEADS[id - 1].customer_name,
        quantity,
        amount: product.price * quantity,
        sold_at: at(lastTouch).slice(0, 10),
      });
    }
  }
}

// A normal month of calling: 20–34 calls per telecaller per working day (fewer so far today),
// each to one of their leads that existed then and hadn't gone quiet yet.
{
  const dayOfMonth = Number(TODAY.slice(8, 10));
  for (let d = dayOfMonth - 1; d >= 0; d--) {
    const date = new Date(`${TODAY}T00:00:00`);
    date.setDate(date.getDate() - d);
    if (date.getDay() === 0) continue; // Sundays off
    for (const t of TELECALLERS) {
      if (d === 0 && t.id === IDLE_TODAY) continue;
      const eligible = TRACKER_LEADS.filter(l => {
        const w = leadWindow.get(l.id)!;
        return l.assigned_to === t.id && w.created >= d && d >= w.lastTouch;
      });
      if (eligible.length === 0) continue;
      const n = d === 0 ? int(12, 26) : int(20, 34);
      for (let k = 0; k < n; k++) {
        const lead = pick(eligible);
        logCall(lead.id, t.id, lead.stage_id, d, d === 0 ? int(9, 16) : int(9, 18));
      }
    }
  }
  LEAD_ACTIVITIES.sort((a, b) => a.created_at.localeCompare(b.created_at));
  LEAD_ACTIVITIES.forEach((a, i) => { a.id = i + 1; });
}

// Repeat orders from existing customers (no lead attached), spread over the last 30 days.
for (let i = 0; i < 70; i++) {
  const product = pick(TRACKER_PRODUCTS.filter(p => p.vertical_id === 1));
  const quantity = int(1, 10);
  TRACKER_SALES.push({
    id: TRACKER_SALES.length + 1,
    lead_id: null,
    product_id: product.id,
    caller_id: pick(TELECALLERS).id,
    customer_name: `${pick(FIRST)} ${pick(LAST)}`,
    quantity,
    amount: product.price * quantity,
    sold_at: at(int(0, 29)).slice(0, 10),
  });
}

// Insurance renewals for existing policy holders.
const insurance = TRACKER_PRODUCTS.find(p => p.id === 8)!;
for (let i = 0; i < 12; i++) {
  const quantity = int(1, 6); // goats covered
  TRACKER_SALES.push({
    id: TRACKER_SALES.length + 1,
    lead_id: null,
    product_id: insurance.id,
    caller_id: pick(TELECALLERS).id,
    customer_name: `${pick(FIRST)} ${pick(LAST)}`,
    quantity,
    amount: insurance.price * quantity,
    sold_at: at(int(0, 29)).slice(0, 10),
  });
}

// ---- Orders: website orders plus telecaller sales of physical products --------------------

const CITIES = ['Bhubaneswar', 'Cuttack', 'Berhampur', 'Sambalpur', 'Balasore', 'Koraput', 'Rayagada', 'Bolangir', 'Keonjhar', 'Angul'];
const VILLAGES = ['Kendupada', 'Baripada Road', 'Nuagaon', 'Badagaon', 'Chandapur', 'Khandagiri', 'Sunakhala', 'Rampur'];

/** `daysAgo` → timestamp string, offset by extra hours (used to space out status changes). */
function atPlus(daysAgo: number, hour: number, minute: number, extraHours: number): string {
  const d = new Date(`${at(daysAgo, hour, minute)}:00`);
  d.setHours(d.getHours() + extraHours);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Status, payment and history that fit an order of the given age. */
function lifecycle(age: number, method: PaymentMethod, hour: number, minute: number) {
  let status: OrderStatus =
    age <= 1 ? (rand() < 0.7 ? 'pending' : 'confirmed')
    : age <= 4 ? pick(['pending', 'confirmed', 'shipped', 'shipped'] as const)
    : age <= 8 ? pick(['shipped', 'delivered', 'delivered'] as const)
    : rand() < 0.08 ? 'shipped' // stuck with the courier
    : 'delivered';
  if (rand() < 0.08) status = 'cancelled';

  const history: SalesOrder['status_history'] = [{ status: 'pending', at: atPlus(age, hour, minute, 0) }];
  const steps: [OrderStatus, number][] = [['confirmed', 4], ['shipped', 26], ['delivered', 74]];
  if (status === 'cancelled') history.push({ status: 'cancelled', at: atPlus(age, hour, minute, Math.min(20, age * 24)) });
  else for (const [s, h] of steps) {
    if (['pending', 'confirmed', 'shipped', 'delivered'].indexOf(s) > ['pending', 'confirmed', 'shipped', 'delivered'].indexOf(status)) break;
    history.push({ status: s, at: atPlus(age, hour, minute, h) });
  }

  const prepaid = method !== 'COD';
  const payment_status: PaymentStatus =
    status === 'cancelled' ? (prepaid ? 'refunded' : 'unpaid')
    : prepaid ? (status === 'pending' && rand() < 0.3 ? 'unpaid' : 'paid')
    : status === 'delivered' && rand() < 0.8 ? 'paid' : 'unpaid';

  return { status, payment_status, status_history: history };
}

const physicalProducts = TRACKER_PRODUCTS.filter(p => p.vertical_id === 1);

function customerFields() {
  const city = pick(CITIES);
  return {
    phone: `9${int(100000000, 999999999)}`,
    address: `${int(1, 240)}, ${pick(VILLAGES)}`,
    city,
    state: 'Odisha',
    pincode: `7${int(50001, 69999)}`,
  };
}

const websiteOrders: SalesOrder[] = Array.from({ length: 32 }, (_, i) => {
  const age = Math.floor((31 - i) * 1.1);
  const hour = int(8, 21);
  const minute = int(0, 59);
  const method: PaymentMethod = pick(['UPI', 'UPI', 'UPI', 'COD', 'COD', 'COD', 'Card', 'Net banking']);
  // Website orders come from the website catalogue (only products with a price can be bought)
  const products = CATALOG_PRODUCTS.filter(p => p.price !== null).sort(() => rand() - 0.5).slice(0, int(1, 3));
  const items = products.map(p => ({ product_name: p.name, quantity: int(1, 4), price: p.price! }));
  return {
    id: 1000 + i,
    order_number: `MNK-${10480 + i}`,
    source: 'website',
    caller_id: null,
    customer_name: `${pick(FIRST)} ${pick(LAST)}`,
    ...customerFields(),
    items,
    total: items.reduce((a, it) => a + it.price * it.quantity, 0),
    payment_method: method,
    notes: rand() < 0.15 ? pick(['Deliver after 5 pm', 'Call before delivery', 'Gift pack requested']) : null,
    created_at: at(age, hour, minute),
    ...lifecycle(age, method, hour, minute),
  };
});

const telecallerOrders: SalesOrder[] = TRACKER_SALES
  .filter(s => physicalProducts.some(p => p.id === s.product_id))
  .map(s => {
    const product = physicalProducts.find(p => p.id === s.product_id)!;
    const age = daysBeforeToday(s.sold_at);
    const hour = int(9, 18);
    const minute = int(0, 59);
    const method: PaymentMethod = rand() < 0.7 ? 'COD' : 'UPI';
    return {
      id: 5000 + s.id,
      order_number: `TC-${3000 + s.id}`,
      source: 'telecaller',
      caller_id: s.caller_id,
      customer_name: s.customer_name,
      ...customerFields(),
      items: [{ product_name: product.name, quantity: s.quantity, price: product.price }],
      total: s.amount,
      payment_method: method,
      notes: null,
      created_at: at(age, hour, minute),
      ...lifecycle(age, method, hour, minute),
    };
  });

function daysBeforeToday(date: string): number {
  return Math.round((new Date(`${TODAY}T00:00:00`).getTime() - new Date(`${date.slice(0, 10)}T00:00:00`).getTime()) / 86_400_000);
}

/** All orders, newest first. */
export const SALES_ORDERS: SalesOrder[] = [...websiteOrders, ...telecallerOrders].sort((a, b) =>
  b.created_at.localeCompare(a.created_at),
);

// ---- Website enquiries --------------------------------------------------------------------

const ENQUIRY_EXTRAS = { admin_notes: null, replied_at: null, customer_id: null, lead_id: null };

const namedEnquiries: WebEnquiry[] = [
  { id: 1, name: 'Gudu Pradhan', email: 'mrgudu341@gmail.com', phone: '9437011223', type: 'sales', message: 'Price for 20 mineral lick blocks? We have 45 goats in our village group and want delivery to Rayagada.', status: 'new', created_at: at(6, 11, 20), ...ENQUIRY_EXTRAS },
  { id: 2, name: 'Sasmita Rout', email: 'sasmita.rout@gmail.com', phone: '9861234410', type: 'sales', message: 'Is Livtherapy syrup available in Koraput? My goats have stopped eating properly after the rains.', status: 'new', created_at: at(2, 16, 5), ...ENQUIRY_EXTRAS },
  { id: 3, name: 'Kalinga FPO', email: 'contact@kalingafpo.org', phone: '9776543210', type: 'partnership', message: 'We want to become a distributor for our 300 members across Kalahandi. Please share dealer margins and terms.', status: 'new', created_at: at(4, 10, 40), ...ENQUIRY_EXTRAS },
  { id: 4, name: 'Priyanka Swain', email: 'priyanka.swain@gmail.com', phone: null, type: 'career', message: 'Applying for the field officer role. I have a B.V.Sc. and two years with a dairy cooperative.', status: 'new', created_at: at(1, 9, 15), ...ENQUIRY_EXTRAS },
  { id: 5, name: 'Rakesh Majhi', email: 'rakeshmajhi@yahoo.com', phone: '9938800112', type: 'general', message: 'How does the Goat Bank work? Who can join and what do we pay?', status: 'new', created_at: at(0, 8, 50), ...ENQUIRY_EXTRAS },
  { id: 6, name: 'Anil Barik', email: 'anil.barik@gmail.com', phone: '9040011223', type: 'sales', message: 'Need insurance for 12 goats. What documents are needed?', status: 'read', created_at: at(3, 13, 30), ...ENQUIRY_EXTRAS },
  { id: 7, name: 'Maa Tarini SHG', email: 'tarinishg@gmail.com', phone: '9124455667', type: 'partnership', message: 'Can you run a goat-rearing training for our 40 women members?', status: 'replied', created_at: at(8, 12, 0), ...ENQUIRY_EXTRAS, replied_at: at(7, 10, 30), admin_notes: 'Training booked for next month at Angul.' },
  { id: 8, name: 'Bishnu Das', email: 'bishnu.das@gmail.com', phone: '9853322110', type: 'sales', message: 'Bulk order of Tickclear soap for our cooperative, around 200 bars.', status: 'replied', created_at: at(9, 15, 45), ...ENQUIRY_EXTRAS, replied_at: at(9, 18, 10) },
  { id: 9, name: 'Sujata Patra', email: 'sujata.p@gmail.com', phone: null, type: 'career', message: 'Internship enquiry for the summer.', status: 'archived', created_at: at(14, 11, 10), ...ENQUIRY_EXTRAS },
];

const ENQUIRY_MESSAGES: Record<EnquiryType, string[]> = {
  sales: [
    'What is the price of Poshak Tatwa for 10 goats for a month?',
    'Do you deliver Protein Block to my village? Please call me.',
    'I want to buy Kurmi Nashak. Is cash on delivery available?',
    'Need a quote for Multi Mineral Lick Blocks, 50 pieces.',
    'How much is goat insurance per animal for one year?',
    'Can I buy Pachak Tatwa and Livtherapy together at a discount?',
  ],
  partnership: [
    'We run an agri input shop in Sambalpur and want to stock your products.',
    'Our NGO works with 20 villages. Can we partner for the Goat Bank?',
    'Interested in a franchise hub in Bolangir district.',
  ],
  career: [
    'Is there any vacancy for a telecaller who speaks Odia and Hindi?',
    'Applying for a veterinary field assistant position.',
    'Looking for a warehouse job in Bhubaneswar.',
  ],
  general: [
    'Where is your office in Bhubaneswar? I want to visit.',
    'My order has not arrived yet. Whom should I contact?',
    'Do you have a WhatsApp number for advice on goat health?',
    'Can you send someone to check my sick goats?',
  ],
};

// Some enquiries come from people who already ordered, so the detail panel can show their orders.
const repeatCustomers = SALES_ORDERS.filter(o => o.source === 'website').slice(0, 6);

const generatedEnquiries: WebEnquiry[] = Array.from({ length: 26 }, (_, i) => {
  const type: EnquiryType = pick(['sales', 'sales', 'sales', 'general', 'general', 'partnership', 'career']);
  const existing = i % 5 === 0 ? repeatCustomers[i / 5] : undefined;
  const first = pick(FIRST);
  const last = pick(LAST);
  const name = existing?.customer_name ?? `${first} ${last}`;
  const age = int(0, 40);
  const hour = int(7, 22);
  const status: EnquiryStatus =
    age <= 1 ? (rand() < 0.75 ? 'new' : 'read')
    : age <= 6 ? pick(['new', 'read', 'read', 'replied', 'replied'] as const)
    : pick(['read', 'replied', 'replied', 'replied', 'archived'] as const);
  const replyDelayHours = int(2, 60);
  return {
    id: 10 + i,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}${int(1, 99)}@gmail.com`,
    phone: existing?.phone ?? (rand() < 0.85 ? `9${int(100000000, 999999999)}` : null),
    type,
    message: pick(ENQUIRY_MESSAGES[type]),
    status,
    admin_notes: status === 'replied' && rand() < 0.3 ? pick(['Sent price list', 'Shared nearest dealer contact', 'Asked to call the helpline']) : null,
    replied_at: status === 'replied' || (status === 'archived' && rand() < 0.5)
      ? atPlus(age, hour, 0, Math.min(replyDelayHours, age * 24)) : null,
    customer_id: existing ? existing.id : null,
    lead_id: null,
    created_at: at(age, hour, int(0, 59)),
  };
});

/** All enquiries, newest first. */
export const WEB_ENQUIRIES: WebEnquiry[] = [...namedEnquiries, ...generatedEnquiries].sort((a, b) =>
  b.created_at.localeCompare(a.created_at),
);
