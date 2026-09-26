import React, { useEffect, useState } from 'react';
import { Followup, LeadActivity, TODAY, TrackerLead } from '../../data/managerDashboard';
import { MONTH, ago, dayStart, daysBefore, shortDate, shortDateTime } from '../../lib/format';
import { Assignment, assignmentOf } from '../../lib/trackerOps';
import { CallButton, EmptyRow, StatusChip } from '../telecaller/shared';
import { fmtDuration, isOpenLead, lastCallFor, stageName, time12, verticalName } from '../telecaller/tcData';
import { QUEUE_CHIP, QueueItem } from './queue';

// The "Call desk" section: assigned leads, calls made, pending calls and callbacks.

type Section = 'assigned' | 'calls' | 'pending' | 'callbacks';
type CallbackTab = 'Overdue' | 'Due today' | 'Upcoming';
const CALLBACK_TABS: CallbackTab[] = ['Overdue', 'Due today', 'Upcoming'];
type CallPeriod = 'Today' | 'This month';
const PAGE_SIZE = 15;

// Assigned leads: sort and quick filters. "New" = assigned today.
type AssignedSort = 'newest' | 'oldest' | 'uncalled' | 'recent';
const SORT_LABEL: Record<AssignedSort, string> = {
  newest: 'Newest assigned first',
  oldest: 'Oldest assigned first',
  uncalled: 'Not called yet first',
  recent: 'Recently called',
};
type AssignedFilter = 'all' | 'new' | 'never' | 'open' | 'closed';
const FILTER_LABEL: Record<AssignedFilter, string> = { all: 'All', new: 'New today', never: 'Never called', open: 'Open', closed: 'Closed' };
const SORT_KEY = 'mk-ce-assigned-sort';

/** Today / Yesterday / This week / Older, for grouping by assignment time. */
const groupOf = (at: string) => {
  const d = daysBefore(at);
  return d <= 0 ? 'Today' : d === 1 ? 'Yesterday' : d <= 6 ? 'This week' : 'Older';
};

const callbackTabOf = (f: Followup): CallbackTab | null => {
  if (f.status === 'done') return null;
  if (f.status === 'missed' || dayStart(f.due_at) < dayStart(TODAY)) return 'Overdue';
  if (f.due_at.startsWith(TODAY)) return 'Due today';
  return 'Upcoming';
};

interface Props {
  leads: TrackerLead[];
  followups: Followup[];
  activities: LeadActivity[];
  queue: QueueItem[];
  /** When each lead was assigned (shared data); leads not listed count as assigned when created. */
  assignments?: Record<string, Assignment>;
  searchQuery: string;
  onOpen: (leadId: number) => void;
}

