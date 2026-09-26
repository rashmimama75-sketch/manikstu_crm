import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { TELECALLERS, TODAY } from '../../data/managerDashboard';
import { Assignee, CATEGORIES, Category, Complaint, ComplaintEvent, PRIORITIES, Priority, SLA_HOURS, addHours } from '../../data/complaints';
import { MONTH, ago, daysBefore, nowStamp, pct, rupees, rupeesShort, shortDate, shortDateTime } from '../../lib/format';
import { ExportFormat, exportTable } from '../../lib/export';
import ExportMenu from '../ExportMenu';
import HBarList from '../HBarList';
import { EmptyRow } from './shared';
import AssignPicker from './AssignPicker';
import ComplaintDrawer, { PriorityChip } from './ComplaintDrawer';
import NewComplaint, { NewComplaintInput } from './NewComplaint';
import {
  OVERLOAD_AT, PRIORITY_LABEL, STATUS_CHIP, STATUS_LABEL, assigneeName, deadlineText, isActive, isOverdue, isUnassigned,
} from './complaintsUtil';

type Tab = 'To assign' | 'Open' | 'Waiting' | 'Escalated' | 'Resolved' | 'Closed' | 'All';
const TABS: Tab[] = ['To assign', 'Open', 'Waiting', 'Escalated', 'Resolved', 'Closed', 'All'];

const inTab = (c: Complaint, t: Tab): boolean => {
  switch (t) {
    case 'To assign': return isUnassigned(c);
    case 'Open': return isActive(c) && c.assigned_to !== null && (c.status === 'open' || c.status === 'in_progress');
    case 'Waiting': return c.status === 'waiting' && c.assigned_to !== null;
    case 'Escalated': return c.status === 'escalated' && c.assigned_to !== null;
    case 'Resolved': return c.status === 'resolved';
    case 'Closed': return c.status === 'closed';
    default: return true;
  }
};

const inactiveIds = new Set(TELECALLERS.filter(t => !t.is_active).map(t => t.id));
const lastEventAt = (c: Complaint) => c.events[c.events.length - 1]?.at ?? c.created_at;

/** "Needs action" shortcuts above the table. */
const ATTENTION: { key: string; label: string; test: (c: Complaint) => boolean }[] = [
  { key: 'returned', label: 'Returned to you', test: c => isUnassigned(c) && !!c.returned_note },
  { key: 'overdue', label: 'Past deadline', test: c => isOverdue(c) },
  { key: 'inactive', label: 'With inactive staff', test: c => isActive(c) && typeof c.assigned_to === 'number' && inactiveIds.has(c.assigned_to) },
  { key: 'waiting', label: 'Waiting 2+ days', test: c => c.status === 'waiting' && daysBefore(lastEventAt(c)) >= 2 },
  { key: 'reopened', label: 'Reopened', test: c => isActive(c) && c.reopened },
  { key: 'escalated', label: 'Escalated', test: c => c.status === 'escalated' },
];

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const hoursBetween = (a: string, b: string) => (new Date(`${b}:00`).getTime() - new Date(`${a}:00`).getTime()) / 3_600_000;
const fmtHours = (h: number) => (h < 48 ? `${Math.round(h)}h` : `${(h / 24).toFixed(1)}d`);

interface Props {
  complaints: Complaint[];
  onComplaintsChange: React.Dispatch<React.SetStateAction<Complaint[]>>;
  headName: string;
  searchQuery: string;
  onToast: (message: string) => void;
}

