// Telecaller mock data, taken from the telecaller-dashboard(personal).html design.

export type CallOutcome = 'Connected' | 'No answer' | 'Busy';

export interface TcLead {
  id: string;
  name: string;
  village: string;
  interest: string;
  status: 'Pending' | CallOutcome;
}

export interface CallLogEntry {
  id: string;
  lead: string;
  time: string;
  outcome: CallOutcome;
  duration: string;
  notes: string;
}

export interface FollowUp {
  id: string;
  name: string;
  reason: string;
  lastContacted: string;
  due: string;
  status: 'Due today' | 'Overdue' | 'Upcoming' | 'Completed';
}

export interface Complaint {
  id: string;
  customer: string;
  issue: string;
  order: string;
  status: 'Open' | 'In progress' | 'Resolved';
  date: string;
}

export interface ConfirmedOrder {
  lead: string;
  product: string;
  amount: number;
}

export const DAILY_CALL_TARGET = 50;
export const MONTHLY_CALL_TARGET = 900;

// Calls already made today / this month before the leads below were loaded.
export const INITIAL_OUTCOME_COUNTS: Record<CallOutcome, number> = {
  Connected: 21,
  'No answer': 7,
  Busy: 4,
};
export const INITIAL_MONTH_CALLS = 640;

export const INITIAL_TC_LEADS: TcLead[] = [
  { id: 'L-1', name: 'Rina Patra', village: 'Nimapada', interest: 'Vegetable seed kit', status: 'Pending' },
  { id: 'L-2', name: 'Ajit Behera', village: 'Pipili', interest: 'Bulk paddy seed', status: 'Pending' },
  { id: 'L-3', name: 'Subrat Swain', village: 'Balianta', interest: 'Organic fertilizer', status: 'Connected' },
  { id: 'L-4', name: 'Manju Dei', village: 'Khordha', interest: 'Neem-based pesticide', status: 'No answer' },
  { id: 'L-5', name: 'Rajesh Nayak', village: 'Jatni', interest: 'Drip irrigation kit', status: 'Connected' },
  { id: 'L-6', name: 'Sunita Rout', village: 'Balugaon', interest: 'Cold-pressed mustard oil', status: 'Pending' },
  { id: 'L-7', name: 'Kalia Pradhan', village: 'Delang', interest: 'Vermicompost', status: 'Busy' },
];

export const INITIAL_CALL_LOG: CallLogEntry[] = [
  { id: 'C-4', lead: 'Subrat Swain', time: '11:42 AM', outcome: 'Connected', duration: '3m 20s', notes: 'Interested, will decide by Friday' },
  { id: 'C-3', lead: 'Manju Dei', time: '11:35 AM', outcome: 'No answer', duration: '—', notes: 'Retry after 2 PM' },
  { id: 'C-2', lead: 'Rajesh Nayak', time: '11:20 AM', outcome: 'Connected', duration: '5m 05s', notes: 'Confirmed order, passed to Orders' },
  { id: 'C-1', lead: 'Kalia Pradhan', time: '11:05 AM', outcome: 'Busy', duration: '—', notes: 'Retry tomorrow morning' },
];

export const INITIAL_FOLLOW_UPS: FollowUp[] = [
  { id: 'F-1', name: 'Suresh Jena', reason: 'Wants pricing on drip irrigation kit', lastContacted: '2 days ago', due: '2:30 PM', status: 'Due today' },
  { id: 'F-2', name: 'Ipsita Rout', reason: 'Confirm delivery address', lastContacted: 'Yesterday', due: '4:00 PM', status: 'Due today' },
  { id: 'F-3', name: 'Bikram Dash', reason: 'Bulk seed enquiry', lastContacted: '3 days ago', due: 'Yesterday', status: 'Overdue' },
  { id: 'F-4', name: 'Lopamudra Sethi', reason: 'No answer twice', lastContacted: '4 days ago', due: '2 days ago', status: 'Overdue' },
  { id: 'F-5', name: 'Ganesh Nayak', reason: 'Wants a farm visit before ordering', lastContacted: 'Today', due: 'Tomorrow', status: 'Upcoming' },
  { id: 'F-6', name: 'Sabitri Das', reason: 'Vermicompost bulk rate', lastContacted: 'Today', due: 'In 2 days', status: 'Upcoming' },
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  { id: 'CMP-118', customer: 'Manoj Mallick', issue: 'Delayed delivery', order: 'MK-2458', status: 'Open', date: 'Today' },
  { id: 'CMP-117', customer: 'Priyanka Patra', issue: 'Wrong item received', order: 'MK-2457', status: 'In progress', date: 'Yesterday' },
  { id: 'CMP-110', customer: 'Debasish Nayak', issue: 'Packaging damaged', order: 'MK-2402', status: 'Resolved', date: '5 days ago' },
  { id: 'CMP-108', customer: 'Snehalata Behera', issue: 'Refund request', order: 'MK-2390', status: 'Resolved', date: '6 days ago' },
  { id: 'CMP-105', customer: 'Rakesh Sahoo', issue: 'Product quality concern', order: 'MK-2375', status: 'Resolved', date: '8 days ago' },
];

export const CONFIRMED_ORDERS: ConfirmedOrder[] = [
  { lead: 'Rajesh Nayak', product: 'Drip irrigation kit', amount: 3200 },
  { lead: 'Subrat Swain', product: 'Organic fertilizer', amount: 980 },
  { lead: 'Debasish Nayak', product: 'Swarna paddy seed', amount: 2400 },
  { lead: 'Priyanka Patra', product: 'Organic turmeric powder', amount: 520 },
];

// Monthly sales, share of the best month (for the bar chart).
export const SALES_TREND = [
  { month: 'Apr', pct: 48 },
  { month: 'May', pct: 55 },
  { month: 'Jun', pct: 50 },
  { month: 'Jul', pct: 66 },
  { month: 'Aug', pct: 60 },
  { month: 'Sep', pct: 82 },
];

export const SALES_SUMMARY = {
  monthSales: '₹86,400',
  ordersConfirmed: 14,
  conversionRate: '18%',
  avgOrderValue: '₹6,171',
};

export const TC_REPORTS = [
  { name: 'Call performance', desc: 'Calls made, connect rate, average call duration.', last: 'today' },
  { name: 'Conversion report', desc: 'Leads called vs. orders confirmed, by week.', last: 'today' },
  { name: 'Follow-up SLA', desc: 'On-time vs. overdue follow-ups.', last: 'yesterday' },
  { name: 'Complaint resolution', desc: 'Complaints handled, average time to resolve.', last: '3 days ago' },
  { name: 'Monthly summary', desc: 'Full performance recap for payroll & review.', last: 'today' },
];

export const TC_NOTIFICATIONS = [
  { id: 't1', title: 'Follow-up overdue', message: 'Bikram Dash — bulk seed enquiry was due yesterday.', time: '5 mins ago', type: 'warning' as const },
  { id: 't2', title: 'New complaint assigned', message: 'CMP-118 · Manoj Mallick · Delayed delivery.', time: '30 mins ago', type: 'info' as const },
  { id: 't3', title: 'Order confirmed', message: 'Rajesh Nayak’s drip irrigation kit order passed to Orders.', time: '1 hour ago', type: 'success' as const },
  { id: 't4', title: 'Target reminder', message: '18 calls left to hit today’s target of 50.', time: '2 hours ago', type: 'info' as const },
];
