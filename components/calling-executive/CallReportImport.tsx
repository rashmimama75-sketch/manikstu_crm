import React, { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { TrackerLead } from '../../data/managerDashboard';
import { readFileRows } from '../../lib/leadImport';
import { REPORT_STATUS_LABEL, ReportRow, downloadReportTemplate, parseCallReport, toCalls } from '../../lib/callReport';
import type { CallInput } from '../../lib/trackerOps';
import { shortDate, shortDateTime } from '../../lib/format';
import { fmtDuration, isOpenLead, stageName, verticalName } from '../telecaller/tcData';

interface Props {
  leads: TrackerLead[];
  /** Save the calls; resolves when the server has them. */
  onImport: (calls: CallInput[]) => Promise<void>;
  onToast: (message: string) => void;
}

const CHIP: Record<string, string> = { Connected: 'delivered', 'No answer': 'transit', Busy: 'pending', 'Wrong number': 'muted' };

/** Import a calling report (Excel / CSV / PDF): each row becomes a call on one of your leads. */
export default function CallReportImport({ leads, onImport, onToast }: Props) {
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const read = async (file: File) => {
    setError(null);
    setBusy(true);
    setFileName(file.name);
    try {
      const parsed = parseCallReport(await readFileRows(file), leads);
      if (parsed.length === 0) throw new Error('The file has a header row but no calls under it.');
      setRows(parsed);
    } catch (e) {
      setRows(null);
      setError((e as Error).message || 'Could not read that file.');
    } finally {
      setBusy(false);
    }
  };

  const ready = rows?.filter(r => r.status === 'ready') ?? [];
  const skipped = (rows?.length ?? 0) - ready.length;

  const save = async () => {
    setSaving(true);
    try {
      await onImport(toCalls(ready));
      setRows(null);
      setFileName(null);
    } catch {
      // the dashboard shows the error; keep the preview so nothing is lost
    } finally {
      setSaving(false);
    }
  };

  const template = async () => {
    try {
      await downloadReportTemplate(leads.filter(isOpenLead), stageName, verticalName);
    } catch {
      onToast('⚠️ Could not create the template. Please try again.');
    }
  };

  return (
    <div className="panel import-leads">
      {!rows && (
        <>
          <div
            className={`drop-zone ${dragging ? 'dragging' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => input.current?.click()}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') input.current?.click(); }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) read(f); }}
          >
            <Upload size={26} />
            <div className="drop-title">{busy ? `Reading ${fileName}…` : 'Drop your calling report here'}</div>
            <div className="loc">Excel (.xlsx), CSV or PDF · or click to choose a file</div>
            <input ref={input} type="file" accept=".xlsx,.csv,.pdf" hidden onChange={e => { const f = e.target.files?.[0]; if (f) read(f); e.target.value = ''; }} />
          </div>
          {error && <div className="inline-alert" style={{ marginTop: 12 }}>{error}</div>}
          <div className="import-help">
            <div>
              <strong>How it works:</strong> each row is one call. Rows are matched to <em>your</em> leads by phone number.
              Columns: <strong>Phone</strong> and <strong>Outcome</strong> (Connected / No answer / Busy / Wrong number) are needed;
              <strong> New status</strong>, <strong>Call date &amp; time</strong>, <strong>Duration</strong>, <strong>Note</strong> and
              <strong> Next follow-up date</strong> are optional. After import, the telecalling head and the manager see the calls straight away.
            </div>
            <button className="btn-secondary btn-small" onClick={template}><Download size={14} /> Template with my {leads.filter(isOpenLead).length} open leads</button>
          </div>
        </>
      )}

      {rows && (
        <>
          <div className="import-summary">
            <span className="loc">{fileName}</span>
            <span className="chip delivered">{ready.length} ready</span>
            {skipped > 0 && <span className="chip pending">{skipped} skipped</span>}
            <button className="link-btn clear-alert" onClick={() => { setRows(null); setFileName(null); }}>Choose another file</button>
          </div>
          <div className="table-wrap import-table">
            <table>
              <thead>
                <tr><th>Row</th><th>Lead</th><th>Outcome</th><th>Status after call</th><th>When</th><th>Talk time</th><th>Note</th><th>Next follow-up</th><th></th></tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.line} className={r.status === 'ready' ? undefined : 'row-skipped'}>
                    <td className="loc">{r.line}</td>
                    <td className="cust">{r.lead?.customer_name ?? (r.name || '—')}<div className="loc">{r.phone ?? '—'}</div></td>
                    <td>{r.outcome ? <span className={`chip ${CHIP[r.outcome]}`}>{r.outcome}</span> : <span className="text-warn">{r.outcomeText || '—'}</span>}</td>
                    <td>
                      {r.lead ? (r.stageId ? stageName(r.stageId) : <span className="loc">{stageName(r.lead.stage_id)} (no change)</span>) : '—'}
                      {r.status === 'bad-status' && <div className="text-warn">“{r.statusText}”</div>}
                    </td>
                    <td className="loc">{r.calledAt ? shortDateTime(r.calledAt) : 'now'}</td>
                    <td>{r.outcome === 'Connected' ? fmtDuration(r.durationSec) : '—'}</td>
                    <td>{r.note || <span className="loc">—</span>}</td>
                    <td>{r.nextDate ? shortDate(r.nextDate) : <span className="loc">—</span>}</td>
                    <td><span className={`chip ${r.status === 'ready' ? 'delivered' : 'pending'}`}>{REPORT_STATUS_LABEL[r.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="loc" style={{ marginTop: 8 }}>
            Skipped rows are not imported. Dates after today are saved as now.
          </div>
          <div className="modal-footer" style={{ marginTop: 16 }}>
            <button type="button" className="btn-secondary" onClick={() => { setRows(null); setFileName(null); }}>Cancel</button>
            <button type="button" className="btn-primary" disabled={ready.length === 0 || saving} onClick={save}>
              {saving ? 'Importing…' : `Import ${ready.length} call${ready.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
