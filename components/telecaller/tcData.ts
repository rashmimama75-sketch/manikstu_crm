import {
  STAGES,
  TELECALLERS,
  TRACKER_PRODUCTS,
  VERTICALS,
  TODAY,
  CallOutcome,
  Followup,
  LeadActivity,
  Telecaller,
  TrackerLead,
  TrackerSale,
  isWonStage,
} from '../../data/managerDashboard';
import { dayStart, daysBefore } from '../../lib/format';

/** Props every telecaller page gets: this telecaller's own data and the two main actions. */
export interface TcSharedProps {
  me: Telecaller;
  leads: TrackerLead[];
  followups: Followup[];
  activities: LeadActivity[];
  sales: TrackerSale[];
  onCall: (lead: TrackerLead, followup?: Followup) => void;
  onSale: (lead?: TrackerLead) => void;
}

export const stageOf = (id: number) => STAGES.find(s => s.id === id);
export const stageName = (id: number) => stageOf(id)?.name ?? '—';
export const verticalName = (id: number) => VERTICALS.find(v => v.id === id)?.name ?? '—';
export const productName = (id: number) => TRACKER_PRODUCTS.find(p => p.id === id)?.name ?? '—';
export const stagesFor = (verticalId: number) =>
  STAGES.filter(s => s.vertical_id === verticalId).sort((a, b) => a.sort_order - b.sort_order);
export const wonStageFor = (verticalId: number) => stagesFor(verticalId).find(s => isWonStage(s));

export const isOpenLead = (l: TrackerLead) => {
  const s = stageOf(l.stage_id);
  return !isWonStage(s) && s?.name !== 'Lost';
};

/** The telecaller record matching the signed-in user (falls back to the first telecaller). */
export const telecallerFor = (name: string) => TELECALLERS.find(t => t.name === name) ?? TELECALLERS[0];

export const OUTCOMES: CallOutcome[] = ['Connected', 'No answer', 'Busy', 'Wrong number'];
export const OUTCOME_COLORS: Record<CallOutcome, string> = {
  Connected: 'var(--leaf)',
  'No answer': 'var(--gold)',
  Busy: 'var(--rust)',
  'Wrong number': 'var(--ink-soft)',
};

export const time12 = (ts: string) => {
  const [h, m] = ts.slice(11, 16).split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};
export const fmtDuration = (sec: number | null) => (sec === null ? '—' : `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, '0')}s`);

export const lastCallFor = (leadId: number, activities: LeadActivity[]) => {
  for (let i = activities.length - 1; i >= 0; i--) if (activities[i].lead_id === leadId) return activities[i];
  return undefined;
};

export type QueueReason = 'Overdue follow-up' | 'Follow-up today' | 'New lead' | 'Quiet 3+ days';
export const QUEUE_CHIP: Record<QueueReason, string> = {
  'Overdue follow-up': 'pending',
  'Follow-up today': 'transit',
  'New lead': 'confirmed',
  'Quiet 3+ days': 'muted',
};

export interface QueueItem {
  lead: TrackerLead;
  reason: QueueReason;
  followup?: Followup;
  lastCall?: LeadActivity;
}

/**
 * Who to call next, in priority order: overdue follow-ups, follow-ups due today,
 * new leads never called, then open leads nobody has touched for 3+ days.
 */
export function buildQueue(leads: TrackerLead[], followups: Followup[], activities: LeadActivity[]): QueueItem[] {
  const byId = new Map(leads.map(l => [l.id, l]));
  const seen = new Set<number>();
  const items: QueueItem[] = [];
  const add = (lead: TrackerLead | undefined, reason: QueueReason, followup?: Followup) => {
    if (!lead || seen.has(lead.id)) return;
    seen.add(lead.id);
    items.push({ lead, reason, followup, lastCall: lastCallFor(lead.id, activities) });
  };

  const today = dayStart(TODAY);
  const overdue = followups
    .filter(f => f.status === 'missed' || (f.status === 'pending' && dayStart(f.due_at) < today))
    .sort((a, b) => a.due_at.localeCompare(b.due_at));
  overdue.forEach(f => add(byId.get(f.lead_id), 'Overdue follow-up', f));

  followups
    .filter(f => f.status === 'pending' && f.due_at.startsWith(TODAY))
    .sort((a, b) => a.due_at.localeCompare(b.due_at))
    .forEach(f => add(byId.get(f.lead_id), 'Follow-up today', f));

  const calledIds = new Set(activities.map(a => a.lead_id));
  leads
    .filter(l => isOpenLead(l) && !calledIds.has(l.id))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .forEach(l => add(l, 'New lead'));

  leads
    .filter(l => isOpenLead(l) && daysBefore(l.updated_at) >= 3)
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
    .forEach(l => add(l, 'Quiet 3+ days'));

  return items;
}
