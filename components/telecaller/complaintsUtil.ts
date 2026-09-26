import { LEAD_ACTIVITIES, SALES_ORDERS, TELECALLERS, TODAY, Telecaller } from '../../data/managerDashboard';
import { Assignee, Complaint, ComplaintStatus, Priority } from '../../data/complaints';
import { nowStamp } from '../../lib/format';

export const STATUS_LABEL: Record<ComplaintStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  waiting: 'Waiting on customer',
  escalated: 'Escalated',
  resolved: 'Resolved',
  closed: 'Closed',
};
export const STATUS_CHIP: Record<ComplaintStatus, string> = {
  open: 'pending',
  in_progress: 'transit',
  waiting: 'confirmed',
  escalated: 'pending',
  resolved: 'delivered',
  closed: 'muted',
};
export const PRIORITY_LABEL: Record<Priority, string> = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' };

/** Not yet resolved or closed. */
export const isActive = (c: Complaint) => c.status !== 'resolved' && c.status !== 'closed';
export const isUnassigned = (c: Complaint) => isActive(c) && c.assigned_to === null;
export const isOverdue = (c: Complaint, now = nowStamp()) => isActive(c) && c.due_at < now;

const minutesBetween = (a: string, b: string) => (new Date(`${b}:00`).getTime() - new Date(`${a}:00`).getTime()) / 60000;

/** "due in 5h", "2d overdue", "resolved in 20h". */
export function deadlineText(c: Complaint, now = nowStamp()): { text: string; late: boolean } {
  if (!isActive(c)) {
    const h = c.resolved_at ? minutesBetween(c.created_at, c.resolved_at) / 60 : 0;
    const late = !!c.resolved_at && c.resolved_at > c.due_at;
    return { text: c.resolved_at ? `resolved in ${h < 48 ? `${Math.round(h)}h` : `${Math.round(h / 24)}d`}` : 'done', late };
  }
  const mins = minutesBetween(now, c.due_at);
  const abs = Math.abs(mins);
  const span = abs < 60 ? `${Math.round(abs)}m` : abs < 48 * 60 ? `${Math.round(abs / 60)}h` : `${Math.round(abs / 1440)}d`;
  return mins >= 0 ? { text: `due in ${span}`, late: false } : { text: `${span} overdue`, late: true };
}

export function assigneeName(a: Assignee, headName: string): string {
  if (a === null) return 'Unassigned';
  if (a === 'head') return `${headName.split(' ')[0]} (head)`;
  return TELECALLERS.find(t => t.id === a)?.name ?? '—';
}

export interface AssignOption {
  t: Telecaller;
  open: number;
  soldOrder: boolean;
  sameRegion: boolean;
  callsToday: number;
  score: number;
}

/**
 * Active telecallers ranked for one complaint. Hints only: the head can pick anyone.
 * Sold the order +3, same region +2, working today +1, minus one per open complaint.
 */
export function assignOptions(complaint: Complaint | null, complaints: Complaint[]): AssignOption[] {
  const order = complaint?.order_number ? SALES_ORDERS.find(o => o.order_number === complaint.order_number) : undefined;
  return TELECALLERS.filter(t => t.is_active)
    .map(t => {
      const open = complaints.filter(c => isActive(c) && c.assigned_to === t.id).length;
      const soldOrder = !!order && order.caller_id === t.id;
      const sameRegion = !!complaint && t.region.toLowerCase() === complaint.city.toLowerCase();
      const callsToday = LEAD_ACTIVITIES.filter(a => a.caller_id === t.id && a.created_at.startsWith(TODAY)).length;
      return { t, open, soldOrder, sameRegion, callsToday, score: (soldOrder ? 3 : 0) + (sameRegion ? 2 : 0) + (callsToday > 0 ? 1 : 0) - open };
    })
    .sort((a, b) => b.score - a.score || a.open - b.open);
}

/** Open complaints above which a telecaller counts as overloaded. */
export const OVERLOAD_AT = 5;
