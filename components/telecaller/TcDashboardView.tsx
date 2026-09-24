import React from 'react';
import {
  CallLogEntry,
  CallOutcome,
  Complaint,
  FollowUp,
  TcLead,
  DAILY_CALL_TARGET,
  MONTHLY_CALL_TARGET,
  SALES_SUMMARY,
} from '../../data/telecallerData';
import { CallButton, StatusChip, TargetRing } from './shared';

interface Props {
  leads: TcLead[];
  followUps: FollowUp[];
  complaints: Complaint[];
  callLog: CallLogEntry[];
  outcomeCounts: Record<CallOutcome, number>;
  monthCalls: number;
  onCall: (target: { name: string; leadId?: string; followUpId?: string }) => void;
  onNavigate: (page: string) => void;
}

const OUTCOME_COLORS: Record<CallOutcome, string> = {
  Connected: 'var(--leaf)',
  'No answer': 'var(--gold)',
  Busy: 'var(--rust)',
};

export default function TcDashboardView({
  leads,
  followUps,
  complaints,
  callLog,
  outcomeCounts,
  monthCalls,
  onCall,
  onNavigate,
}: Props) {
  const callsToday = outcomeCounts.Connected + outcomeCounts['No answer'] + outcomeCounts.Busy;
  const remaining = Math.max(0, DAILY_CALL_TARGET - callsToday);
  const dueFollowUps = followUps.filter(f => f.status === 'Due today' || f.status === 'Overdue');
  const openComplaints = complaints.filter(c => c.status !== 'Resolved').length;
  const resolvedComplaints = complaints.filter(c => c.status === 'Resolved').length;
  const upNext = leads.filter(l => l.status === 'Pending').slice(0, 3);

  return (
    <>
      <div className="grid equal-2">
        <div className="hero-target">
          <TargetRing done={callsToday} target={DAILY_CALL_TARGET} />
          <div className="htext">
            <h2>Today&apos;s target</h2>
            <p>
              {callsToday} of {DAILY_CALL_TARGET} calls made —{' '}
              {remaining > 0 ? `${remaining} to go before your shift ends at 6:00 PM.` : 'target reached, great work!'}
            </p>
            <div className="hero-stats">
              <div><strong>{outcomeCounts.Connected}</strong><span>Connected</span></div>
              <div><strong>{dueFollowUps.length}</strong><span>Follow-ups due</span></div>
              <div><strong>{openComplaints}</strong><span>Complaints open</span></div>
            </div>
          </div>
        </div>
        <div className="hero-target">
          <TargetRing done={monthCalls} target={MONTHLY_CALL_TARGET} />
          <div className="htext">
            <h2>Monthly target</h2>
            <p>
              {monthCalls} of {MONTHLY_CALL_TARGET} calls made this month —{' '}
              {Math.max(0, MONTHLY_CALL_TARGET - monthCalls)} to go before month end.
            </p>
            <div className="hero-stats">
              <div><strong>{SALES_SUMMARY.ordersConfirmed}</strong><span>Orders confirmed</span></div>
              <div><strong>29</strong><span>Avg. calls/day</span></div>
              <div><strong>{resolvedComplaints}</strong><span>Complaints resolved</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Today&apos;s call outcomes</h2>
          <span className="link">{callsToday} calls made</span>
        </div>
        <div className="outcome-bar">
          {(Object.keys(OUTCOME_COLORS) as CallOutcome[]).map(o => (
            <span
              key={o}
              style={{ width: `${callsToday ? (outcomeCounts[o] / callsToday) * 100 : 0}%`, background: OUTCOME_COLORS[o] }}
            />
          ))}
        </div>
        <div className="outcome-legend">
          <span><i className="dot3" style={{ background: OUTCOME_COLORS.Connected }} />Connected · {outcomeCounts.Connected}</span>
          <span><i className="dot3" style={{ background: OUTCOME_COLORS['No answer'] }} />No answer · {outcomeCounts['No answer']}</span>
          <span><i className="dot3" style={{ background: OUTCOME_COLORS.Busy }} />Busy / switched off · {outcomeCounts.Busy}</span>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="panel">
          <div className="panel-head">
            <h2>Up next</h2>
            <button className="link link-btn" onClick={() => onNavigate('today')}>Today&apos;s leads</button>
          </div>
          <ul className="lead-list">
            {upNext.length === 0 && <li><div className="action">All of today&apos;s leads have been called.</div></li>}
            {upNext.map(l => (
              <li key={l.id}>
                <div>
                  <div className="name">{l.name}</div>
                  <div className="action">{l.interest} · {l.village}</div>
                </div>
                <CallButton onClick={() => onCall({ name: l.name, leadId: l.id })} />
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <div className="panel-head">
            <h2>Follow-ups due today</h2>
            <button className="link link-btn" onClick={() => onNavigate('followups')}>View all</button>
          </div>
          <ul className="lead-list">
            {dueFollowUps.length === 0 && <li><div className="action">No follow-ups due.</div></li>}
            {dueFollowUps.slice(0, 3).map(f => (
              <li key={f.id}>
                <div>
                  <div className="name">{f.name}</div>
                  <div className="action">{f.reason}{f.status === 'Overdue' ? ' — overdue' : ''}</div>
                </div>
                <div className="when">{f.status === 'Overdue' ? 'Overdue' : f.due}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Recent call log</h2></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Lead</th><th>Time</th><th>Outcome</th><th>Duration</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {callLog.slice(0, 6).map(c => (
                <tr key={c.id}>
                  <td className="cust">{c.lead}</td>
                  <td>{c.time}</td>
                  <td><StatusChip status={c.outcome} /></td>
                  <td>{c.duration}</td>
                  <td>{c.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
