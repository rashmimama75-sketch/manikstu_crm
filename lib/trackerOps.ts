// Shared telecalling data (leads, calls, follow-ups) and the changes each dashboard may make.
//
// Lead import → assignment (telecalling head / manager) → calling executive calls or imports a
// calling report → the head's dashboard and the manager's Team overview see the result.
//
// Plain functions with no browser or file-system code: the server applies them to the stored
// data (lib/trackerStore.ts). Record shapes are the existing tracker tables, unchanged.

import {
  FOLLOWUPS, LEAD_ACTIVITIES, STAGES, TELECALLERS, TRACKER_LEADS, VERTICALS,
  CallOutcome, Followup, LeadActivity, TrackerLead,
} from '../data/managerDashboard';
import { nowStamp } from './format';

export interface TrackerState {
  /** Goes up by one with every change, so dashboards can tell when to refresh. */
  version: number;
  leads: TrackerLead[];
  followups: Followup[];
  activities: LeadActivity[];
}

export type NewLeadInput = Omit<TrackerLead, 'id' | 'stage_id' | 'created_at' | 'updated_at'>;

export interface CallInput {
  leadId: number;
  outcome: CallOutcome;
  /** Status after the call; null keeps the lead's current status. */
  stageId: number | null;
  note: string;
  durationSec: number | null;
  /** The callback this call answers, if any: marked done when the customer was reached. */
  followupId?: number | null;
  /** Book the next callback. */
  next?: { date: string; note: string } | null;
  /** When the call happened (calling report import); defaults to now. */
  calledAt?: string | null;
}

export type TrackerAction =
  | { type: 'import-leads'; leads: NewLeadInput[] }
  | { type: 'add-lead'; lead: NewLeadInput }
  | { type: 'assign'; leadIds: number[]; callerId: number }
  | { type: 'log-call'; call: CallInput }
  | { type: 'import-report'; calls: CallInput[] };

export type ActorRole = 'manager' | 'telecaller' | 'calling-executive';
export interface Actor {
  role: ActorRole;
  name: string;
  /** For calling executives: their telecaller id. */
  callerId?: number;
}

/** Which roles may make each change. */
export const ALLOWED: Record<TrackerAction['type'], ActorRole[]> = {
  'import-leads': ['telecaller', 'manager'],
  'add-lead': ['telecaller', 'manager'],
  assign: ['telecaller', 'manager'],
  'log-call': ['calling-executive'],
  'import-report': ['calling-executive'],
};

export const OUTCOME_LIST: CallOutcome[] = ['Connected', 'No answer', 'Busy', 'Wrong number'];
const MAX_IMPORT = 500;

export class TrackerError extends Error {}

export const sampleState = (): TrackerState => ({
  version: 0,
  leads: TRACKER_LEADS.map(l => ({ ...l })),
  followups: FOLLOWUPS.map(f => ({ ...f })),
  activities: LEAD_ACTIVITIES.map(a => ({ ...a })),
});

/** Timestamps follow the sample data's calendar (TODAY at the current time), like the dashboards do. */
const stamp = () => nowStamp();

const firstStage = (verticalId: number) =>
  STAGES.filter(s => s.vertical_id === verticalId).sort((a, b) => a.sort_order - b.sort_order)[0];
const activeCaller = (id: number) => TELECALLERS.find(t => t.id === id && t.is_active);
const nextId = (rows: { id: number }[]) => Math.max(0, ...rows.map(r => r.id)) + 1;

