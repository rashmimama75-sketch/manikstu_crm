import React, { useState } from 'react';
import { TELECALLERS, TODAY, Followup } from '../../data/managerDashboard';
import { ago, dayStart, shortDate, shortDateTime } from '../../lib/format';
import { ExportFormat, exportTable } from '../../lib/export';
import ExportMenu from '../ExportMenu';
import { EmptyRow, StatusChip } from './shared';
import { TeamData, callerName, isOverdue, lastCallFor, stageName, time12, verticalName } from './tcData';

type Tab = 'Overdue' | 'Due today' | 'Upcoming' | 'Done';
const TABS: Tab[] = ['Overdue', 'Due today', 'Upcoming', 'Done'];

const tabOf = (f: Followup): Tab => {
  if (f.status === 'done') return 'Done';
  if (isOverdue(f)) return 'Overdue';
  if (f.due_at.startsWith(TODAY)) return 'Due today';
  return 'Upcoming';
};

interface Props {
  data: TeamData;
  searchQuery: string;
  initialCaller?: number;
  onReassign: (leadIds: number[], toCallerId: number) => void;
  onToast: (message: string) => void;
}

export default function TeamFollowups({ data, searchQuery, initialCaller, onReassign, onToast }: Props) {
  const [caller, setCaller] = useState<number | 'all'>(initialCaller ?? 'all');
  const scoped = data.followups.filter(f => caller === 'all' || f.caller_id === caller);
  const counts = TABS.reduce((m, t) => ({ ...m, [t]: scoped.filter(f => tabOf(f) === t).length }), {} as Record<Tab, number>);
  const [tab, setTab] = useState<Tab>('Overdue');
  const leadOf = (id: number) => data.leads.find(l => l.id === id);

  const q = searchQuery.trim().toLowerCase();
  const rows = scoped
    .filter(f => tabOf(f) === tab)
    .filter(f => {
      const l = leadOf(f.lead_id);
      return !q || (l && [l.customer_name, l.phone, f.note].some(v => v.toLowerCase().includes(q)));
    })
    .sort((a, b) => (tab === 'Done' ? b.due_at.localeCompare(a.due_at) : a.due_at.localeCompare(b.due_at)));

  // Per-person summary strip
  const perCaller = TELECALLERS
    .map(t => {
      const mine = data.followups.filter(f => f.caller_id === t.id);
      return { t, overdue: mine.filter(isOverdue).length, today: mine.filter(f => tabOf(f) === 'Due today').length };
    })
    .filter(x => x.overdue + x.today > 0 || x.t.is_active);

  const runExport = async (format: ExportFormat) => {
    if (rows.length === 0) { onToast('No follow-ups to export'); return; }
    try {
      await exportTable(format, {
        filename: `team-followups-${TODAY}`,
        title: `Follow-ups · ${tab}`,
        subtitle: `${rows.length} follow-ups${caller === 'all' ? '' : ` · ${callerName(caller)}`} · exported ${shortDate(TODAY)}`,
        columns: [
          { header: 'Due', width: 14 }, { header: 'Telecaller', width: 16 }, { header: 'Lead', width: 18 },
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

  return (
    <>
      <div className="scoreboard">
        <div className="score"><div className="num">{counts.Overdue}</div><div className="label">Overdue</div></div>
        <div className="score"><div className="num">{counts['Due today']}</div><div className="label">Due today</div></div>
        <div className="score"><div className="num">{counts.Upcoming}</div><div className="label">Upcoming</div></div>
        <div className="score"><div className="num">{scoped.filter(f => f.status === 'done' && f.completed_at?.startsWith(TODAY)).length}</div><div className="label">Done today</div></div>
      </div>

      <div className="caller-strip">
        {perCaller.map(x => (
          <button
            key={x.t.id}
            className={`caller-card ${caller === x.t.id ? 'active' : ''} ${x.overdue >= 2 || !x.t.is_active ? 'warn' : ''}`}
            onClick={() => setCaller(caller === x.t.id ? 'all' : x.t.id)}
          >
            <span className="caller-name">{x.t.name}{x.t.is_active ? '' : ' (inactive)'}</span>
            <span className="caller-counts"><strong className={x.overdue ? 'text-warn' : undefined}>{x.overdue}</strong> overdue · {x.today} today</span>
          </button>
        ))}
      </div>

      <div className="page-toolbar">
        <div className="filters">
          {TABS.map(t => (
            <button key={t} className={`filter-chip ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t} ({counts[t]})</button>
          ))}
        </div>
        <div className="toolbar-actions">
          {caller !== 'all' && <button className="link-btn clear-alert" onClick={() => setCaller('all')}>Show whole team</button>}
          <ExportMenu onExport={runExport} />
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="orders-table">
            <thead>
              <tr><th>Due</th><th>Telecaller</th><th>Lead</th><th>Reason</th><th>Last call</th><th>Status</th><th>Reassign</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow cols={7} text={`No ${tab.toLowerCase()} follow-ups${caller === 'all' ? '' : ` for ${callerName(caller)}`}.`} />}
              {rows.map(f => {
                const lead = leadOf(f.lead_id);
                const last = lastCallFor(f.lead_id, data.activities);
                return (
                  <tr key={f.id}>
                    <td className={tab === 'Overdue' ? 'text-warn' : undefined}>
                      {f.due_at.startsWith(TODAY) ? `Today, ${time12(f.due_at)}` : shortDate(f.due_at)}
                      {tab === 'Overdue' && <div className="loc">{Math.round((dayStart(TODAY) - dayStart(f.due_at)) / 86_400_000)} days late</div>}
                    </td>
                    <td>{callerName(f.caller_id)}</td>
                    <td className="cust">
                      {lead?.customer_name ?? '—'}
                      {lead && <div className="loc">{lead.phone} · {verticalName(lead.vertical_id)} · {stageName(lead.stage_id)}</div>}
                    </td>
                    <td>{f.note}</td>
                    <td>{last ? <>{last.note}<div className="loc">{ago(last.created_at)}</div></> : <span className="loc">Never</span>}</td>
                    <td><StatusChip status={f.status === 'missed' ? 'Missed' : tab} /></td>
                    <td>
                      {tab !== 'Done' && lead && (
                        <select
                          className="reassign"
                          value=""
                          aria-label={`Reassign ${lead.customer_name}`}
                          onChange={e => onReassign([lead.id], Number(e.target.value))}
                        >
                          <option value="" disabled>Move to…</option>
                          {TELECALLERS.filter(t => t.is_active && t.id !== f.caller_id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
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
