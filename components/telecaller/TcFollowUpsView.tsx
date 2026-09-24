import React, { useState } from 'react';
import { TODAY, Followup } from '../../data/managerDashboard';
import { ago, dayStart, shortDateTime } from '../../lib/format';
import { CallButton, EmptyRow, StatusChip } from './shared';
import { TcSharedProps, lastCallFor, stageName, time12, verticalName } from './tcData';

type Tab = 'Overdue' | 'Due today' | 'Upcoming' | 'Done';
const TABS: Tab[] = ['Overdue', 'Due today', 'Upcoming', 'Done'];

const tabOf = (f: Followup): Tab => {
  if (f.status === 'done') return 'Done';
  if (f.status === 'missed' || dayStart(f.due_at) < dayStart(TODAY)) return 'Overdue';
  if (f.due_at.startsWith(TODAY)) return 'Due today';
  return 'Upcoming';
};

export default function TcFollowUpsView({ leads, followups, activities, onCall, searchQuery, onComplete }: TcSharedProps & {
  searchQuery: string;
  onComplete: (id: number) => void;
}) {
  const counts = TABS.reduce((m, t) => ({ ...m, [t]: followups.filter(f => tabOf(f) === t).length }), {} as Record<Tab, number>);
  const [tab, setTab] = useState<Tab>(counts.Overdue > 0 ? 'Overdue' : 'Due today');
  const leadOf = (id: number) => leads.find(l => l.id === id);
  const doneToday = followups.filter(f => f.status === 'done' && f.completed_at?.startsWith(TODAY)).length;

  const q = searchQuery.trim().toLowerCase();
  const rows = followups
    .filter(f => tabOf(f) === tab)
    .filter(f => {
      const l = leadOf(f.lead_id);
      return !q || (l && [l.customer_name, l.phone, f.note].some(v => v.toLowerCase().includes(q)));
    })
    .sort((a, b) => (tab === 'Done' ? b.due_at.localeCompare(a.due_at) : a.due_at.localeCompare(b.due_at)));

  return (
    <>
      <div className="scoreboard">
        <div className="score"><div className="num">{counts.Overdue}</div><div className="label">Overdue</div></div>
        <div className="score"><div className="num">{counts['Due today']}</div><div className="label">Due today</div></div>
        <div className="score"><div className="num">{counts.Upcoming}</div><div className="label">Upcoming</div></div>
        <div className="score"><div className="num">{doneToday}</div><div className="label">Done today</div></div>
      </div>

      <div className="page-toolbar">
        <div className="filters">
          {TABS.map(t => (
            <button key={t} className={`filter-chip ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t} ({counts[t]})</button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="orders-table">
            <thead>
              <tr><th>Lead</th><th>Reason</th><th>Due</th><th>Last call</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow cols={6} text={`No ${tab.toLowerCase()} follow-ups.`} />}
              {rows.map(f => {
                const lead = leadOf(f.lead_id);
                const last = lastCallFor(f.lead_id, activities);
                return (
                  <tr key={f.id}>
                    <td className="cust">
                      {lead?.customer_name ?? '—'}
                      {lead && <div className="loc">{lead.phone} · {verticalName(lead.vertical_id)} · {stageName(lead.stage_id)}</div>}
                    </td>
                    <td>{f.note}</td>
                    <td className={tab === 'Overdue' ? 'text-warn' : undefined}>
                      {f.due_at.startsWith(TODAY) ? `Today, ${time12(f.due_at)}` : shortDateTime(f.due_at).split(',')[0]}
                    </td>
                    <td>{last ? <>{last.note}<div className="loc">{ago(last.created_at)}</div></> : <span className="loc">Never</span>}</td>
                    <td><StatusChip status={f.status === 'missed' ? 'Missed' : tab} /></td>
                    <td>
                      {tab !== 'Done' && lead && (
                        <div className="row-actions">
                          <CallButton onClick={() => onCall(lead, f)} />
                          <button className="kanban-btn" onClick={() => onComplete(f.id)}>Done</button>
                        </div>
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
