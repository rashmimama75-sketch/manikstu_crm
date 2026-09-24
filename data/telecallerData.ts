// Telecaller complaints, taken from the telecaller-dashboard(personal).html design.
// Sample data only: the backend has no complaints table yet. Leads, calls, follow-ups
// and sales for telecallers come from the shared tracker data in managerDashboard.ts.

export interface Complaint {
  id: string;
  customer: string;
  issue: string;
  order: string;
  status: 'Open' | 'In progress' | 'Resolved';
  date: string;
}

export const INITIAL_COMPLAINTS: Complaint[] = [
  { id: 'CMP-118', customer: 'Manoj Mallick', issue: 'Delayed delivery', order: 'MNK-10505', status: 'Open', date: 'Today' },
  { id: 'CMP-117', customer: 'Priyanka Patra', issue: 'Wrong item received', order: 'MNK-10503', status: 'In progress', date: 'Yesterday' },
  { id: 'CMP-110', customer: 'Debasish Nayak', issue: 'Packaging damaged', order: 'TC-3042', status: 'Resolved', date: '5 days ago' },
  { id: 'CMP-108', customer: 'Snehalata Behera', issue: 'Refund request', order: 'MNK-10490', status: 'Resolved', date: '6 days ago' },
  { id: 'CMP-105', customer: 'Rakesh Sahoo', issue: 'Product quality concern', order: 'TC-3010', status: 'Resolved', date: '8 days ago' },
];