export default function TeamComplaints({ complaints, onComplaintsChange, headName, searchQuery, onToast }: Props) {
  const [tab, setTab] = useState<Tab>(() => (complaints.some(isUnassigned) ? 'To assign' : 'Open'));
  const [attention, setAttention] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority | 'all'>('all');
  const [category, setCategory] = useState<Category | 'all'>('all');
  const [owner, setOwner] = useState<string>('all'); // 'all' | 'head' | 'none' | telecaller id
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [openId, setOpenId] = useState<number | null>(null);
  const [assignIds, setAssignIds] = useState<number[] | null>(null);
  const [creating, setCreating] = useState(false);
  const now = nowStamp();

  const who = (a: Assignee) => assigneeName(a, headName);

  // ---- Changes -----------------------------------------------------------------------------

  const update = (id: number, patch: Partial<Complaint>, event: Omit<ComplaintEvent, 'at' | 'by'>) =>
    onComplaintsChange(prev => prev.map(c => (c.id === id ? { ...c, ...patch, events: [...c.events, { ...event, at: nowStamp(), by: headName }] } : c)));

  const assign = (ids: number[], to: Assignee, note: string) => {
    const set = new Set(ids);
    const stamp = nowStamp();
    onComplaintsChange(prev => prev.map(c => {
      if (!set.has(c.id)) return c;
      const kind = c.assigned_to === null ? 'assigned' : 'reassigned';
      const text = `${kind === 'assigned' ? 'Assigned' : `Moved from ${who(c.assigned_to)}`} to ${who(to)}${note ? `: ${note}` : ''}`;
      return { ...c, assigned_to: to, assigned_at: stamp, returned_note: null, events: [...c.events, { at: stamp, by: headName, kind, text }] };
    }));
    setAssignIds(null);
    setSelected(new Set());
    onToast(`${ids.length === 1 ? complaints.find(c => c.id === ids[0])?.ticket : `${ids.length} complaints`} assigned to ${who(to)}`);
  };

  const create = (input: NewComplaintInput) => {
    const id = Math.max(0, ...complaints.map(c => c.id)) + 1;
    const num = Math.max(0, ...complaints.map(c => Number(c.ticket.slice(4)))) + 1;
    const stamp = nowStamp();
    const { assignNow, ...fields } = input;
    const complaint: Complaint = {
      ...fields,
      id,
      ticket: `CMP-${String(num).padStart(4, '0')}`,
      status: 'open',
      assigned_to: null,
      assigned_at: null,
      created_at: stamp,
      due_at: addHours(stamp, SLA_HOURS[input.priority]),
      resolved_at: null,
      resolution_type: null,
      resolution_note: null,
      refund_amount: null,
      satisfaction: null,
      reopened: false,
      returned_note: null,
      events: [{ at: stamp, by: headName, kind: 'raised', text: `Logged by ${headName} (${input.channel})` }],
    };
    onComplaintsChange(prev => [complaint, ...prev]);
    setCreating(false);
    setTab('To assign');
    setAttention(null);
    onToast(`${complaint.ticket} saved`);
    if (assignNow) setAssignIds([id]);
  };

  // ---- Numbers -----------------------------------------------------------------------------

  const active = complaints.filter(isActive);
  const done = complaints.filter(c => c.resolved_at);
  const doneRecent = done.filter(c => daysBefore(c.resolved_at!) < 30);
  const avgHours = doneRecent.length ? doneRecent.reduce((a, c) => a + hoursBetween(c.created_at, c.resolved_at!), 0) / doneRecent.length : 0;
  const onTime = doneRecent.filter(c => c.resolved_at! <= c.due_at).length;
  const rated = done.filter(c => c.satisfaction);
  const avgRating = rated.length ? rated.reduce((a, c) => a + c.satisfaction!, 0) / rated.length : 0;
  const refunds = done.filter(c => c.refund_amount && c.resolved_at!.startsWith(MONTH)).reduce((a, c) => a + c.refund_amount!, 0);

  // ---- Rows --------------------------------------------------------------------------------

  const q = searchQuery.trim().toLowerCase();
  const filtered = complaints.filter(c =>
    (priority === 'all' || c.priority === priority) &&
    (category === 'all' || c.category === category) &&
    (owner === 'all' || (owner === 'none' ? c.assigned_to === null : owner === 'head' ? c.assigned_to === 'head' : c.assigned_to === Number(owner))) &&
    (!q || [c.ticket, c.customer_name, c.phone, c.order_number ?? '', c.city].some(v => v.toLowerCase().includes(q))),
  );
  const attn = ATTENTION.find(a => a.key === attention);
  const counts = TABS.reduce((m, t) => ({ ...m, [t]: filtered.filter(c => inTab(c, t)).length }), {} as Record<Tab, number>);
  const rows = filtered
    .filter(c => (attn ? attn.test(c) : inTab(c, tab)))
    .sort((a, b) => {
      if (isActive(a) !== isActive(b)) return isActive(a) ? -1 : 1;
      if (!isActive(a)) return (b.resolved_at ?? '').localeCompare(a.resolved_at ?? '');
      return Number(isOverdue(b, now)) - Number(isOverdue(a, now)) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.due_at.localeCompare(b.due_at);
    });
  const selectable = rows.filter(isActive);
  const allSelected = selectable.length > 0 && selectable.every(c => selected.has(c.id));

  const toggle = (id: number) => setSelected(s => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  // ---- Insights ----------------------------------------------------------------------------

  const byCategory = CATEGORIES
    .map(cat => ({ cat, all: complaints.filter(c => c.category === cat).length, open: active.filter(c => c.category === cat).length }))
    .filter(x => x.all > 0)
    .sort((a, b) => b.all - a.all);
  const byProduct = useMemo(() => {
    const m = new Map<string, number>();
    complaints.forEach(c => c.product && m.set(c.product, (m.get(c.product) ?? 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [complaints]);
  const perPerson = [
    ...TELECALLERS.map(t => ({ key: String(t.id), name: t.name, inactive: !t.is_active, test: (c: Complaint) => c.assigned_to === t.id })),
    { key: 'head', name: who('head'), inactive: false, test: (c: Complaint) => c.assigned_to === 'head' },
  ]
    .map(p => {
      const mine = complaints.filter(p.test);
      const res = mine.filter(c => c.resolved_at && daysBefore(c.resolved_at) < 30);
      const r = mine.filter(c => c.satisfaction);
      return {
        ...p,
        open: mine.filter(isActive).length,
        overdue: mine.filter(c => isOverdue(c, now)).length,
        resolved: res.length,
        avg: res.length ? res.reduce((a, c) => a + hoursBetween(c.created_at, c.resolved_at!), 0) / res.length : null,
        onTime: res.length ? pct(res.filter(c => c.resolved_at! <= c.due_at).length, res.length) : null,
        rating: r.length ? r.reduce((a, c) => a + c.satisfaction!, 0) / r.length : null,
      };
    })
    .filter(p => p.open + p.resolved > 0);

  // ---- Export ------------------------------------------------------------------------------

  const runExport = async (format: ExportFormat) => {
    if (rows.length === 0) { onToast('No complaints to export'); return; }
    try {
      await exportTable(format, {
        filename: `complaints-${TODAY}`,
        title: `Complaints · ${attn ? attn.label : tab}`,
        subtitle: `${rows.length} complaints · exported ${shortDate(TODAY)}`,
        columns: [
          { header: 'Ticket', width: 11 }, { header: 'Raised', width: 13 }, { header: 'Customer', width: 18 }, { header: 'Phone', width: 12 },
          { header: 'City', width: 12 }, { header: 'Order', width: 14 }, { header: 'Category', width: 16 }, { header: 'Issue', width: 30 },
          { header: 'Priority', width: 9 }, { header: 'Status', width: 12 }, { header: 'Assigned to', width: 16 }, { header: 'Deadline', width: 14 },
          { header: 'Resolution', width: 14 }, { header: 'Refund', width: 10, money: true },
        ],
        rows: rows.map(c => [
          c.ticket, shortDateTime(c.created_at), c.customer_name, c.phone, c.city, c.order_number ?? '', c.category, c.description,
          PRIORITY_LABEL[c.priority], STATUS_LABEL[c.status], who(c.assigned_to), deadlineText(c, now).text,
          c.resolution_type ?? '', c.refund_amount,
        ]),
      });
      onToast(`Complaints exported to ${format === 'excel' ? 'Excel' : 'PDF'}`);
    } catch {
      onToast('Export failed. Please try again.');
    }
  };

  const opened = complaints.find(c => c.id === openId);
  const assignTargets = assignIds ? complaints.filter(c => assignIds.includes(c.id)) : [];

  return (
    <>
      <div className="scoreboard">
        <button className="score score-btn" onClick={() => { setTab('To assign'); setAttention(null); }}>
          <div className={`num ${counts['To assign'] ? 'text-warn' : ''}`}>{complaints.filter(isUnassigned).length}</div><div className="label">To assign</div>
        </button>
        <div className="score"><div className="num">{active.length}</div><div className="label">Open · {active.filter(c => c.priority === 'urgent' || c.priority === 'high').length} urgent/high</div></div>
        <button className="score score-btn" onClick={() => setAttention('overdue')}>
          <div className={`num ${active.some(c => isOverdue(c, now)) ? 'text-warn' : ''}`}>{active.filter(c => isOverdue(c, now)).length}</div><div className="label">Past deadline</div>
        </button>
        <div className="score"><div className="num">{doneRecent.length ? fmtHours(avgHours) : '—'}</div><div className="label">Avg time to resolve · {pct(onTime, doneRecent.length)}% on time</div></div>
        <div className="score"><div className="num">{done.filter(c => daysBefore(c.resolved_at!) < 7).length}</div><div className="label">Resolved this week</div></div>
        <div className="score"><div className="num">{rated.length ? `${avgRating.toFixed(1)}★` : '—'}</div><div className="label">Customer rating</div></div>
        <div className="score"><div className="num">{rupeesShort(refunds)}</div><div className="label">Refunds this month</div></div>
      </div>

      <div className="alert-strip">
        <span className="alert-strip-label">Needs action</span>
        {ATTENTION.map(a => {
          const n = complaints.filter(a.test).length;
          return (
            <button key={a.key} className={`alert-pill ${attention === a.key ? 'active' : ''} ${n === 0 ? 'zero' : ''}`} onClick={() => setAttention(attention === a.key ? null : a.key)}>
              {a.label} · {n}
            </button>
          );
        })}
        {attention && <button className="link-btn clear-alert" onClick={() => setAttention(null)}>Clear</button>}
      </div>

      <div className="page-toolbar">
        <div className="filters">
          {TABS.map(t => (
            <button key={t} className={`filter-chip ${!attn && tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setAttention(null); setSelected(new Set()); }}>
              {t} ({counts[t]})
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          <button className="btn-primary" onClick={() => setCreating(true)}><Plus size={15} /> New complaint</button>
          <ExportMenu onExport={runExport} />
        </div>
      </div>

      <div className="filter-row">
        <select className="filter-select" value={priority} onChange={e => setPriority(e.target.value as Priority | 'all')} aria-label="Priority">
          <option value="all">All priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
        </select>
        <select className="filter-select" value={category} onChange={e => setCategory(e.target.value as Category | 'all')} aria-label="Category">
          <option value="all">All categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={owner} onChange={e => setOwner(e.target.value)} aria-label="Assigned to">
          <option value="all">Anyone</option>
          <option value="none">Unassigned</option>
          <option value="head">{who('head')}</option>
          {TELECALLERS.map(t => <option key={t.id} value={t.id}>{t.name}{t.is_active ? '' : ' (inactive)'}</option>)}
        </select>
        {(priority !== 'all' || category !== 'all' || owner !== 'all') && (
          <button className="link-btn clear-alert" onClick={() => { setPriority('all'); setCategory('all'); setOwner('all'); }}>Clear filters</button>
        )}
      </div>

      {selected.size > 0 && (
        <div className="bulk-bar">
          <strong>{selected.size} selected</strong>
          <button className="btn-primary btn-small" onClick={() => setAssignIds(Array.from(selected))}>Assign selected…</button>
          <button className="link-btn" onClick={() => setSelected(new Set())}>Clear selection</button>
        </div>
      )}

      <div className="panel">
        <div className="table-wrap">
          <table className="orders-table complaints-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}>
                  <input
                    type="checkbox"
                    aria-label="Select all open complaints"
                    checked={allSelected}
                    disabled={selectable.length === 0}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(selectable.map(c => c.id)))}
                  />
                </th>
                <th>Ticket</th><th>Customer</th><th>Issue</th><th>Priority</th><th>Status</th><th>Assigned to</th><th>Deadline</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow cols={9} text={attn ? `Nothing ${attn.label.toLowerCase()}.` : `No ${tab === 'All' ? '' : tab.toLowerCase() + ' '}complaints.`} />}
              {rows.map(c => {
                const dl = deadlineText(c, now);
                const withInactive = typeof c.assigned_to === 'number' && inactiveIds.has(c.assigned_to) && isActive(c);
                return (
                  <tr key={c.id} className={`clickable ${selected.has(c.id) ? 'row-selected' : ''}`} onClick={() => setOpenId(c.id)}>
                    <td onClick={e => e.stopPropagation()}>
                      {isActive(c) && <input type="checkbox" aria-label={`Select ${c.ticket}`} checked={selected.has(c.id)} onChange={() => toggle(c.id)} />}
                    </td>
                    <td className="order-no">{c.ticket}<div className="loc">{ago(c.created_at)}</div></td>
                    <td className="cust">{c.customer_name}<div className="loc">{c.city} · {c.phone}</div></td>
                    <td className="cmp-issue">
                      <strong>{c.category}</strong>{c.product && <span className="loc"> · {c.product}</span>}
                      <div className="loc">{c.returned_note && isUnassigned(c) ? `↩ ${c.returned_note}` : c.description}</div>
                    </td>
                    <td><PriorityChip p={c.priority} /></td>
                    <td>
                      <span className={`chip ${STATUS_CHIP[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                      {c.reopened && isActive(c) && <div className="loc text-warn">reopened</div>}
                    </td>
                    <td className={withInactive || c.assigned_to === null ? 'text-warn' : undefined}>
                      {who(c.assigned_to)}{withInactive && <div className="loc">inactive</div>}
                    </td>
                    <td className={dl.late ? 'text-warn' : undefined}>{dl.text}</td>
                    <td onClick={e => e.stopPropagation()}>
                      {isActive(c) && (
                        <button className={c.assigned_to === null || withInactive ? 'btn-primary btn-small' : 'kanban-btn'} onClick={() => setAssignIds([c.id])}>
                          {c.assigned_to === null ? 'Assign' : 'Reassign'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid equal-2">
        <div className="panel">
          <div className="panel-head"><h2>By category</h2><span className="panel-meta">all complaints · open in brackets</span></div>
          <HBarList rows={byCategory.map(x => ({ key: x.cat, label: x.cat, value: x.all, display: `${x.all} (${x.open})`, tip: `${x.cat}: ${x.all} complaints, ${x.open} still open` }))} />
        </div>
        <div className="panel">
          <div className="panel-head"><h2>By product</h2><span className="panel-meta">most complained about</span></div>
          <HBarList rows={byProduct.map(([p, n]) => ({ key: p, label: p, value: n, display: String(n), tip: `${p}: ${n} complaints` }))} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>By telecaller</h2><span className="panel-meta">resolved and times are for the last 30 days</span></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Telecaller</th><th className="num-col">Open</th><th className="num-col">Past deadline</th><th className="num-col">Resolved</th><th className="num-col">Avg time</th><th className="num-col">On time</th><th className="num-col">Rating</th></tr>
            </thead>
            <tbody>
              {perPerson.map(p => (
                <tr key={p.key}>
                  <td>
                    <button className="link-btn" onClick={() => { setOwner(p.key); setTab('All'); setAttention(null); }}>{p.name}</button>
                    {p.inactive && <span className="loc"> (inactive)</span>}
                  </td>
                  <td className={`num-col ${p.open >= OVERLOAD_AT || (p.inactive && p.open) ? 'text-warn' : ''}`}>{p.open}</td>
                  <td className={`num-col ${p.overdue ? 'text-warn' : ''}`}>{p.overdue}</td>
                  <td className="num-col">{p.resolved}</td>
                  <td className="num-col">{p.avg === null ? '—' : fmtHours(p.avg)}</td>
                  <td className="num-col">{p.onTime === null ? '—' : `${p.onTime}%`}</td>
                  <td className="num-col">{p.rating === null ? '—' : `${p.rating.toFixed(1)}★`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel-note">Sample data: the backend has no complaints table yet. Refunds this month: {rupees(refunds)}.</div>
      </div>

      {opened && (
        <ComplaintDrawer
          key={opened.id}
          complaint={opened}
          allComplaints={complaints}
          headName={headName}
          onClose={() => setOpenId(null)}
          onAssign={() => setAssignIds([opened.id])}
          onUpdate={(patch, event, toast) => { update(opened.id, patch, event); onToast(toast); }}
        />
      )}
      {assignIds && assignTargets.length > 0 && (
        <AssignPicker
          targets={assignTargets}
          allComplaints={complaints}
          headName={headName}
          onAssign={(to, note) => assign(assignIds, to, note)}
          onClose={() => setAssignIds(null)}
        />
      )}
      {creating && <NewComplaint onSave={create} onClose={() => setCreating(false)} />}
    </>
  );
}
