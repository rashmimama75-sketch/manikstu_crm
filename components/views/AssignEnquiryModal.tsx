import React, { useState } from 'react';
import { LeadActivity, TELECALLERS, TODAY, TrackerLead, VERTICALS, WebEnquiry } from '../../data/managerDashboard';
import { detectVertical } from '../../lib/leadImport';
import Modal from '../Modal';
import { isOpenLead } from '../telecaller/tcData';

interface Props {
  targets: WebEnquiry[];
  leads: TrackerLead[];
  activities: LeadActivity[];
  /** The lead an enquiry already became, if any. */
  leadFor: (e: WebEnquiry) => TrackerLead | undefined;
  /** 'auto' = each new lead's product line is read from its own message. */
  onAssign: (callerId: number, verticalId: number | 'auto') => void;
  onClose: () => void;
}

/** Pick a telecaller (and product line) for one or more website enquiries. */
export default function AssignEnquiryModal({ targets, leads, activities, leadFor, onAssign, onClose }: Props) {
  const withPhone = targets.filter(e => e.phone);
  const noPhone = targets.length - withPhone.length;
  const existing = withPhone.map(leadFor).filter((l): l is TrackerLead => !!l);
  const current = existing.length === withPhone.length && new Set(existing.map(l => l.assigned_to)).size === 1 ? existing[0].assigned_to : null;

  // Guess the product line from the message (single enquiry) or use the most common guess
  const guesses = withPhone.map(e => detectVertical(`${e.message} ${e.type}`)).filter((v): v is number => v !== null);
  const freshCount = withPhone.length - existing.length;
  // Several new leads: default to reading each one's product line from its own message
  const [verticalId, setVerticalId] = useState<number | 'auto'>(freshCount > 1 ? 'auto' : guesses[0] ?? existing[0]?.vertical_id ?? VERTICALS[0].id);

  const options = TELECALLERS.filter(t => t.is_active)
    .map(t => ({
      t,
      open: leads.filter(l => l.assigned_to === t.id && isOpenLead(l)).length,
      callsToday: activities.filter(a => a.caller_id === t.id && a.created_at.startsWith(TODAY)).length,
    }))
    .sort((a, b) => a.open - b.open || b.callsToday - a.callsToday);
  const suggested = options.find(o => o.callsToday > 0)?.t.id ?? options[0]?.t.id;
  const [callerId, setCallerId] = useState<number | null>(null);

  const title = targets.length === 1 ? `Assign ${targets[0].name} to a caller` : `Assign ${targets.length} enquiries to a caller`;
  const caller = options.find(o => o.t.id === callerId)?.t;

  return (
    <Modal isOpen onClose={onClose} title={title} closeOnBackdrop={false}>
      <div className="loc" style={{ marginBottom: 12 }}>
        The caller gets {withPhone.length === 1 ? 'this enquiry' : `these ${withPhone.length} enquiries`} as {withPhone.length === 1 ? 'a lead' : 'leads'} on their
        own dashboard straight away{existing.length ? `; ${existing.length} already ${existing.length === 1 ? 'is a lead and moves' : 'are leads and move'} to the new caller` : ''}.
      </div>
      {noPhone > 0 && (
        <div className="inline-alert">
          {noPhone} {noPhone === 1 ? 'enquiry has' : 'enquiries have'} no phone number and will be skipped. Reply by email and ask for a number first.
        </div>
      )}

      {withPhone.length > 0 && (
        <>
          <div className="form-group">
            <label>Product line</label>
            <div className="filters">
              {freshCount > 1 && (
                <button type="button" className={`filter-chip ${verticalId === 'auto' ? 'active' : ''}`} onClick={() => setVerticalId('auto')}>
                  Match each message
                </button>
              )}
              {VERTICALS.map(v => (
                <button key={v.id} type="button" className={`filter-chip ${verticalId === v.id ? 'active' : ''}`} onClick={() => setVerticalId(v.id)}>
                  {v.name}{freshCount === 1 && guesses[0] === v.id ? ' (suggested)' : ''}
                </button>
              ))}
            </div>
            <div className="loc" style={{ marginTop: 4 }}>
              {verticalId === 'auto' && 'Insurance, Goat Bank or health products, read from each message (health products if unclear). '}
              {existing.length > 0 && 'Enquiries that are already leads keep their product line.'}
            </div>
          </div>

          <div className="assign-list" role="radiogroup" aria-label="Assign to">
            {options.map(o => (
              <button
                key={o.t.id}
                type="button"
                role="radio"
                aria-checked={callerId === o.t.id}
                className={`assign-option ${callerId === o.t.id ? 'active' : ''}`}
                onClick={() => setCallerId(o.t.id)}
                disabled={o.t.id === current}
              >
                <div className="assign-main">
                  <span className="assign-name">{o.t.name}</span>
                  {o.t.id === suggested && o.t.id !== current && <span className="chip delivered">Suggested</span>}
                  {o.t.id === current && <span className="chip muted">Current</span>}
                </div>
                <div className="assign-hints">
                  <span>{o.t.region}</span>
                  <span>{o.open} open leads</span>
                  <span className={o.callsToday === 0 ? 'text-warn' : undefined}>{o.callsToday === 0 ? 'no calls today' : `${o.callsToday} calls today`}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="modal-footer">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary" disabled={!caller || withPhone.length === 0} onClick={() => caller && onAssign(caller.id, verticalId)}>
          {caller ? `Assign to ${caller.name}` : 'Choose a caller'}
        </button>
      </div>
    </Modal>
  );
}
