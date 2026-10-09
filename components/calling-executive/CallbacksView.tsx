import React, { useMemo, useState } from 'react';
import { Phone } from 'lucide-react';
import { CALL_TARGET_DAILY, Followup, LeadActivity, TODAY, TrackerLead } from '../../data/managerDashboard';
import { ago, dayStart, pct, shortDate } from '../../lib/format';
import { Assignment, assignmentOf } from '../../lib/trackerOps';
import { lastCallFor, stageName, time12, verticalName } from '../telecaller/tcData';
import { QUEUE_CHIP, QueueItem } from './queue';

// The "Call desk": a prioritised queue of leads to call, with today's progress and a callbacks timeline.

type Sort = 'priority' | 'newest' | 'uncalled';
const SORT_LABEL: Record<Sort, string> = { priority: 'Priority order', newest: 'Newest assigned', uncalled: 'Not called yet' };
const OUTCOME_CHIP: Record<string, string> = { Connected: 'delivered', 'No answer': 'transit', Busy: 'pending', 'Wrong number': 'muted', 'Not interested': 'muted' };
const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

interface Props {
  leads: TrackerLead[];
  followups: Followup[];
  activities: LeadActivity[];
  queue: QueueItem[];
  /** When each lead was assigned (shared data); leads not listed count as assigned when created. */
  assignments?: Record<string, Assignment>;
  searchQuery: string;
  onOpen: (leadId: number, followupId?: number) => void;
}

export default function CallbacksView({ leads, followups, activities, queue, assignments, searchQuery, onOpen }: Props) {
  const [sort, setSort] = useState<Sort>('priority');
  const assignedAt = (l: TrackerLead) => assignmentOf({ assignments }, l).at;

  // Today's progress
  const todayCalls = activities.filter(a => a.created_at.startsWith(TODAY));
  const connectedToday = todayCalls.filter(a => a.outcome === 'Connected').length;
  const connectRate = pct(connectedToday, todayCalls.length);
  const progress = Math.min(100, Math.round((todayCalls.length / CALL_TARGET_DAILY) * 100));

  // Upcoming callbacks: overdue first, then by due time
  const callbacks = useMemo(() => followups
    .filter(f => f.status !== 'done')
    .map(f => ({ f, overdue: f.status === 'missed' || dayStart(f.due_at) < dayStart(TODAY) }))
    .sort((a, b) => Number(b.overdue) - Number(a.overdue) || a.f.due_at.localeCompare(b.f.due_at)),
    [followups]);
  const leadName = (id: number) => leads.find(l => l.id === id)?.customer_name ?? '—';

  // The queue, re-sorted for the chosen view
  const sorted = useMemo(() => {
    if (sort === 'newest') return [...queue].sort((a, b) => assignedAt(b.lead).localeCompare(assignedAt(a.lead)));
    if (sort === 'uncalled') return [...queue].sort((a, b) => Number(!!a.lastCall) - Number(!!b.lastCall));
    return queue;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, sort, assignments]);

  // Search across all my leads (Topbar search box on this page)
  const q = searchQuery.trim().toLowerCase();
  const results: QueueItem[] = q
    ? leads
        .filter(l => [l.customer_name, l.phone].some(v => v.toLowerCase().includes(q)))
        .map(l => queue.find(it => it.lead.id === l.id) ?? { lead: l, reason: 'New lead' as const, lastCall: lastCallFor(l.id, activities) })
    : [];

  const shown = q ? results : sorted;

  const Card = ({ item }: { item: QueueItem }) => {
    const { lead, reason, followup, lastCall } = item;
    const isNew = assignedAt(lead).startsWith(TODAY);
    return (
      <div className={`ce-lead-card ${reason === 'Overdue follow-up' ? 'urgent' : ''}`}>
        <div className="ce-avatar">{initials(lead.customer_name)}</div>
        <div className="ce-lead-main">
          <div className="ce-lead-top">
            <span className="ce-lead-name">{lead.customer_name}</span>
            <span className={`chip ${QUEUE_CHIP[reason]}`}>{reason}</span>
            {isNew && reason !== 'Overdue follow-up' && <span className="chip delivered">New today</span>}
          </div>
          <div className="loc"><Phone size={12} /> {lead.phone} · {verticalName(lead.vertical_id)} · {stageName(lead.stage_id)}</div>
          <div className="loc ce-lead-last">
            {followup ? `Callback: ${followup.note}`
              : lastCall ? `Last: ${lastCall.outcome} · ${ago(lastCall.created_at)}${lastCall.note ? ` · “${lastCall.note}”` : ''}`
              : 'Never called'}
          </div>
        </div>
        <div className="ce-lead-actions">
          <button className="btn-primary btn-small" onClick={() => onOpen(lead.id, followup?.id)}><Phone size={14} /> Call</button>
        </div>
      </div>
    );
  };

  return (
    <div className="ce-desk">
      <div className="ce-queue-col">
        <div className="ce-queue-head">
          <span className="ce-queue-title">{q ? `Search · ${shown.length}` : `Up next · ${queue.length}`}</span>
          {!q && (
            <label className="ce-sort">
              <span>Sort</span>
              <select className="filter-select" value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="Sort the queue">
                {(Object.keys(SORT_LABEL) as Sort[]).map(k => <option key={k} value={k}>{SORT_LABEL[k]}</option>)}
              </select>
            </label>
          )}
        </div>

        <div className="ce-queue">
          {shown.length === 0 && (
            <div className="ce-empty">
              {q ? 'No leads match your search.' : 'You’re all caught up — no leads waiting to be called.'}
            </div>
          )}
          {shown.map(item => <Card key={item.lead.id} item={item} />)}
        </div>
      </div>

      <aside className="ce-rail">
        <div className="panel">
          <div className="panel-head"><h2>Today</h2></div>
          <div className="ce-progress-num"><strong>{todayCalls.length}</strong> <span className="loc">/ {CALL_TARGET_DAILY} calls</span></div>
          <div className="ce-progress-track"><span style={{ width: `${progress}%` }} /></div>
          <div className="mini-stats" style={{ marginTop: 14 }}>
            <div className="mini-stat"><div className="mini-num">{todayCalls.length ? `${connectRate}%` : '—'}</div><div className="mini-label">connect rate</div></div>
            <div className="mini-stat"><div className="mini-num">{connectedToday}</div><div className="mini-label">connected</div></div>
            <div className="mini-stat"><div className="mini-num">{queue.length}</div><div className="mini-label">to call</div></div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Callbacks</h2>
            {callbacks.some(c => c.overdue) && <span className="panel-meta text-warn">{callbacks.filter(c => c.overdue).length} overdue</span>}
          </div>
          <ul className="ce-timeline">
            {callbacks.length === 0 && <li className="loc">No pending callbacks.</li>}
            {callbacks.slice(0, 7).map(({ f, overdue }) => (
              <li key={f.id}>
                <button className="ce-timeline-row" onClick={() => onOpen(f.lead_id, f.id)}>
                  <span className={`ce-when ${overdue ? 'text-warn' : ''}`}>{overdue ? 'overdue' : f.due_at.startsWith(TODAY) ? time12(f.due_at) : shortDate(f.due_at)}</span>
                  <span className="ce-timeline-name">{leadName(f.lead_id)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
