import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CalendarCheck, CalendarClock, CalendarDays, ChevronDown, SlidersHorizontal, X } from 'lucide-react';
import { TELECALLERS, TODAY, Followup } from '../../data/managerDashboard';
import { ago, dayStart, shortDate, shortDateTime } from '../../lib/format';
import { ExportFormat, exportTable } from '../../lib/export';
import ExportMenu from '../ExportMenu';
import { EmptyRow, StatusChip } from './shared';
import { TeamData, callerName, isOverdue, lastCallFor, stageName, time12 } from './tcData';
import { initials } from '../views/telecallingMetrics';

type Tab = 'Overdue' | 'Due today' | 'Upcoming' | 'Done' | 'All';
const STATUS: { key: Tab; hint: string }[] = [
  { key: 'Overdue', hint: 'Missed or past their date' },
  { key: 'Due today', hint: 'Callbacks promised for today' },
  { key: 'Upcoming', hint: 'Due after today' },
  { key: 'Done', hint: 'Called back' },
  { key: 'All', hint: 'Every follow-up' },
];

const tabOf = (f: Followup): Exclude<Tab, 'All'> => {
  if (f.status === 'done') return 'Done';
  if (isOverdue(f)) return 'Overdue';
  if (f.due_at.startsWith(TODAY)) return 'Due today';
  return 'Upcoming';
};
const daysLate = (f: Followup) => Math.round((dayStart(TODAY) - dayStart(f.due_at)) / 86_400_000);

interface Props {
  data: TeamData;
  searchQuery: string;
  initialCaller?: number;
  onReassign: (leadIds: number[], toCallerId: number) => void;
  onToast: (message: string) => void;
}