function checkNewLead(l: NewLeadInput, index?: number): NewLeadInput {
  const where = index === undefined ? '' : ` (row ${index + 1})`;
  const name = String(l.customer_name ?? '').replace(/\s+/g, ' ').trim();
  const phone = String(l.phone ?? '').replace(/\D/g, '').slice(-10);
  if (name.length < 2 || name.length > 80) throw new TrackerError(`Lead name is missing${where}.`);
  if (!/^[6-9]\d{9}$/.test(phone)) throw new TrackerError(`Phone number is not a valid mobile${where}.`);
  if (!VERTICALS.some(v => v.id === l.vertical_id)) throw new TrackerError(`Unknown product line${where}.`);
  if (!activeCaller(l.assigned_to)) throw new TrackerError(`Leads can only be assigned to an active telecaller${where}.`);
  return { vertical_id: l.vertical_id, assigned_to: l.assigned_to, customer_name: name, phone, source: String(l.source ?? 'Imported file').slice(0, 40) };
}

function createLeads(state: TrackerState, inputs: NewLeadInput[]): TrackerLead[] {
  const now = stamp();
  let id = nextId(state.leads);
  const phones = new Set(state.leads.map(l => l.phone));
  return inputs.map((raw, i) => {
    const l = checkNewLead(raw, inputs.length > 1 ? i : undefined);
    if (phones.has(l.phone)) throw new TrackerError(`${l.customer_name} (${l.phone}) is already a lead.`);
    phones.add(l.phone);
    return { ...l, id: id++, stage_id: firstStage(l.vertical_id).id, created_at: now, updated_at: now };
  });
}

/** Adds one call to the state (activity, lead stage, follow-ups). Mutates the given arrays' copies. */
function applyCall(state: TrackerState, call: CallInput, actor: Actor): string {
  const lead = state.leads.find(l => l.id === Number(call.leadId));
  if (!lead) throw new TrackerError('That lead no longer exists.');
  if (lead.assigned_to !== actor.callerId) throw new TrackerError(`${lead.customer_name} is not assigned to you any more.`);
  if (!OUTCOME_LIST.includes(call.outcome)) throw new TrackerError('Choose a call outcome.');
  const stage = STAGES.find(s => s.id === (call.stageId === null || call.stageId === undefined ? lead.stage_id : Number(call.stageId)));
  if (!stage || stage.vertical_id !== lead.vertical_id) throw new TrackerError(`Choose a status from ${lead.customer_name}'s product line.`);

  const now = stamp();
  const at = call.calledAt && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(call.calledAt) && call.calledAt <= now ? call.calledAt : now;
  const duration = call.durationSec === null || call.durationSec === undefined ? null : Math.max(0, Math.min(4 * 3600, Math.round(Number(call.durationSec)) || 0));

  // The lead's status follows its most recent call (a report can contain older calls).
  const latest = state.activities.reduce((m, a) => (a.lead_id === lead.id && a.created_at > m ? a.created_at : m), '');
  state.activities.push({
    id: nextId(state.activities),
    lead_id: lead.id,
    caller_id: actor.callerId!,
    stage_id: stage.id,
    note: String(call.note ?? '').trim().slice(0, 500) || (call.outcome === 'Connected' ? 'Spoke to customer' : call.outcome),
    outcome: call.outcome,
    duration_sec: call.outcome === 'Connected' ? duration : null,
    created_at: at,
  });
  if (at >= latest) lead.stage_id = stage.id;
  lead.updated_at = at > lead.updated_at ? at : lead.updated_at;

  if (call.outcome === 'Connected') {
    // A connected call answers the callback it was for (or the oldest open one on this lead).
    const fu = state.followups.find(f => f.id === Number(call.followupId) && f.lead_id === lead.id && f.status !== 'done')
      ?? state.followups.filter(f => f.lead_id === lead.id && f.status !== 'done' && f.due_at.slice(0, 10) <= at.slice(0, 10)).sort((a, b) => a.due_at.localeCompare(b.due_at))[0];
    if (fu) { fu.status = 'done'; fu.completed_at = at; }
  }
  if (call.next?.date && /^\d{4}-\d{2}-\d{2}$/.test(call.next.date)) {
    state.followups.push({
      id: nextId(state.followups),
      lead_id: lead.id,
      caller_id: actor.callerId!,
      due_at: `${call.next.date}T10:00`,
      note: String(call.next.note ?? '').trim().slice(0, 200) || 'Call back',
      status: 'pending',
      completed_at: null,
    });
  }
  return lead.customer_name;
}

