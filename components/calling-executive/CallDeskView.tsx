import React from 'react';
import { Phone, PhoneOff, SkipForward } from 'lucide-react';
import { CALL_TARGET_DAILY, CallOutcome, LeadActivity, Telecaller } from '../../data/managerDashboard';
import { ago, pct, shortDateTime } from '../../lib/format';
import { StatusChip } from '../telecaller/shared';
import { OUTCOMES, OUTCOME_COLORS, QUEUE_CHIP, QueueItem, fmtDuration, stageName, stagesFor, verticalName } from '../telecaller/tcData';
import { fillScript, scriptFor } from './scripts';

export interface CallForm {
  note: string;
  stageId: number;
  scheduleNext: boolean;
  nextDate: string;
  nextNote: string;
}

interface Props {
  me: Telecaller;
  queue: QueueItem[];
  current: QueueItem | undefined;
  todayCalls: LeadActivity[];
  leadHistory: LeadActivity[];
  handledCount: number;
  callLive: boolean;
  callTimed: boolean;
  elapsedSec: number;
  form: CallForm;
  onFormChange: (patch: Partial<CallForm>) => void;
  onSelect: (leadId: number) => void;
  onStartCall: () => void;
  onEndCall: () => void;
  onSave: (outcome: CallOutcome) => void;
  onSkip: () => void;
}

const clock = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

