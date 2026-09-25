import React, { useState } from 'react';
import { Complaint, Assignee } from '../../data/complaints';
import Modal from '../Modal';
import { OVERLOAD_AT, assignOptions, assigneeName } from './complaintsUtil';

interface Props {
  /** The complaints being assigned (one, or several for bulk assign). */
  targets: Complaint[];
  allComplaints: Complaint[];
  headName: string;
  onAssign: (to: Assignee, note: string) => void;
  onClose: () => void;
}

export default function AssignPicker({ targets, allComplaints, headName, onAssign, onClose }: Props) {
  const single = targets.length === 1 ? targets[0] : null;
  const options = assignOptions(single, allComplaints);
  const current = single?.assigned_to ?? null;
  const [choice, setChoice] = useState<Assignee>(null);
  const [note, setNote] = useState('');

  const picked = typeof choice === 'number' ? options.find(o => o.t.id === choice) : undefined;
  const overloaded = picked && picked.open + targets.length > OVERLOAD_AT;

  const confirm = () => {
    if (choice === null) return;
    if (overloaded && !window.confirm(`${picked!.t.name} would have ${picked!.open + targets.length} open complaints. Assign anyway?`)) return;
    onAssign(choice, note.trim());
  };

  const title = single ? `Assign ${single.ticket}` : `Assign ${targets.length} complaints`;

  return (
    <Modal isOpen onClose={onClose} title={title} closeOnBackdrop={false}>
      {single && (
        <div className="loc" style={{ marginBottom: 12 }}>
          {single.customer_name} · {single.city} · {single.category}
          {single.order_number && <> · order {single.order_number}</>}
          <br />Now with: <strong>{assigneeName(current, headName)}</strong>. The deadline doesn&apos;t change when you reassign.
        </div>
      )}

      <div className="assign-list" role="radiogroup" aria-label="Assign to">
        {options.map((o, i) => (
          <button
            key={o.t.id}
            type="button"
            role="radio"
            aria-checked={choice === o.t.id}
            className={`assign-option ${choice === o.t.id ? 'active' : ''} ${o.t.id === current ? 'current' : ''}`}
            onClick={() => setChoice(o.t.id)}
            disabled={o.t.id === current}
          >
            <div className="assign-main">
              <span className="assign-name">{o.t.name}</span>
              {single && i === 0 && o.score > 0 && <span className="chip delivered">Suggested</span>}
              {o.t.id === current && <span className="chip muted">Current</span>}
            </div>
            <div className="assign-hints">
              <span className={o.open >= OVERLOAD_AT ? 'text-warn' : undefined}>{o.open} open</span>
              {o.soldOrder && <span>⭐ sold this order</span>}
              {o.sameRegion && <span>📍 {o.t.region}</span>}
              {!o.sameRegion && <span>{o.t.region}</span>}
              <span className={o.callsToday === 0 ? 'text-warn' : undefined}>{o.callsToday === 0 ? 'no calls today' : `${o.callsToday} calls today`}</span>
            </div>
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={choice === 'head'}
          className={`assign-option ${choice === 'head' ? 'active' : ''}`}
          onClick={() => setChoice('head')}
          disabled={current === 'head'}
        >
          <div className="assign-main"><span className="assign-name">Assign to me</span>{current === 'head' && <span className="chip muted">Current</span>}</div>
          <div className="assign-hints"><span>Handle it yourself as telecalling head</span></div>
        </button>
      </div>

      <div className="form-group" style={{ marginTop: 14 }}>
        <label>Reason (optional)</label>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Bikash sold this order and knows the customer" />
      </div>
      {overloaded && (
        <div className="inline-alert">{picked!.t.name} already has {picked!.open} open complaints. You&apos;ll be asked to confirm.</div>
      )}

      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary" disabled={choice === null} onClick={confirm}>
          {choice === null ? 'Choose someone' : `Assign to ${assigneeName(choice, headName)}`}
        </button>
      </div>
    </Modal>
  );
}
