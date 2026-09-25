import React, { useState } from 'react';
import { CallOutcome, LeadActivity, TODAY, TrackerLead } from '../../data/managerDashboard';
import { MONTH, shortDateTime } from '../../lib/format';
import { EmptyRow, StatusChip } from '../telecaller/shared';
import { OUTCOMES, fmtDuration, stageName } from '../telecaller/tcData';

type Period = 'Today' | 'This month' | 'All';
const PERIODS: Period[] = ['Today', 'This month', 'All'];

interface Props {
  activities: LeadActivity[];
  leads: TrackerLead[];
  searchQuery: string;
}

export default function CallHistoryView({ activities, leads, searchQuery }: Props) {
  const [period, setPeriod] = useState<Period>('Today');
  const [outcome, setOutcome] = useState<CallOutcome | 'All'>('All');
  const leadOf = (id: number) => leads.find(l => l.id === id);

  const inPeriod = activities.filter(a =>
    period === 'Today' ? a.created_at.startsWith(TODAY) : period === 'This month' ? a.created_at.startsWith(MONTH) : true
  );
  const q = searchQuery.trim().toLowerCase();
  const rows = inPeriod
    .filter(a => outcome === 'All' || a.outcome === outcome)
    .filter(a => {
      if (!q) return true;
      const l = leadOf(a.lead_id);
      return !!l && [l.customer_name, l.phone, a.note].some(v => v.toLowerCase().includes(q));
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const count = (o: CallOutcome) => inPeriod.filter(a => a.outcome === o).length;

  return (
    <>
      <div className="scoreboard">
        <div className="score"><div className="num">{inPeriod.length}</div><div className="label">Calls · {period.toLowerCase()}</div></div>
        {OUTCOMES.map(o => (
          <div key={o} className="score"><div className="num">{count(o)}</div><div className="label">{o}</div></div>
        ))}
      </div>

      <div className="page-toolbar">
        <div className="filters">
          {PERIODS.map(p => (
            <button key={p} className={`filter-chip ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
        <div className="filters">
          {(['All', ...OUTCOMES] as const).map(o => (
            <button key={o} className={`filter-chip ${outcome === o ? 'active' : ''}`} onClick={() => setOutcome(o)}>{o}</button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Time</th><th>Lead</th><th>Outcome</th><th>Duration</th><th>Stage</th><th>Note</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow cols={6} text="No calls match these filters." />}
              {rows.map(a => {
                const l = leadOf(a.lead_id);
                return (
                  <tr key={a.id}>
                    <td>{shortDateTime(a.created_at)}</td>
                    <td className="cust">
                      {l?.customer_name ?? '—'}
                      {l && <div className="loc">{l.phone}</div>}
                    </td>
                    <td><StatusChip status={a.outcome} /></td>
                    <td>{fmtDuration(a.duration_sec)}</td>
                    <td>{a.stage_id ? stageName(a.stage_id) : '—'}</td>
                    <td>{a.note}</td>
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