export interface ActionResult {
  state: TrackerState;
  message: string;
  /** Ids of leads created by this change. */
  createdIds?: number[];
}

/** Applies one change and returns the new state (the input is not modified). */
export function applyAction(current: TrackerState, action: TrackerAction, actor: Actor): ActionResult {
  if (!ALLOWED[action.type]?.includes(actor.role)) throw new TrackerError('You are not allowed to do that.');
  const state: TrackerState = {
    version: current.version + 1,
    leads: current.leads.map(l => ({ ...l })),
    followups: current.followups.map(f => ({ ...f })),
    activities: [...current.activities],
  };

  switch (action.type) {
    case 'import-leads':
    case 'add-lead': {
      const inputs = action.type === 'add-lead' ? [action.lead] : action.leads;
      if (!Array.isArray(inputs) || inputs.length === 0) throw new TrackerError('No leads to add.');
      if (inputs.length > MAX_IMPORT) throw new TrackerError(`Import at most ${MAX_IMPORT} leads at a time.`);
      const created = createLeads(state, inputs);
      state.leads = [...created, ...state.leads];
      const people = new Set(created.map(l => l.assigned_to)).size;
      return {
        state,
        createdIds: created.map(l => l.id),
        message: `${created.length} lead${created.length === 1 ? '' : 's'} added and assigned to ${people} telecaller${people === 1 ? '' : 's'}`,
      };
    }
    case 'assign': {
      const to = activeCaller(Number(action.callerId));
      if (!to) throw new TrackerError('Leads can only be assigned to an active telecaller.');
      const ids = new Set((action.leadIds ?? []).map(Number));
      const moved = state.leads.filter(l => ids.has(l.id));
      if (moved.length === 0) throw new TrackerError('Those leads no longer exist.');
      const now = stamp();
      moved.forEach(l => { l.assigned_to = to.id; l.updated_at = now; });
      // Open callbacks move with the lead.
      state.followups.forEach(f => {
        if (ids.has(f.lead_id) && f.status !== 'done') { f.caller_id = to.id; f.status = 'pending'; }
      });
      return { state, message: `${moved.length === 1 ? moved[0].customer_name : `${moved.length} leads`} assigned to ${to.name}` };
    }
    case 'log-call': {
      const name = applyCall(state, action.call, actor);
      return { state, message: `${name}: ${action.call.outcome} saved` };
    }
    case 'import-report': {
      if (!Array.isArray(action.calls) || action.calls.length === 0) throw new TrackerError('The report has no calls to import.');
      if (action.calls.length > MAX_IMPORT) throw new TrackerError(`Import at most ${MAX_IMPORT} calls at a time.`);
      // Oldest first; calls without a time happened just now, so they go last.
      const now = stamp();
      const ordered = [...action.calls].sort((a, b) => (a.calledAt || now).localeCompare(b.calledAt || now));
      ordered.forEach(c => applyCall(state, c, actor));
      return { state, message: `${ordered.length} call${ordered.length === 1 ? '' : 's'} imported from the report` };
    }
    default:
      throw new TrackerError('Unknown change.');
  }
}

/** What a calling executive may see: their own leads, with the full call history on them. */
export function stateFor(state: TrackerState, actor: Actor): TrackerState {
  if (actor.role !== 'calling-executive') return state;
  const leads = state.leads.filter(l => l.assigned_to === actor.callerId);
  const ids = new Set(leads.map(l => l.id));
  return {
    version: state.version,
    leads,
    followups: state.followups.filter(f => ids.has(f.lead_id)),
    activities: state.activities.filter(a => ids.has(a.lead_id)),
  };
}
