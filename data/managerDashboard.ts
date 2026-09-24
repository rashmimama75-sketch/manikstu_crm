// Sample data for the Manager Dashboard, shaped like the manikstu-backend tables
// (tracker_* telecalling tables, orders, enquiries) so it can be swapped for the
// real API later. Rows are generated from a fixed seed, so they are the same on
// every load.

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

export interface LeadActivity { id: number; lead_id: number; caller_id: number; stage_id: number | null; note: string; created_at: string }

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

export interface WebOrder {
  id: number;
  order_number: string;
  customer_name: string;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'unpaid' | 'paid' | 'refunded';
  created_at: string;
}

export interface WebEnquiry {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  type: 'general' | 'sales' | 'partnership' | 'career';
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
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

for (let id = 1; id <= 72; id++) {
  const vertical = pick([1, 1, 1, 1, 2, 2, 3]);
  const stages = stagesOf(vertical);
  // Weight towards early stages, like a real funnel.
  const stageIdx = Math.min(stages.length - 1, Math.floor(Math.pow(rand(), 1.6) * stages.length));
  const stage = stages[stageIdx];
  const caller = pick(TELECALLERS).id;
  const createdDaysAgo = int(0, 34);
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

  // Call log: a few calls between creation and last touch.
  const calls = int(1, 4);
  for (let c = 0; c < calls; c++) {
    let day = int(lastTouch, createdDaysAgo);
    if (day === 0 && caller === IDLE_TODAY) day = 1;
    LEAD_ACTIVITIES.push({
      id: LEAD_ACTIVITIES.length + 1,
      lead_id: id,
      caller_id: caller,
      stage_id: stage.id,
      note: pick(['Explained product benefits', 'Asked to call back in evening', 'Shared price list on WhatsApp', 'Interested, discussing with family', 'Not reachable']),
      created_at: at(day, int(9, 18), int(0, 59)),
    });
  }

  // Follow-ups for open leads.
  if (!isWonStage(stage) && stage.name !== 'Lost' && rand() < 0.75) {
    const dueDaysAgo = int(-3, 6); // negative = in the future
    const status: Followup['status'] =
      dueDaysAgo > 0 ? (rand() < 0.7 ? 'done' : 'missed') : dueDaysAgo === 0 && rand() < 0.3 ? 'done' : 'pending';
    const due = at(dueDaysAgo, int(10, 18));
    FOLLOWUPS.push({
      id: FOLLOWUPS.length + 1,
      lead_id: id,
      caller_id: caller,
      due_at: due,
      note: pick(['Confirm order quantity', 'Collect ear-tag photos', 'Share insurance form', 'Check if sample worked', 'Schedule site visit']),
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

// ---- Website orders & enquiries -----------------------------------------------------------

const ORDER_STATUSES: WebOrder['status'][] = ['pending', 'pending', 'confirmed', 'shipped', 'shipped', 'delivered', 'delivered', 'delivered', 'cancelled'];

export const WEB_ORDERS: WebOrder[] = Array.from({ length: 26 }, (_, i) => {
  const status = pick(ORDER_STATUSES);
  const payment_status: WebOrder['payment_status'] =
    status === 'cancelled' ? 'refunded' : status === 'pending' ? (rand() < 0.6 ? 'unpaid' : 'paid') : rand() < 0.15 ? 'unpaid' : 'paid';
  return {
    id: i + 1,
    order_number: `MNK-${10480 + i}`,
    customer_name: `${pick(FIRST)} ${pick(LAST)}`,
    total: pick([249, 346, 498, 520, 750, 825, 1100, 1375, 2250]),
    status,
    payment_status,
    created_at: at(Math.floor((25 - i) * 1.1), int(8, 21), int(0, 59)),
  };
}).reverse();

export const WEB_ENQUIRIES: WebEnquiry[] = [
  { id: 1, name: 'Gudu Pradhan', email: 'mrgudu341@gmail.com', phone: '9437011223', type: 'sales', message: 'Price for 20 mineral lick blocks?', status: 'new', created_at: at(6, 11, 20) },
  { id: 2, name: 'Sasmita Rout', email: 'sasmita.rout@gmail.com', phone: '9861234410', type: 'sales', message: 'Is Livtherapy syrup available in Koraput?', status: 'new', created_at: at(2, 16, 5) },
  { id: 3, name: 'Kalinga FPO', email: 'contact@kalingafpo.org', phone: '9776543210', type: 'partnership', message: 'Want to become a distributor for our 300 members.', status: 'new', created_at: at(4, 10, 40) },
  { id: 4, name: 'Priyanka Swain', email: 'priyanka.swain@gmail.com', phone: null, type: 'career', message: 'Applying for field officer role.', status: 'new', created_at: at(1, 9, 15) },
  { id: 5, name: 'Rakesh Majhi', email: 'rakeshmajhi@yahoo.com', phone: '9938800112', type: 'general', message: 'How does the Goat Bank work?', status: 'new', created_at: at(0, 8, 50) },
  { id: 6, name: 'Anil Barik', email: 'anil.barik@gmail.com', phone: '9040011223', type: 'sales', message: 'Need insurance for 12 goats.', status: 'read', created_at: at(3, 13, 30) },
  { id: 7, name: 'Maa Tarini SHG', email: 'tarinishg@gmail.com', phone: '9124455667', type: 'partnership', message: 'Training for our women members.', status: 'replied', created_at: at(8, 12, 0) },
  { id: 8, name: 'Bishnu Das', email: 'bishnu.das@gmail.com', phone: '9853322110', type: 'sales', message: 'Bulk order of Tickclear soap.', status: 'replied', created_at: at(9, 15, 45) },
  { id: 9, name: 'Sujata Patra', email: 'sujata.p@gmail.com', phone: null, type: 'career', message: 'Internship enquiry.', status: 'archived', created_at: at(14, 11, 10) },
];
