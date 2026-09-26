import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { Followup, TrackerLead } from '../../data/managerDashboard';
import { ago } from '../../lib/format';
import Modal from '../Modal';
import { stageName, verticalName } from '../telecaller/tcData';

export interface CallTarget {
  lead: TrackerLead;
  followup?: Followup;
}

interface Props {
  target: CallTarget;
  onClose: () => void;
}

const clock = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

/** Opens the phone dialer for a number (tel: link), without leaving the page. */
export function dial(phone: string) {
  const a = document.createElement('a');
  a.href = `tel:+91${phone}`;
  a.click();
}

/** Calling window for the Call desk page: the call starts as soon as it opens (dialer + timer). */
export default function CallModal({ target, onClose }: Props) {
  const { lead, followup } = target;

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
    if (live && !window.confirm('The call is still running. End it and close?')) return;
    onClose();
  };

  return (
    <Modal isOpen onClose={close} title={`Calling ${lead.customer_name}`} closeOnBackdrop={false}>
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
        <span className="ce-call-status">{live ? 'Call in progress · dialled on your phone app' : 'Call ended'}</span>
        {live ? (
          <button className="btn-secondary" onClick={() => setEndedAt(Date.now())}><PhoneOff size={15} /> End call</button>
        ) : (
          <button className="call-btn ce-dial" onClick={redial}><Phone size={15} /> Call again</button>
        )}
      </div>
    </Modal>
  );
}
