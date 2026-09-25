import React, { useState } from 'react';
import { X } from 'lucide-react';
import { SALES_ORDERS, TELECALLERS } from '../../data/managerDashboard';
import {
  Complaint, ComplaintEvent, ComplaintStatus, PRIORITIES, Priority, RESOLUTION_TYPES, ResolutionType, SLA_HOURS, addHours,
} from '../../data/complaints';
import { ORDER_CHIP, ago, nowStamp, rupees, shortDate, shortDateTime } from '../../lib/format';
import { PRIORITY_LABEL, STATUS_CHIP, STATUS_LABEL, assigneeName, deadlineText, isActive } from './complaintsUtil';

const PRIORITY_CHIP: Record<Priority, string> = { urgent: 'pending', high: 'pending', medium: 'transit', low: 'muted' };

export function PriorityChip({ p }: { p: Priority }) {
  return <span className={`chip ${PRIORITY_CHIP[p]} ${p === 'urgent' ? 'chip-strong' : ''}`}>{PRIORITY_LABEL[p]}</span>;
}

interface Props {
  complaint: Complaint;
  allComplaints: Complaint[];
  headName: string;
  onClose: () => void;
  onAssign: () => void;
  /** Apply a change and add one line to the timeline. */
  onUpdate: (patch: Partial<Complaint>, event: Omit<ComplaintEvent, 'at' | 'by'>, toast: string) => void;
}