/** Callbacks the calling executives owe: who is behind, and moving leads to someone who can call. */
export default function TeamFollowups({ data, searchQuery, initialCaller, onReassign, onToast }: Props) {
  const [caller, setCaller] = useState<number | 'all'>(initialCaller ?? 'all');
  const [tab, setTab] = useState<Tab>('Overdue');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  const leadOf = (id: number) => data.leads.find(l => l.id === id);
  const scoped = data.followups.filter(f => caller === 'all' || f.caller_id === caller);
  const countOf = (t: Tab) => (t === 'All' ? scoped.length : scoped.filter(f => tabOf(f) === t).length);
  const doneToday = scoped.filter(f => f.status === 'done' && f.completed_at?.startsWith(TODAY)).length;

  const q = searchQuery.trim().toLowerCase();
  const rows = scoped
    .filter(f => tab === 'All' || tabOf(f) === tab)
    .filter(f => {
      const l = leadOf(f.lead_id);
      return !q || (l && [l.customer_name, l.phone, f.note].some(v => v.toLowerCase().includes(q)));
    })
    .sort((a, b) => (tab === 'Done' ? b.due_at.localeCompare(a.due_at) : a.due_at.localeCompare(b.due_at)));

  // Each calling executive: what they owe and how reliably they call back
  const board = TELECALLERS.map(t => {
    const mine = data.followups.filter(f => f.caller_id === t.id);
    const done = mine.filter(f => f.status === 'done').length;
    const missed = mine.filter(f => f.status === 'missed').length;
    return {
      t,
      overdue: mine.filter(isOverdue).length,
      today: mine.filter(f => tabOf(f) === 'Due today').length,
      upcoming: mine.filter(f => tabOf(f) === 'Upcoming').length,
      kept: done + missed ? Math.round((done / (done + missed)) * 100) : null,
    };
  })
    .filter(x => x.t.is_active || x.overdue + x.today + x.upcoming > 0)
    .sort((a, b) => Number(b.t.is_active) - Number(a.t.is_active) || b.overdue - a.overdue);

  const tags = [
    tab !== 'All' && { key: 'status', k: 'Status', v: tab, clear: () => setTab('All') },
    caller !== 'all' && { key: 'caller', k: 'Executive', v: callerName(caller), clear: () => setCaller('all') },
  ].filter(Boolean) as { key: string; k: string; v: string; clear: () => void }[];
  const clearFilters = () => { setTab('All'); setCaller('all'); };

  const runExport = async (format: ExportFormat) => {
    if (rows.length === 0) { onToast('No follow-ups to export'); return; }
    try {
      await exportTable(format, {
        filename: `team-followups-${TODAY}`,
        title: `Follow-ups · ${tab}`,
        subtitle: `${rows.length} follow-ups${caller === 'all' ? '' : ` · ${callerName(caller)}`} · exported ${shortDate(TODAY)}`,
        columns: [
          { header: 'Due', width: 14 }, { header: 'Calling executive', width: 16 }, { header: 'Lead', width: 18 },
          { header: 'Phone', width: 12 }, { header: 'Reason', width: 26 }, { header: 'Status', width: 10 },
        ],
        rows: rows.map(f => {
          const l = leadOf(f.lead_id);
          return [shortDateTime(f.due_at), callerName(f.caller_id), l?.customer_name ?? '', l?.phone ?? '', f.note, f.status];
        }),
      });
      onToast(`Follow-ups exported to ${format === 'excel' ? 'Excel' : 'PDF'}`);
    } catch {
      onToast('Export failed. Please try again.');
    }
  };

  const TILES: { key: Tab; icon: typeof CalendarClock; n: number; label: string; tone?: string }[] = [
    { key: 'Overdue', icon: AlertTriangle, n: countOf('Overdue'), label: 'Overdue · call these first', tone: 'alert' },
    { key: 'Due today', icon: CalendarClock, n: countOf('Due today'), label: 'Due today' },
    { key: 'Upcoming', icon: CalendarDays, n: countOf('Upcoming'), label: 'Upcoming' },
    { key: 'Done', icon: CalendarCheck, n: doneToday, label: 'Done today' },
  ];

  return (
    <>
      {/* Status tiles: click to filter */}
      <div className="fu-tiles">
        {TILES.map(({ key, icon: Icon, n, label, tone }) => (
          <button key={key} className={`stat-tile fu-tile ${tone ?? ''} ${tab === key ? 'selected' : ''}`} onClick={() => setTab(tab === key ? 'All' : key)}>
            <Icon className="stat-icon" size={22} />
            <div className="num">{n}</div>
            <div className="label">{label}</div>
          </button>
        ))}
      </div>

      {/* Calling executives */}
      <div className="panel fu-board-panel">
        <div className="panel-head">
          <h2>Calling executives</h2>
          <span className="panel-meta">follow-ups each · click to see theirs</span>
        </div>
        <div className="exec-board fu-board">
          {board.map(({ t, overdue, today, upcoming, kept }) => (
            <div
              key={t.id}
              className={`exec-load ${caller === t.id ? 'active' : ''} ${t.is_active ? '' : 'inactive'}`}
              role="button"
              tabIndex={0}
              onClick={() => setCaller(caller === t.id ? 'all' : t.id)}
              onKeyDown={e => { if (e.key === 'Enter') setCaller(caller === t.id ? 'all' : t.id); }}
            >
              <div className="exec-load-top">
                <div className="avatar">{initials(t.name)}</div>
                <div className="exec-load-who">
                  <div className="exec-load-name">{t.name}</div>
                  <div className="loc">{t.region}{!t.is_active && <> · <span className="chip muted">Inactive</span></>}</div>
                </div>
                <div className={`exec-load-num ${overdue ? 'text-warn' : ''}`} title="Overdue follow-ups">{overdue}</div>
              </div>
              <div className="fu-kept">
                <div className="exec-load-bar"><span style={{ width: `${kept ?? 0}%` }} /></div>
                <span>{kept === null ? 'no history' : `${kept}% kept`}</span>
              </div>
              <div className="exec-load-meta">
                <span>{today} today</span>
                <span>{upcoming} upcoming</span>
                <span className={overdue ? 'text-warn' : undefined}>{overdue} overdue</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* One filter menu, active filters as tags, export */}
      <div className="lf-bar">
        <div className="lf-wrap" ref={menuRef}>
          <button className={`lf-trigger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(o => !o)} aria-expanded={menuOpen} aria-haspopup="dialog">
            <SlidersHorizontal size={15} /> Filters
            {tags.length > 0 && <span className="lf-count">{tags.length}</span>}
            <ChevronDown size={15} className="lf-caret" />
          </button>
          {menuOpen && (
            <div className="lf-menu fu-menu" role="dialog" aria-label="Filter follow-ups">
              <div className="lf-section">
                <div className="lf-title">Status</div>
                {STATUS.map(s => (
                  <button key={s.key} className={`lf-option ${tab === s.key ? 'on' : ''}`} onClick={() => setTab(s.key)}>
                    <span className="lf-radio" />
                    <span className="lf-opt-text">{s.key}<small>{s.hint}</small></span>
                    <span className="lf-n">{countOf(s.key)}</span>
                  </button>
                ))}
              </div>
              <div className="lf-section">
                <div className="lf-title">Calling executive</div>
                <button className={`lf-option ${caller === 'all' ? 'on' : ''}`} onClick={() => setCaller('all')}>
                  <span className="lf-radio" />Everyone
                </button>
                {TELECALLERS.map(t => (
                  <button key={t.id} className={`lf-option ${caller === t.id ? 'on' : ''}`} onClick={() => setCaller(t.id)}>
                    <span className="lf-radio" />{t.name}
                    {t.is_active ? <span className="lf-n">{data.followups.filter(f => f.caller_id === t.id && isOverdue(f)).length} overdue</span> : <span className="lf-n muted">inactive</span>}
                  </button>
                ))}
              </div>
              <div className="lf-foot">
                <button className="link-btn lf-reset" onClick={clearFilters}>Reset all</button>
                <button className="btn-primary btn-small" onClick={() => setMenuOpen(false)}>Show {rows.length} follow-ups</button>
              </div>
            </div>
          )}
        </div>

        <div className="lf-tags">
          {tags.map(tag => (
            <span key={tag.key} className="lf-tag">
              <span className="lf-tag-k">{tag.k}</span> {tag.v}
              <button onClick={tag.clear} aria-label={`Remove ${tag.k} filter`}><X size={12} /></button>
            </span>
          ))}
          {tags.length > 0 && <button className="link-btn lf-clear" onClick={clearFilters}>Clear all</button>}
        </div>

        <span className="lf-total">{rows.length} follow-ups</span>
        <ExportMenu onExport={runExport} />
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="orders-table fu-table">
            <thead>
              <tr><th>Due</th><th>Lead</th><th>Reason</th><th>Calling executive</th><th>Last call</th><th>Status</th><th>Move to</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow cols={7} text={`No ${tab === 'All' ? '' : `${tab.toLowerCase()} `}follow-ups${caller === 'all' ? '' : ` for ${callerName(caller)}`}.`} />}
              {rows.map(f => {
                const lead = leadOf(f.lead_id);
                const last = lastCallFor(f.lead_id, data.activities);
                const t = tabOf(f);
                const owner = TELECALLERS.find(x => x.id === f.caller_id);
                return (
                  <tr key={f.id} className={t === 'Overdue' ? 'fu-row-overdue' : undefined}>
                    <td className="due-cell">
                      <div className={t === 'Overdue' ? 'text-warn strong' : 'strong'}>{f.due_at.startsWith(TODAY) ? `Today, ${time12(f.due_at)}` : shortDate(f.due_at)}</div>
                      {t === 'Overdue' && <span className="fu-late">{daysLate(f)} {daysLate(f) === 1 ? 'day' : 'days'} late</span>}
                    </td>
                    <td className="cust">
                      {lead?.customer_name ?? '—'}
                      {lead && <div className="loc">{lead.phone} · {stageName(lead.stage_id)}</div>}
                    </td>
                    <td>{f.note}</td>
                    <td>
                      {callerName(f.caller_id)}
                      {owner && !owner.is_active && <div><span className="chip muted">Inactive</span></div>}
                    </td>
                    <td>{last ? <>{last.note}<div className="loc">{ago(last.created_at)}</div></> : <span className="loc">Never</span>}</td>
                    <td><StatusChip status={f.status === 'missed' ? 'Missed' : t} /></td>
                    <td>
                      {t !== 'Done' && lead && (
                        <select
                          className="reassign"
                          value=""
                          aria-label={`Move ${lead.customer_name} to another executive`}
                          onChange={e => onReassign([lead.id], Number(e.target.value))}
                        >
                          <option value="" disabled>Move to…</option>
                          {TELECALLERS.filter(x => x.is_active && x.id !== f.caller_id).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
