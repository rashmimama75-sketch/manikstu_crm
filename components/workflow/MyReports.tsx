import React, { useMemo, useState } from 'react';
import { CUSTOMER_RESPONSES, CustomerResponse, LeadActivity, ReportStatus, TrackerLead } from '../../data/managerDashboard';
import { REPORT_CHIP, REPORT_LABEL, reportStatusOf } from '../../lib/leadWorkflow';
import { shortDate, shortDateTime } from '../../lib/format';
import { StatusChip } from '../telecaller/shared';
import Modal from '../Modal';

// The calling executive's own call reports: what they submitted, what the telecalling head has verified, and
// any report sent back to be corrected (those come first, with the head's reason).

interface Props {
  leads: TrackerLead[];
  activities: LeadActivity[];
  searchQuery?: string;
  onResubmit: (activityId: number, note: string, response: CustomerResponse | null) => Promise<void>;
}

export default function MyReports({ leads, activities, searchQuery = '', onResubmit }: Props) {
  const [status, setStatus] = useState<ReportStatus | 'all'>('all');
  const [editing, setEditing] = useState<LeadActivity | null>(null);
  const [note, setNote] = useState('');
  const [response, setResponse] = useState<CustomerResponse | ''>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const leadOf = useMemo(() => new Map(leads.map(l => [l.id, l])), [leads]);
  const counts = { submitted: 0, verified: 0, returned: 0 } as Record<ReportStatus, number>;
  activities.forEach(a => { counts[reportStatusOf(a)]++; });

  const q = searchQuery.trim().toLowerCase();
  const rows = activities
    .filter(a => status === 'all' || reportStatusOf(a) === status)
    .filter(a => !q || [leadOf.get(a.lead_id)?.customer_name ?? '', leadOf.get(a.lead_id)?.phone ?? '', a.note].some(v => v.toLowerCase().includes(q)))
    .sort((a, b) => Number(reportStatusOf(b) === 'returned') - Number(reportStatusOf(a) === 'returned') || b.created_at.localeCompare(a.created_at));

  const open = (a: LeadActivity) => {
    setEditing(a);
    setNote(a.note);
    setResponse(a.customer_response ?? '');
    setError(null);
  };

  const submit = async () => {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      await onResubmit(editing.id, note.trim(), response || null);
      setEditing(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {counts.returned > 0 && (
        <div className="inline-alert" role="alert" style={{ marginBottom: 12 }}>
          {counts.returned} of your call reports {counts.returned === 1 ? 'was' : 'were'} sent back. Correct and submit {counts.returned === 1 ? 'it' : 'them'} again.
        </div>
      )}
      <div className="scoreboard">
        <div className="score"><div className="num">{activities.length}</div><div className="label">Reports submitted</div></div>
        <div className="score"><div className="num">{counts.submitted}</div><div className="label">Waiting for the head</div></div>
        <div className="score"><div className="num">{counts.verified}</div><div className="label">Verified</div></div>
        <div className="score"><div className="num">{counts.returned}</div><div className="label">Sent back to you</div></div>
      </div>

      <div className="filter-row one-line">
        <select className="filter-select" value={status} onChange={e => setStatus(e.target.value as ReportStatus | 'all')} aria-label="Report status">
          <option value="all">All my reports ({activities.length})</option>
          <option value="returned">Sent back ({counts.returned})</option>
          <option value="submitted">Waiting for the head ({counts.submitted})</option>
          <option value="verified">Verified ({counts.verified})</option>
        </select>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Customer</th><th>Call status</th><th>Customer response</th><th>Remarks</th><th>Follow-up</th><th>Submitted</th><th>Report</th><th /></tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '24px 0' }}>
                  {activities.length === 0 ? 'No reports yet. A report is submitted with every call you save.' : 'No reports match.'}
                </td></tr>
              )}
              {rows.map(a => {
                const lead = leadOf.get(a.lead_id);
                const rs = reportStatusOf(a);
                return (
                  <tr key={a.id} className={rs === 'returned' ? 'fu-row-overdue' : undefined}>
                    <td className="cust">{lead?.customer_name ?? '—'}<div className="loc">{lead?.phone}</div></td>
                    <td><StatusChip status={a.outcome} /></td>
                    <td>{a.customer_response ?? <span className="loc">—</span>}</td>
                    <td style={{ maxWidth: 220 }}>{a.note}</td>
                    <td>{a.followup_date ? <>{shortDate(a.followup_date)}<div className="loc">{a.followup_note}</div></> : <span className="loc">None</span>}</td>
                    <td>{shortDateTime(a.created_at)}</td>
                    <td>
                      <span className={`chip ${REPORT_CHIP[rs]}`}>{REPORT_LABEL[rs]}</span>
                      {rs !== 'submitted' && a.verified_by && <div className="loc">by {a.verified_by}</div>}
                      {rs === 'returned' && a.verify_note && <div className="loc text-warn">“{a.verify_note}”</div>}
                    </td>
                    <td>{rs !== 'verified' && <button className={rs === 'returned' ? 'btn-primary btn-small' : 'btn-secondary btn-small'} onClick={() => open(a)}>{rs === 'returned' ? 'Correct & resubmit' : 'Edit'}</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={editing !== null} onClose={() => setEditing(null)} title={editing ? `Call report: ${leadOf.get(editing.lead_id)?.customer_name ?? ''}` : ''} closeOnBackdrop={false}>
        {editing && (
          <>
            {editing.verify_note && <div className="inline-alert" style={{ marginBottom: 10 }}>The head asked: “{editing.verify_note}”</div>}
            <div className="form-group">
              <label htmlFor="mr-response">Customer response{editing.outcome === 'Connected' ? ' (required)' : ''}</label>
              <select id="mr-response" value={response} onChange={e => setResponse(e.target.value as CustomerResponse | '')}>
                <option value="">Choose…</option>
                {CUSTOMER_RESPONSES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="mr-note">Remarks</label>
              <textarea id="mr-note" rows={3} value={note} onChange={e => setNote(e.target.value)} />
            </div>
            {error && <div className="inline-alert" role="alert">{error}</div>}
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-primary" disabled={busy} onClick={submit}>{busy ? 'Submitting…' : 'Submit report'}</button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
