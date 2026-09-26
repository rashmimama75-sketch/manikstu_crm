import { CALL_TARGET_DAILY, TELECALLERS, TODAY, VERTICALS, CallOutcome, Telecaller } from '../../data/managerDashboard';
import { INITIAL_COMPLAINTS } from '../../data/complaints';
import { daysBefore, pct } from '../../lib/format';
import { OUTCOMES, Period, TeamData, inPeriod, isOpenLead, isOverdue, isWonLead, stageOf, stagesFor } from '../telecaller/tcData';

// Numbers for the manager's Telecalling pages (view-only). Built on the same tracker data as the
// head telecalling dashboard.

export interface ExecMetrics {
  t: Telecaller;
  // Calls in the period
  calls: number;
  connected: number;
  connectRate: number;
  avgTalkSec: number | null;
  outcomes: Record<CallOutcome, number>;
  leadsWorked: number;
  callsToday: number;
  firstCallToday: string | null;
  lastCall: string | null;
  // Leads (current)
  leadsTotal: number;
  openLeads: number;
  newLeads7d: number;
  staleLeads: number;
  wonLeads: number;
  lostLeads: number;
  // Follow-ups (current)
  dueToday: number;
  overdue: number;
  missed: number;
  /** Done ÷ (done + missed + overdue): how many follow-ups were actually kept. */
  keptRate: number | null;
  // Sales in the period
  sales: number;
  revenue: number;
  avgSale: number;
  conversion: number;
  // Other
  verticalIds: number[];
  callingSince: string | null;
  openComplaints: number;
  resolvedComplaints: number;
}

export function execMetrics(data: TeamData, t: Telecaller, period: Period): ExecMetrics {
  const leads = data.leads.filter(l => l.assigned_to === t.id);
  const acts = data.activities.filter(a => a.caller_id === t.id);
  const pAct = acts.filter(a => inPeriod(a.created_at, period));
  const connected = pAct.filter(a => a.outcome === 'Connected');
  const talk = connected.filter(a => a.duration_sec !== null);
  const today = acts.filter(a => a.created_at.startsWith(TODAY));
  const fus = data.followups.filter(f => f.caller_id === t.id);
  const sales = data.sales.filter(s => s.caller_id === t.id && inPeriod(s.sold_at, period));
  const soldLeads = new Set(data.sales.map(s => s.lead_id)); // same definition as the head dashboard
  const doneCount = fus.filter(f => f.status === 'done').length;
  const notKept = fus.filter(isOverdue).length;
  const revenue = sales.reduce((a, s) => a + s.amount, 0);
  const complaints = INITIAL_COMPLAINTS.filter(c => c.assigned_to === t.id);

  return {
    t,
    calls: pAct.length,
    connected: connected.length,
    connectRate: pct(connected.length, pAct.length),
    avgTalkSec: talk.length ? Math.round(talk.reduce((a, x) => a + x.duration_sec!, 0) / talk.length) : null,
    outcomes: OUTCOMES.reduce((m, o) => ({ ...m, [o]: pAct.filter(a => a.outcome === o).length }), {} as Record<CallOutcome, number>),
    leadsWorked: new Set(pAct.map(a => a.lead_id)).size,
    callsToday: today.length,
    firstCallToday: today[0]?.created_at ?? null,
    lastCall: acts[acts.length - 1]?.created_at ?? null,
    leadsTotal: leads.length,
    openLeads: leads.filter(isOpenLead).length,
    newLeads7d: leads.filter(l => daysBefore(l.created_at) <= 6).length,
    staleLeads: leads.filter(l => isOpenLead(l) && daysBefore(l.updated_at) >= 3).length,
    wonLeads: leads.filter(isWonLead).length,
    lostLeads: leads.filter(l => stageOf(l.stage_id)?.name === 'Lost').length,
    dueToday: fus.filter(f => f.status === 'pending' && f.due_at.startsWith(TODAY)).length,
    overdue: fus.filter(isOverdue).length,
    missed: fus.filter(f => f.status === 'missed').length,
    keptRate: doneCount + notKept ? pct(doneCount, doneCount + notKept) : null,
    sales: sales.length,
    revenue,
    avgSale: sales.length ? Math.round(revenue / sales.length) : 0,
    conversion: pct(leads.filter(l => soldLeads.has(l.id)).length, leads.length),
    verticalIds: VERTICALS.filter(v => leads.some(l => l.vertical_id === v.id)).map(v => v.id),
    callingSince: acts[0]?.created_at ?? null,
    openComplaints: complaints.filter(c => c.status !== 'resolved' && c.status !== 'closed').length,
    resolvedComplaints: complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length,
  };
}

export const allExecMetrics = (data: TeamData, period: Period) => TELECALLERS.map(t => execMetrics(data, t, period));

/** Average of one number across active executives. */
export function teamAverage(all: ExecMetrics[], pick: (m: ExecMetrics) => number | null): number | null {
  const vals = all.filter(m => m.t.is_active).map(pick).filter((v): v is number => v !== null);
  return vals.length ? vals.reduce((a, v) => a + v, 0) / vals.length : null;
}

/** Leads per stage for one product line, optionally for one executive. */
export function funnel(data: TeamData, verticalId: number, callerId?: number) {
  return stagesFor(verticalId).map(st => ({
    st,
    n: data.leads.filter(l => l.stage_id === st.id && (callerId === undefined || l.assigned_to === callerId)).length,
  }));
}

/** Calls per day for the last `days` days, oldest first. */
export function callsPerDay(data: TeamData, days: number, callerId?: number) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(`${TODAY}T00:00:00`);
    d.setDate(d.getDate() - (days - 1 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const acts = data.activities.filter(a => a.created_at.startsWith(key) && (callerId === undefined || a.caller_id === callerId));
    const sales = data.sales.filter(s => s.sold_at.startsWith(key) && (callerId === undefined || s.caller_id === callerId));
    return { key, calls: acts.length, connected: acts.filter(a => a.outcome === 'Connected').length, sales: sales.length };
  });
}

export const initials = (name: string) => name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
export { CALL_TARGET_DAILY };