export default function CallDeskView({
  me,
  queue,
  current,
  todayCalls,
  leadHistory,
  handledCount,
  callLive,
  callTimed,
  elapsedSec,
  form,
  onFormChange,
  onSelect,
  onStartCall,
  onEndCall,
  onSave,
  onSkip,
}: Props) {
  const connected = todayCalls.filter(a => a.outcome === 'Connected').length;
  const talkSec = todayCalls.reduce((sum, a) => sum + (a.duration_sec ?? 0), 0);
  const remaining = Math.max(0, CALL_TARGET_DAILY - todayCalls.length);
  const lead = current?.lead;
  const script = lead ? scriptFor(lead.vertical_id) : null;
  const onCall = callLive;

  return (
    <>
      <div className="scoreboard">
        <div className="score">
          <div className="num">{todayCalls.length}<small>/ {CALL_TARGET_DAILY}</small></div>
          <div className="label">Calls today · {remaining > 0 ? `${remaining} to go` : 'target reached'}</div>
        </div>
        <div className="score"><div className="num">{connected}</div><div className="label">Connected</div></div>
        <div className="score"><div className="num">{pct(connected, todayCalls.length)}%</div><div className="label">Connect rate</div></div>
        <div className="score"><div className="num">{fmtDuration(talkSec)}</div><div className="label">Talk time today</div></div>
        <div className="score"><div className="num">{handledCount}</div><div className="label">Done this session</div></div>
      </div>

      <div className="ce-desk">
        {/* Queue */}
        <div className="panel ce-queue">
          <div className="panel-head">
            <h2>Call queue</h2>
            <span className="panel-meta">{queue.length} to call</span>
          </div>
          {queue.length === 0 ? (
            <div className="loc">Queue is empty. Every lead due today has been called.</div>
          ) : (
            <ul className="ce-queue-list">
              {queue.map((item, i) => (
                <li key={item.lead.id}>
                  <button
                    className={`ce-queue-item ${current?.lead.id === item.lead.id ? 'active' : ''}`}
                    onClick={() => onSelect(item.lead.id)}
                    disabled={onCall}
                  >
                    <span className="ce-queue-pos">{i + 1}</span>
                    <span className="ce-queue-main">
                      <span className="name">{item.lead.customer_name}</span>
                      <span className="loc">{verticalName(item.lead.vertical_id)} · {stageName(item.lead.stage_id)}</span>
                    </span>
                    <span className={`chip ${QUEUE_CHIP[item.reason]}`}>{item.reason}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Active call */}
        <div className="panel ce-call">
          {!lead || !current || !script ? (
            <div className="ce-empty">
              <h2>All caught up</h2>
              <p className="loc">No one left in your queue. New leads and callbacks will appear here.</p>
            </div>
          ) : (
            <>
              <div className="ce-call-head">
                <div>
                  <span className={`chip ${QUEUE_CHIP[current.reason]}`}>{current.reason}</span>
                  <h2 className="ce-name">{lead.customer_name}</h2>
                  <div className="loc">
                    {verticalName(lead.vertical_id)} · {stageName(lead.stage_id)} · Source: {lead.source} · Added {ago(lead.created_at)}
                  </div>
                  {current.followup && <div className="ce-reason">Callback reason: {current.followup.note}</div>}
                </div>
                <div className="ce-call-actions">
                  <div className={`ce-timer ${onCall ? 'live' : ''}`}>
                    {onCall && <span className="ce-live-dot" />}{callTimed ? clock(elapsedSec) : '00:00'}
                  </div>
                  {onCall ? (
                    <button className="btn-secondary" onClick={onEndCall}><PhoneOff size={15} /> End call</button>
                  ) : (
                    <a className="call-btn ce-dial" href={`tel:+91${lead.phone}`} onClick={onStartCall}>
                      <Phone size={15} /> Call {lead.phone}
                    </a>
                  )}
                </div>
              </div>

              <div className="ce-body">
                <div className="ce-script">
                  <div className="ce-label">Script</div>
                  <p className="ce-opening">“{fillScript(script.opening, lead.customer_name, me.name)}”</p>
                  <ul>
                    {script.points.map(p => <li key={p}>{p}</li>)}
                  </ul>
                  <p className="loc">Close: “{fillScript(script.close, lead.customer_name, me.name)}”</p>
                </div>

                <div className="ce-history">
                  <div className="ce-label">Previous calls</div>
                  {leadHistory.length === 0 ? (
                    <div className="loc">First call to this customer.</div>
                  ) : (
                    <ul className="ce-history-list">
                      {leadHistory.slice(0, 4).map(a => (
                        <li key={a.id}>
                          <StatusChip status={a.outcome} />
                          <span>{a.note}</span>
                          <span className="loc">{shortDateTime(a.created_at)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="ce-log">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="ce-stage">Stage after this call</label>
                    <select id="ce-stage" value={form.stageId} onChange={e => onFormChange({ stageId: Number(e.target.value) })}>
                      {stagesFor(lead.vertical_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="ce-note">Note</label>
                    <input
                      id="ce-note"
                      type="text"
                      placeholder="What was discussed, next step…"
                      value={form.note}
                      onChange={e => onFormChange({ note: e.target.value })}
                    />
                  </div>
                </div>

                <label className="check-filter" style={{ marginBottom: 10, display: 'flex' }}>
                  <input type="checkbox" checked={form.scheduleNext} onChange={e => onFormChange({ scheduleNext: e.target.checked })} />
                  Schedule a callback
                </label>
                {form.scheduleNext && (
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="ce-next-date">Date</label>
                      <input id="ce-next-date" type="date" value={form.nextDate} onChange={e => onFormChange({ nextDate: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="ce-next-note">Reason</label>
                      <input id="ce-next-note" type="text" placeholder="e.g. Confirm quantity" value={form.nextNote} onChange={e => onFormChange({ nextNote: e.target.value })} />
                    </div>
                  </div>
                )}

                <div className="ce-label">Outcome · saves and opens the next call</div>
                <div className="ce-outcomes">
                  {OUTCOMES.map(o => (
                    <button key={o} className="ce-outcome" style={{ borderColor: OUTCOME_COLORS[o] }} onClick={() => onSave(o)}>
                      <span className="dot3" style={{ background: OUTCOME_COLORS[o] }} />
                      {o}
                    </button>
                  ))}
                  <button className="btn-secondary ce-skip" onClick={onSkip} disabled={onCall}>
                    <SkipForward size={14} /> Skip
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
