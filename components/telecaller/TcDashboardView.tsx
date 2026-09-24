import React, { useState } from 'react';
import { CALL_TARGET_DAILY, CALL_TARGET_MONTHLY, TELECALLERS, TODAY, VERTICALS, CallOutcome, TrackerSale } from '../../data/managerDashboard';
import { MONTH, ago, pct, rupeesShort, shortDateTime } from '../../lib/format';
import HBarList from '../HBarList';
import { CallButton, StatusChip, TargetRing } from './shared';
import {
  OUTCOMES,
  OUTCOME_COLORS,
  QUEUE_CHIP,
  QueueItem,
  TcSharedProps,
  fmtDuration,
  isOpenLead,
  stageName,
  stagesFor,
  time12,
  verticalName,
} from './tcData';

interface Props extends TcSharedProps {
  queue: QueueItem[];
  /** Everyone's sales, for the team ranking. */
  allSales: TrackerSale[];
  onNavigate: (page: string) => void;
  onCompleteFollowup: (id: number) => void;
}

export default function TcDashboardView({ me, leads, activities, sales, allSales, queue, onCall, onSale, onNavigate, onCompleteFollowup }: Props) {
  const [verticalId, setVerticalId] = useState(VERTICALS[0].id);

  const callsToday = activities.filter(a => a.created_at.startsWith(TODAY));
  const callsMonth = activities.filter(a => a.created_at.startsWith(MONTH));
  const outcomeCounts = OUTCOMES.reduce((m, o) => ({ ...m, [o]: callsToday.filter(a => a.outcome === o).length }), {} as Record<CallOutcome, number>);
  const salesToday = sales.filter(s => s.sold_at === TODAY);
  const salesMonth = sales.filter(s => s.sold_at.startsWith(MONTH));
  const monthRevenue = salesMonth.reduce((a, s) => a + s.amount, 0);
  const soldLeadIds = new Set(sales.map(s => s.lead_id));
  const conversion = pct(leads.filter(l => soldLeadIds.has(l.id)).length, leads.length);
  const workdaysSoFar = new Set(callsMonth.map(a => a.created_at.slice(0, 10))).size;

  // Team ranking by this month's sales
  const ranking = TELECALLERS
    .map(t => ({ t, revenue: allSales.filter(s => s.caller_id === t.id && s.sold_at.startsWith(MONTH)).reduce((a, s) => a + s.amount, 0) }))
    .sort((a, b) => b.revenue - a.revenue);
  const myRank = ranking.findIndex(r => r.t.id === me.id) + 1;

  const followupsToday = queue.filter(q => q.reason === 'Overdue follow-up' || q.reason === 'Follow-up today');
  const webLeads = leads.filter(l => l.source === 'Website' && isOpenLead(l));
  const pipeline = stagesFor(verticalId).map(s => ({ s, n: leads.filter(l => l.stage_id === s.id).length }));
  const recentCalls = [...callsToday].reverse().slice(0, 8);
  const leadName = (id: number) => leads.find(l => l.id === id)?.customer_name ?? '—';

  return (
    <>
      {/* 1. Targets */}
      <div className="grid equal-2">
        <div className="hero-target">
          <TargetRing done={callsToday.length} target={CALL_TARGET_DAILY} />
          <div className="htext">
            <h2>Today&apos;s calls</h2>
            <p>
              {callsToday.length} of {CALL_TARGET_DAILY} calls made:{' '}
              {callsToday.length < CALL_TARGET_DAILY
                ? `${CALL_TARGET_DAILY - callsToday.length} to go before your shift ends at 6:00 PM.`
                : 'target reached, great work!'}
            </p>
            <div className="hero-stats">
              <div><strong>{outcomeCounts.Connected}</strong><span>Connected</span></div>
              <div><strong>{followupsToday.length}</strong><span>Follow-ups due</span></div>
              <div><strong>{rupeesShort(salesToday.reduce((a, s) => a + s.amount, 0))}</strong><span>Sales today</span></div>
            </div>
          </div>
        </div>
        <div className="hero-target">
          <TargetRing done={callsMonth.length} target={CALL_TARGET_MONTHLY} />
          <div className="htext">
            <h2>This month</h2>
            <p>
              {callsMonth.length} of {CALL_TARGET_MONTHLY} calls ·{' '}
              {workdaysSoFar ? Math.round(callsMonth.length / workdaysSoFar) : 0} a day on average.
            </p>
            <div className="hero-stats">
              <div><strong>{rupeesShort(monthRevenue)}</strong><span>{salesMonth.length} sales</span></div>
              <div><strong>{conversion}%</strong><span>Conversion</span></div>
              <div><strong>#{myRank}</strong><span>of {ranking.length} in team</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Call next */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Call next</h2>
          <button className="link link-btn" onClick={() => onNavigate('leads')}>All my leads</button>
        </div>
        {queue.length === 0 ? (
          <div className="loc">Nothing waiting: every lead is up to date.</div>
        ) : (
          <ul className="queue-list">
            {queue.slice(0, 8).map(q => (
              <li key={q.lead.id}>
                <span className={`chip ${QUEUE_CHIP[q.reason]}`}>{q.reason}</span>
                <div className="queue-main">
                  <div className="name">{q.lead.customer_name} <span className="loc">· {q.lead.phone}</span></div>
                  <div className="action">
                    {verticalName(q.lead.vertical_id)} · {stageName(q.lead.stage_id)}
                    {q.followup ? ` · ${q.followup.note}` : ''}
                    {q.lastCall ? ` · last call ${ago(q.lastCall.created_at)}: ${q.lastCall.note}` : ' · never called'}
                  </div>
                </div>
                <div className="queue-actions">
                  <CallButton onClick={() => onCall(q.lead, q.followup)} />
                  <button className="kanban-btn" onClick={() => onSale(q.lead)}>Sale</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {queue.length > 8 && <div className="attn-more">+ {queue.length - 8} more in My leads and Follow-ups</div>}
      </div>

      {/* 3. Outcomes + pipeline */}
      <div className="grid equal-2">
        <div className="panel">
          <div className="panel-head">
            <h2>Today&apos;s call outcomes</h2>
            <span className="panel-meta">{callsToday.length} calls</span>
          </div>
          <div className="outcome-bar">
            {OUTCOMES.map(o => (
              <span key={o} style={{ width: `${callsToday.length ? (outcomeCounts[o] / callsToday.length) * 100 : 0}%`, background: OUTCOME_COLORS[o] }} />
            ))}
          </div>
          <div className="outcome-legend">
            {OUTCOMES.map(o => (
              <span key={o}><i className="dot3" style={{ background: OUTCOME_COLORS[o] }} />{o} · {outcomeCounts[o]}</span>
            ))}
          </div>
          <div className="loc" style={{ marginTop: 12 }}>
            Connect rate today: <strong>{pct(outcomeCounts.Connected, callsToday.length)}%</strong>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>My pipeline</h2>
            <span className="panel-meta">{leads.filter(l => l.vertical_id === verticalId).length} leads</span>
          </div>
          <div className="filters" style={{ marginBottom: 14 }}>
            {VERTICALS.map(v => (
              <button key={v.id} className={`filter-chip ${verticalId === v.id ? 'active' : ''}`} onClick={() => setVerticalId(v.id)}>{v.name}</button>
            ))}
          </div>
          <HBarList rows={pipeline.map(p => ({ key: String(p.s.id), label: p.s.name, value: p.n, display: String(p.n), tip: `${p.s.name}: ${p.n} leads` }))} />
        </div>
      </div>

      {/* 4. Follow-ups + website leads */}
      <div className="grid equal-2">
        <div className="panel">
          <div className="panel-head">
            <h2>Follow-ups due</h2>
            <button className="link link-btn" onClick={() => onNavigate('followups')}>View all</button>
          </div>
          <ul className="attn-list">
            {followupsToday.length === 0 && <li><div className="action">No follow-ups due.</div></li>}
            {followupsToday.slice(0, 5).map(q => (
              <li key={q.followup!.id}>
                <div>
                  <div className="name">{q.lead.customer_name}</div>
                  <div className="action">{q.followup!.note}</div>
                </div>
                <div className="attn-side">
                  <span className="when">{q.reason === 'Overdue follow-up' ? `Overdue · ${shortDateTime(q.followup!.due_at).split(',')[0]}` : time12(q.followup!.due_at)}</span>
                  <div className="row-actions">
                    <CallButton onClick={() => onCall(q.lead, q.followup)} />
                    <button className="kanban-btn" onClick={() => onCompleteFollowup(q.followup!.id)}>Done</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Leads from website enquiries</h2>
            <span className="panel-meta">{webLeads.length} open</span>
          </div>
          <div className="loc" style={{ marginBottom: 8 }}>These customers contacted Manikstu themselves, so they&apos;re usually easy to convert.</div>
          <ul className="attn-list">
            {webLeads.length === 0 && <li><div className="action">No open website leads.</div></li>}
            {webLeads.slice(0, 5).map(l => (
              <li key={l.id}>
                <div>
                  <div className="name">{l.customer_name}</div>
                  <div className="action">{verticalName(l.vertical_id)} · {stageName(l.stage_id)} · added {ago(l.created_at)}</div>
                </div>
                <div className="attn-side"><CallButton onClick={() => onCall(l)} /></div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 5. Call log */}
      <div className="panel">
        <div className="panel-head">
          <h2>My calls today</h2>
          <button className="link link-btn" onClick={() => onNavigate('reports')}>Export call log</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Time</th><th>Lead</th><th>Outcome</th><th>Duration</th><th>Stage</th><th>Note</th></tr>
            </thead>
            <tbody>
              {recentCalls.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '20px 0' }}>No calls logged yet today.</td></tr>
              )}
              {recentCalls.map(a => (
                <tr key={a.id}>
                  <td>{time12(a.created_at)}</td>
                  <td className="cust">{leadName(a.lead_id)}</td>
                  <td><StatusChip status={a.outcome} /></td>
                  <td>{fmtDuration(a.duration_sec)}</td>
                  <td>{a.stage_id ? stageName(a.stage_id) : '—'}</td>
                  <td>{a.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel-note">
          Showing the latest 8 of {callsToday.length} calls today. Call outcome, duration and targets aren&apos;t stored by the backend yet.
        </div>
      </div>
    </>
  );
}
