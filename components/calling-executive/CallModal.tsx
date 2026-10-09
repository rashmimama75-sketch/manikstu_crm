import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { CUSTOMER_RESPONSES, CallOutcome, CustomerResponse, Followup, LeadActivity, Telecaller, TrackerLead } from '../../data/managerDashboard';
import { ago, shortDateTime } from '../../lib/format';
import Modal from '../Modal';
import { StatusChip } from '../telecaller/shared';
import { OUTCOMES, stageName, stagesFor, verticalName } from '../telecaller/tcData';
import type { CallForm } from './CallDeskView';
import { OUTCOME_COLORS } from './queue';
import { fillScript, scriptFor } from './scripts';

export interface CallTarget {
  lead: TrackerLead;
  followup?: Followup;
}

interface Props {
  target: CallTarget;
  me: Telecaller;
  history: LeadActivity[];
  initialForm: CallForm;
  onSave: (outcome: CallOutcome, form: CallForm, durationSec: number | null) => void;
  onClose: () => void;
}

const clock = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

/** Opens the phone dialer for a number (tel: link), without leaving the page. */
export function dial(phone: string) {
  const a = document.createElement('a');
  a.href = `tel:+91${phone}`;
  a.click();
}

/**
 * Calling window for the Call desk page: the call starts as soon as it opens
 * (dialer + timer), and the outcome is logged here without leaving the page.
 */
export default function CallModal({ target, me, history, initialForm, onSave, onClose }: Props) {
  const { lead, followup } = target;
  const script = scriptFor(lead.vertical_id);
  const [form, setForm] = useState<CallForm>(initialForm);
  const patch = (p: Partial<CallForm>) => setForm(f => ({ ...f, ...p }));
  const [formError, setFormError] = useState<string | null>(null);

  /** Saving the call submits the call report, so the customer's response must be filled in when they were reached. */
  const save = (o: CallOutcome) => {
    let response = form.customerResponse;
    if (!response && o === 'Not interested') response = 'Not interested';
    if (!response && o === 'Connected') {
      setFormError('Pick the customer’s response to submit the call report.');
      return;
    }
    setFormError(null);
    onSave(o, { ...form, customerResponse: response }, o === 'Connected' ? elapsedSec : null);
  };

  // The call is already started by the click that opened this window.
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const live = endedAt === null;
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [live]);
  const elapsedSec = Math.max(0, Math.floor(((endedAt ?? now) - startedAt) / 1000));

  const redial = () => {
    dial(lead.phone);
    setStartedAt(Date.now());
    setNow(Date.now());
    setEndedAt(null);
  };

  const close = () => {
    if (live && !window.confirm('The call is still running. Close without saving it?')) return;
    onClose();
  };

  return (
    <Modal isOpen onClose={close} title={`Calling ${lead.customer_name}`} wide closeOnBackdrop={false}>
      <div className="ce-modal-lead">
        {followup && <span className="chip transit">Callback</span>}
        <div className="ce-modal-phone">+91 {lead.phone}</div>
        <div className="ce-modal-meta">
          {verticalName(lead.vertical_id)} · {stageName(lead.stage_id)} · Source: {lead.source} · Added {ago(lead.created_at)}
        </div>
        {followup && <div className="ce-reason">Callback reason: {followup.note}</div>}
      </div>

      <div className={`ce-callbar ${live ? 'live' : ''}`}>
        <div className={`ce-timer ${live ? 'live' : ''}`}>
          {live && <span className="ce-live-dot" />}{clock(elapsedSec)}
        </div>
        <span className="ce-call-status">{live ? 'Call in progress · dialled on your phone app' : 'Call ended · pick an outcome below'}</span>
        {live ? (
          <button className="btn-secondary" onClick={() => setEndedAt(Date.now())}><PhoneOff size={15} /> End call</button>
        ) : (
          <button className="call-btn ce-dial" onClick={redial}><Phone size={15} /> Call again</button>
        )}
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
          {history.length === 0 ? (
            <div className="loc">First call to this customer.</div>
          ) : (
            <ul className="ce-history-list">
              {history.slice(0, 4).map(a => (
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
            <label htmlFor="cm-stage">Stage after this call</label>
            <select id="cm-stage" value={form.stageId} onChange={e => patch({ stageId: Number(e.target.value) })}>
              {stagesFor(lead.vertical_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="cm-response">Customer response <span className="loc">(call report · required if connected)</span></label>
            <select id="cm-response" value={form.customerResponse} onChange={e => { patch({ customerResponse: e.target.value as CustomerResponse | '' }); setFormError(null); }}>
              <option value="">Choose what the customer said…</option>
              {CUSTOMER_RESPONSES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="cm-note">Remarks</label>
          <input id="cm-note" type="text" placeholder="What was discussed, next step…" value={form.note} onChange={e => patch({ note: e.target.value })} />
        </div>

        <label className="check-filter" style={{ marginBottom: 10, display: 'flex' }}>
          <input type="checkbox" checked={form.scheduleNext} onChange={e => patch({ scheduleNext: e.target.checked })} />
          Follow-up needed: schedule a callback
        </label>
        {form.scheduleNext && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cm-next-date">Date</label>
              <input id="cm-next-date" type="date" value={form.nextDate} onChange={e => patch({ nextDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="cm-next-note">Reason</label>
              <input id="cm-next-note" type="text" placeholder="e.g. Confirm quantity" value={form.nextNote} onChange={e => patch({ nextNote: e.target.value })} />
            </div>
          </div>
        )}

        {formError && <div className="inline-alert" role="alert" style={{ marginBottom: 10 }}>{formError}</div>}
        <div className="ce-label">Call status · saves the call and submits the report</div>
        <div className="ce-outcomes">
          {OUTCOMES.map(o => (
            <button
              key={o}
              className="ce-outcome"
              style={{ borderColor: OUTCOME_COLORS[o] }}
              onClick={() => save(o)}
            >
              <span className="dot3" style={{ background: OUTCOME_COLORS[o] }} />
              {o}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