export default function CallbacksView({ leads, followups, activities, queue, assignments, searchQuery, onOpen }: Props) {
  const callbackCounts = CALLBACK_TABS.reduce(
    (m, t) => ({ ...m, [t]: followups.filter(f => callbackTabOf(f) === t).length }),
    {} as Record<CallbackTab, number>
  );
  const [section, setSection] = useState<Section>('assigned');
  const [callbackTab, setCallbackTab] = useState<CallbackTab>(callbackCounts.Overdue > 0 ? 'Overdue' : 'Due today');
  const [callPeriod, setCallPeriod] = useState<CallPeriod>('Today');
  const [page, setPage] = useState(0);
  const [assignedSort, setAssignedSort] = useState<AssignedSort>('newest');
  const [assignedFilter, setAssignedFilter] = useState<AssignedFilter>('all');

  // Remember the chosen sort in this browser.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SORT_KEY) as AssignedSort | null;
      if (saved && saved in SORT_LABEL) setAssignedSort(saved);
    } catch { /* storage unavailable: keep the default */ }
  }, []);
  const chooseSort = (v: AssignedSort) => {
    setAssignedSort(v);
    setPage(0);
    try { window.localStorage.setItem(SORT_KEY, v); } catch { /* ignore */ }
  };

  const leadOf = (id: number) => leads.find(l => l.id === id);
  const q = searchQuery.trim().toLowerCase();
  const leadMatches = (l: TrackerLead | undefined, extra = '') =>
    !q || (!!l && [l.customer_name, l.phone, extra].some(v => v.toLowerCase().includes(q)));

  const todayCalls = activities.filter(a => a.created_at.startsWith(TODAY));
  const monthCalls = activities.filter(a => a.created_at.startsWith(MONTH));
  const openLeads = leads.filter(isOpenLead).length;
  const openCallbacks = CALLBACK_TABS.reduce((n, t) => n + callbackCounts[t], 0);

  const showSection = (s: Section) => {
    setSection(s);
    setPage(0);
  };

  // Rows for the chosen section
  // Assigned leads with when they were assigned and their last call
  const assignedInfo = leads.map(l => {
    const assigned = assignmentOf({ assignments }, l);
    const last = lastCallFor(l.id, activities);
    const assignedToday = assigned.at.startsWith(TODAY);
    // NEW until the executive has called it (any call by them on or after the day it was assigned)
    const calledSince = activities.some(a => a.lead_id === l.id && a.caller_id === l.assigned_to && a.created_at.slice(0, 10) >= assigned.at.slice(0, 10));
    const isNew = assignedToday && isOpenLead(l) && !calledSince;
    return { l, assigned, last, assignedToday, isNew };
  });
  const filterTest: Record<AssignedFilter, (x: (typeof assignedInfo)[number]) => boolean> = {
    all: () => true,
    new: x => x.assignedToday,
    never: x => !x.last,
    open: x => isOpenLead(x.l),
    closed: x => !isOpenLead(x.l),
  };
  const newCount = assignedInfo.filter(x => x.isNew).length;
  const assignedRows = assignedInfo
    .filter(x => leadMatches(x.l) && filterTest[assignedFilter](x))
    .sort((a, b) => {
      const newer = b.assigned.at.localeCompare(a.assigned.at) || b.l.id - a.l.id;
      switch (assignedSort) {
        case 'oldest': return -newer;
        case 'uncalled': return Number(!!a.last) - Number(!!b.last) || newer;
        case 'recent': return (b.last?.created_at ?? '').localeCompare(a.last?.created_at ?? '') || newer;
        default: return newer;
      }
    });
  const grouped = assignedSort === 'newest' || assignedSort === 'oldest';
  const callRows = (callPeriod === 'Today' ? todayCalls : monthCalls)
    .filter(a => leadMatches(leadOf(a.lead_id), a.note))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const pendingRows = queue.filter(item => leadMatches(item.lead, item.followup?.note ?? ''));
  const callbackRows = followups
    .filter(f => callbackTabOf(f) === callbackTab)
    .filter(f => leadMatches(leadOf(f.lead_id), f.note))
    .sort((a, b) => a.due_at.localeCompare(b.due_at));

  const pageOf = <T,>(rows: T[]) => {
    const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const safePage = Math.min(page, pageCount - 1);
    return { rows: rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE), safePage, pageCount, total: rows.length };
  };

  const renderPager = ({ safePage, pageCount, total }: { safePage: number; pageCount: number; total: number }, noun: string) =>
    total > PAGE_SIZE ? (
      <div className="pager">
        <span>{safePage * PAGE_SIZE + 1}–{Math.min(total, (safePage + 1) * PAGE_SIZE)} of {total} {noun}</span>
        <div className="pager-btns">
          <button className="btn-secondary btn-small" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
          <button className="btn-secondary btn-small" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>Next</button>
        </div>
      </div>
    ) : null;

  const cards: { key: Section; num: number; small?: string; label: string }[] = [
    { key: 'assigned', num: leads.length, small: newCount ? `${newCount} new` : `${openLeads} open`, label: 'Assigned leads' },
    { key: 'calls', num: todayCalls.length, small: `${monthCalls.length} this month`, label: 'Total calls today' },
    { key: 'pending', num: queue.length, label: 'Pending calls' },
    { key: 'callbacks', num: openCallbacks, small: callbackCounts.Overdue ? `${callbackCounts.Overdue} overdue` : undefined, label: 'Callbacks' },
  ];

  return (
    <>
      <div className="scoreboard" role="tablist" aria-label="Call desk sections">
        {cards.map(c => (
          <button
            key={c.key}
            role="tab"
            aria-selected={section === c.key}
            className={`score score-btn ${section === c.key ? 'active' : ''}`}
            onClick={() => showSection(c.key)}
          >
            <div className="num">
              {c.num}
              {c.small && <small className={c.key === 'callbacks' ? 'warn' : c.key === 'assigned' && newCount ? 'new-count' : undefined}>{c.small}</small>}
            </div>
            <div className="label">{c.label}</div>
          </button>
        ))}
      </div>

      {section === 'assigned' && (() => {
        const p = pageOf(assignedRows);
        return (
          <div className="panel">
            <div className="panel-head">
              <h2>Assigned leads</h2>
              <span className="panel-meta">{leads.length} assigned · {openLeads} open{newCount ? ` · ${newCount} new today` : ''}</span>
            </div>
            <div className="assigned-tools">
              <div className="filters">
                {(Object.keys(FILTER_LABEL) as AssignedFilter[]).map(f => (
                  <button key={f} className={`filter-chip ${assignedFilter === f ? 'active' : ''}`} onClick={() => { setAssignedFilter(f); setPage(0); }}>
                    {FILTER_LABEL[f]} ({assignedInfo.filter(filterTest[f]).length})
                  </button>
                ))}
              </div>
              <label className="sort-select">
                <span>Sort</span>
                <select className="filter-select" value={assignedSort} onChange={e => chooseSort(e.target.value as AssignedSort)} aria-label="Sort assigned leads">
                  {(Object.keys(SORT_LABEL) as AssignedSort[]).map(k => <option key={k} value={k}>{SORT_LABEL[k]}</option>)}
                </select>
              </label>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Lead</th><th>Product</th><th>Stage</th><th>Source</th><th>Assigned</th><th>Last call</th><th></th></tr>
                </thead>
                <tbody>
                  {p.rows.length === 0 && <EmptyRow cols={7} text={assignedFilter === 'new' ? 'No leads assigned to you today yet.' : 'No assigned leads match.'} />}
                  {p.rows.map(({ l, assigned, last, isNew }, i) => {
                    const group = groupOf(assigned.at);
                    const showGroup = grouped && (i === 0 || groupOf(p.rows[i - 1].assigned.at) !== group);
                    return (
                      <React.Fragment key={l.id}>
                        {showGroup && <tr className="group-row"><td colSpan={7}>{group}</td></tr>}
                        <tr className={isNew ? 'row-new' : undefined}>
                          <td className="cust">{l.customer_name}{isNew && <span className="new-tag">NEW</span>}<div className="loc">{l.phone}</div></td>
                          <td>{verticalName(l.vertical_id)}</td>
                          <td>{stageName(l.stage_id)}</td>
                          <td>{l.source}</td>
                          <td>
                            {assigned.at.startsWith(TODAY) ? `Today, ${time12(assigned.at)}` : daysBefore(assigned.at) === 1 ? `Yesterday, ${time12(assigned.at)}` : `${shortDate(assigned.at)} · ${ago(assigned.at)}`}
                            {assigned.by && <div className="loc">by {assigned.by}</div>}
                          </td>
                          <td>{last ? <><StatusChip status={last.outcome} /><div className="loc">{ago(last.created_at)}</div></> : <span className="loc">Never</span>}</td>
                          <td>{isOpenLead(l) && <CallButton onClick={() => onOpen(l.id)} />}</td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {renderPager(p, 'leads')}
          </div>
        );
      })()}

      {section === 'calls' && (() => {
        const p = pageOf(callRows);
        return (
          <div className="panel">
            <div className="panel-head">
              <h2>Total calls</h2>
              <div className="filters">
                {(['Today', 'This month'] as CallPeriod[]).map(cp => (
                  <button key={cp} className={`filter-chip ${callPeriod === cp ? 'active' : ''}`} onClick={() => { setCallPeriod(cp); setPage(0); }}>
                    {cp} ({cp === 'Today' ? todayCalls.length : monthCalls.length})
                  </button>
                ))}
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Time</th><th>Lead</th><th>Outcome</th><th>Duration</th><th>Note</th></tr>
                </thead>
                <tbody>
                  {p.rows.length === 0 && <EmptyRow cols={5} text={`No calls ${callPeriod.toLowerCase()}.`} />}
                  {p.rows.map(a => {
                    const l = leadOf(a.lead_id);
                    return (
                      <tr key={a.id}>
                        <td>{a.created_at.startsWith(TODAY) ? time12(a.created_at) : shortDateTime(a.created_at)}</td>
                        <td className="cust">{l?.customer_name ?? '—'}{l && <div className="loc">{l.phone}</div>}</td>
                        <td><StatusChip status={a.outcome} /></td>
                        <td>{fmtDuration(a.duration_sec)}</td>
                        <td>{a.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {renderPager(p, 'calls')}
          </div>
        );
      })()}

      {section === 'pending' && (() => {
        const p = pageOf(pendingRows);
        return (
          <div className="panel">
            <div className="panel-head"><h2>Pending calls</h2><span className="panel-meta">In the order to call them</span></div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Lead</th><th>Why now</th><th>Product · stage</th><th>Last call</th><th></th></tr>
                </thead>
                <tbody>
                  {p.rows.length === 0 && <EmptyRow cols={6} text="No pending calls. Everyone due has been called." />}
                  {p.rows.map((item, i) => (
                    <tr key={item.lead.id}>
                      <td>{p.safePage * PAGE_SIZE + i + 1}</td>
                      <td className="cust">{item.lead.customer_name}<div className="loc">{item.lead.phone}</div></td>
                      <td>
                        <span className={`chip ${QUEUE_CHIP[item.reason]}`}>{item.reason}</span>
                        {item.followup && <div className="loc">{item.followup.note}</div>}
                      </td>
                      <td>{verticalName(item.lead.vertical_id)}<div className="loc">{stageName(item.lead.stage_id)}</div></td>
                      <td>{item.lastCall ? <><StatusChip status={item.lastCall.outcome} /><div className="loc">{ago(item.lastCall.created_at)}</div></> : <span className="loc">Never</span>}</td>
                      <td><CallButton onClick={() => onOpen(item.lead.id)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPager(p, 'pending calls')}
          </div>
        );
      })()}

      {section === 'callbacks' && (() => {
        const p = pageOf(callbackRows);
        return (
          <div className="panel">
            <div className="panel-head">
              <h2>Callbacks</h2>
              <div className="filters">
                {CALLBACK_TABS.map(t => (
                  <button key={t} className={`filter-chip ${callbackTab === t ? 'active' : ''}`} onClick={() => { setCallbackTab(t); setPage(0); }}>
                    {t} ({callbackCounts[t]})
                  </button>
                ))}
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Lead</th><th>Reason</th><th>Due</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {p.rows.length === 0 && <EmptyRow cols={5} text={`No ${callbackTab.toLowerCase()} callbacks.`} />}
                  {p.rows.map(f => {
                    const lead = leadOf(f.lead_id);
                    return (
                      <tr key={f.id}>
                        <td className="cust">
                          {lead?.customer_name ?? '—'}
                          {lead && <div className="loc">{lead.phone} · {verticalName(lead.vertical_id)} · {stageName(lead.stage_id)}</div>}
                        </td>
                        <td>{f.note}</td>
                        <td className={callbackTab === 'Overdue' ? 'text-warn' : undefined}>
                          {f.due_at.startsWith(TODAY) ? `Today, ${time12(f.due_at)}` : shortDateTime(f.due_at).split(',')[0]}
                        </td>
                        <td><StatusChip status={f.status === 'missed' ? 'Missed' : callbackTab} /></td>
                        <td>{lead && <CallButton onClick={() => onOpen(lead.id)} />}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {renderPager(p, 'callbacks')}
          </div>
        );
      })()}
    </>
  );
}