export default function ComplaintDrawer({ complaint: c, allComplaints, headName, onClose, onAssign, onUpdate }: Props) {
  const order = c.order_number ? SALES_ORDERS.find(o => o.order_number === c.order_number) : undefined;
  const seller = order?.caller_id ? TELECALLERS.find(t => t.id === order.caller_id) : undefined;
  const assignee = typeof c.assigned_to === 'number' ? TELECALLERS.find(t => t.id === c.assigned_to) : undefined;
  const earlier = allComplaints.filter(x => x.phone === c.phone && x.id !== c.id);
  const deadline = deadlineText(c);
  const active = isActive(c);

  const [note, setNote] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resType, setResType] = useState<ResolutionType>(c.category === 'Payment / refund' ? 'Refund' : c.category === 'Damaged / leaking' || c.category === 'Wrong item' ? 'Replacement' : 'Explanation');
  const [resNote, setResNote] = useState('');
  const [refund, setRefund] = useState(order ? String(order.total) : '');
  const [rating, setRating] = useState(0);
  const refundNum = Number(refund);
  const resolveProblem =
    !resNote.trim() ? 'Write what was done for the customer.'
    : resType === 'Refund' && (!refundNum || refundNum <= 0) ? 'Enter the refund amount.'
    : resType === 'Refund' && order && refundNum > order.total ? `Refund can't be more than the order total (${rupees(order.total)}).`
    : null;

  const setStatus = (status: ComplaintStatus, text: string, toast: string) => onUpdate({ status }, { kind: 'status', text }, toast);

  const resolve = () => {
    if (resolveProblem) return;
    onUpdate(
      {
        status: 'resolved',
        resolved_at: nowStamp(),
        resolution_type: resType,
        resolution_note: resNote.trim(),
        refund_amount: resType === 'Refund' ? refundNum : null,
        satisfaction: rating || null,
      },
      { kind: 'resolved', text: `Resolved: ${resType}${resType === 'Refund' ? ` ${rupees(refundNum)}` : ''}. ${resNote.trim()}` },
      `${c.ticket} resolved`,
    );
    setResolving(false);
  };

  const changePriority = (p: Priority) => {
    if (p === c.priority) return;
    onUpdate(
      { priority: p, due_at: addHours(c.created_at, SLA_HOURS[p]) },
      { kind: 'priority', text: `Priority ${PRIORITY_LABEL[c.priority]} → ${PRIORITY_LABEL[p]} (deadline now ${SLA_HOURS[p]}h from when it was raised)` },
      `${c.ticket} priority set to ${PRIORITY_LABEL[p]}`,
    );
  };

  const addNote = () => {
    if (!note.trim()) return;
    onUpdate({}, { kind: 'note', text: note.trim() }, 'Note added');
    setNote('');
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="order-drawer complaint-drawer" role="dialog" aria-label={c.ticket}>
        <div className="drawer-head">
          <div>
            <h3>{c.ticket}</h3>
            <div className="loc">
              <span className={`chip ${STATUS_CHIP[c.status]}`}>{STATUS_LABEL[c.status]}</span>{' '}
              <PriorityChip p={c.priority} />{' '}
              {c.reopened && <span className="chip pending">Reopened</span>}{' '}
              <span className={deadline.late ? 'text-warn' : undefined}>{deadline.text}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        <div className="drawer-body">
          {c.returned_note && c.assigned_to === null && (
            <div className="inline-alert" style={{ marginTop: 12 }}>Returned to you: {c.returned_note}</div>
          )}
          {assignee && !assignee.is_active && active && (
            <div className="inline-alert" style={{ marginTop: 12 }}>{assignee.name} is inactive. Reassign this complaint.</div>
          )}

          <section className="od-section">
            <div className="od-label">Assigned to</div>
            <div className="od-customer">
              <div>
                <strong>{assigneeName(c.assigned_to, headName)}</strong>
                {assignee && <div className="loc">{assignee.region}{c.assigned_at && <> · since {shortDateTime(c.assigned_at)}</>}</div>}
              </div>
              {active && (
                <button className="btn-primary btn-small" onClick={onAssign}>{c.assigned_to === null ? 'Assign' : 'Reassign'}</button>
              )}
            </div>
          </section>

          <section className="od-section">
            <div className="od-label">Customer</div>
            <div className="od-customer">
              <div>
                <strong>{c.customer_name}</strong>
                <div className="loc">{c.city} · via {c.channel}</div>
              </div>
              <a className="call-btn" href={`tel:${c.phone}`}>{c.phone}</a>
            </div>
            {earlier.length > 0 && (
              <div className="loc" style={{ marginTop: 8 }}>
                {earlier.length} other complaint{earlier.length > 1 ? 's' : ''} from this number: {earlier.map(e => e.ticket).join(', ')}
              </div>
            )}
          </section>

          <section className="od-section">
            <div className="od-label">Issue</div>
            <div><strong>{c.category}</strong>{c.product && <> · {c.product}</>}</div>
            <div style={{ marginTop: 4 }}>{c.description}</div>
            <div className="loc" style={{ marginTop: 4 }}>Raised {shortDateTime(c.created_at)} ({ago(c.created_at)})</div>
          </section>

          {order && (
            <section className="od-section">
              <div className="od-label">Order {order.order_number}</div>
              <div className="od-row">
                <div>
                  {order.items.map(i => <div key={i.product_name}>{i.product_name} × {i.quantity}</div>)}
                  <div className="loc">{shortDate(order.created_at)} · {order.payment_method.toUpperCase()} · {order.payment_status}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>{rupees(order.total)}</strong>
                  <div><span className={`chip ${ORDER_CHIP[order.status]}`}>{order.status}</span></div>
                  <div className="loc">{seller ? `Sold by ${seller.name}` : 'Website order'}</div>
                </div>
              </div>
            </section>
          )}

          <section className="od-section">
            <div className="od-label">Priority</div>
            <div className="filters">
              {PRIORITIES.map(p => (
                <button key={p} className={`filter-chip ${c.priority === p ? 'active' : ''}`} disabled={!active} onClick={() => changePriority(p)}>
                  {PRIORITY_LABEL[p]} · {SLA_HOURS[p]}h
                </button>
              ))}
            </div>
          </section>

          {c.resolution_type && !active && (
            <section className="od-section">
              <div className="od-label">Resolution</div>
              <div><strong>{c.resolution_type}</strong>{c.refund_amount ? <> · {rupees(c.refund_amount)}</> : null}</div>
              {c.resolution_note && <div style={{ marginTop: 4 }}>{c.resolution_note}</div>}
              <div className="loc" style={{ marginTop: 4 }}>
                {deadline.text}{deadline.late ? ' (after the deadline)' : ' (on time)'}
                {c.satisfaction ? <> · customer rating {'★'.repeat(c.satisfaction)}{'☆'.repeat(5 - c.satisfaction)}</> : ' · no rating'}
              </div>
            </section>
          )}

          {resolving && (
            <section className="od-section">
              <div className="od-label">Resolve</div>
              <div className="form-row">
                <div className="form-group">
                  <label>What was done</label>
                  <select className="filter-select" value={resType} onChange={e => setResType(e.target.value as ResolutionType)}>
                    {RESOLUTION_TYPES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                {resType === 'Refund' && (
                  <div className="form-group">
                    <label>Refund (₹)</label>
                    <input inputMode="numeric" value={refund} onChange={e => setRefund(e.target.value.replace(/[^\d]/g, ''))} />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Note for the record</label>
                <textarea className="od-notes" rows={2} value={resNote} onChange={e => setResNote(e.target.value)} placeholder="e.g. Replacement syrup sent with today's dispatch" />
              </div>
              <div className="form-group">
                <label>Customer rating (optional)</label>
                <div className="rating-pick">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" className={n <= rating ? 'on' : ''} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(rating === n ? 0 : n)}>★</button>
                  ))}
                </div>
              </div>
              {resolveProblem && <div className="loc">{resolveProblem}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn-primary btn-small" disabled={!!resolveProblem} onClick={resolve}>Mark resolved</button>
                <button className="btn-secondary btn-small" onClick={() => setResolving(false)}>Cancel</button>
              </div>
            </section>
          )}

          <section className="od-section">
            <div className="od-label">Add a note</div>
            <textarea className="od-notes" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Called customer, will send photo by evening" />
            <button className="btn-secondary btn-small" style={{ marginTop: 8 }} disabled={!note.trim()} onClick={addNote}>Add note</button>
          </section>

          <section className="od-section">
            <div className="od-label">Timeline</div>
            <ul className="cmp-timeline">
              {[...c.events].reverse().map((e, i) => (
                <li key={i} className={`ev-${e.kind}`}>
                  <div>{e.text}</div>
                  <div className="loc">{shortDateTime(e.at)} · {e.by}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="drawer-actions">
          {active && !resolving && <button className="btn-primary btn-small" onClick={() => setResolving(true)}>Resolve…</button>}
          {active && c.status !== 'waiting' && (
            <button className="btn-secondary btn-small" onClick={() => setStatus('waiting', 'Waiting on customer', `${c.ticket} waiting on customer`)}>Waiting on customer</button>
          )}
          {active && (c.status === 'waiting' || c.status === 'open') && (
            <button className="btn-secondary btn-small" onClick={() => setStatus('in_progress', 'Work started', `${c.ticket} in progress`)}>In progress</button>
          )}
          {active && c.status !== 'escalated' && (
            <button
              className="btn-secondary btn-small"
              onClick={() => onUpdate({ status: 'escalated' }, { kind: 'escalated', text: 'Escalated to manager' }, `${c.ticket} escalated to the manager`)}
            >
              Escalate to manager
            </button>
          )}
          {c.status === 'resolved' && (
            <button className="btn-primary btn-small" onClick={() => onUpdate({ status: 'closed' }, { kind: 'closed', text: 'Closed after checking with the customer' }, `${c.ticket} closed`)}>Close</button>
          )}
          {!active && (
            <button
              className="btn-secondary btn-small"
              onClick={() => onUpdate(
                { status: 'in_progress', reopened: true, resolved_at: null, due_at: addHours(nowStamp(), SLA_HOURS[c.priority]) },
                { kind: 'reopened', text: `Reopened; new deadline ${SLA_HOURS[c.priority]}h` },
                `${c.ticket} reopened`,
              )}
            >
              Reopen
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
