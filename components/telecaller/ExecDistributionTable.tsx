import React, { useState } from 'react';
import { ago } from '../../lib/format';
import type { WorkflowSummary } from '../../lib/leadWorkflow';

interface Props {
  summary: WorkflowSummary;
  /** Click an executive row to show their leads below. */
  onSelectExec?: (id: number) => void;
}

/** Executives per page; the Team total always stays pinned below, outside the paging. */
const PAGE_SIZE = 3;

/**
 * Executive-wise distribution and progress — assigned/called/report numbers per
 * calling executive, worked out from the shared tracker data (the same data the
 * executives and the manager see), plus a team total. The executive rows are
 * paged (PAGE_SIZE at a time); the Team total is always shown.
 */
export default function ExecDistributionTable({ summary, onSelectExec }: Props) {
  const execRows = summary.execs.filter(e => e.active || e.assigned > 0);
  const pageCount = Math.max(1, Math.ceil(execRows.length / PAGE_SIZE));
  const [page, setPage] = useState(0);
  const safePage = Math.min(page, pageCount - 1);
  const shown = execRows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  return (
    <div className="panel">
      <div className="table-wrap">
        <table>
          <caption style={{ textAlign: 'left', fontWeight: 600, padding: '10px 14px' }}>Executive-wise distribution and progress</caption>
          <thead>
            <tr>
              <th>Executive</th><th className="num-col">Assigned</th><th className="num-col">Not called</th><th>Progress</th>
              <th className="num-col">Calls</th><th className="num-col">Connected</th><th className="num-col">Not connected</th>
              <th className="num-col">Wrong no.</th><th className="num-col">Not interested</th>
              <th className="num-col">Reports sent</th><th className="num-col">To verify</th><th className="num-col">Verified</th><th className="num-col">Returned</th><th>Last call</th>
            </tr>
          </thead>
          <tbody>
            {shown.map(e => (
              <tr
                key={e.id}
                style={onSelectExec ? { cursor: 'pointer' } : undefined}
                onClick={onSelectExec ? () => onSelectExec(e.id) : undefined}
                title={onSelectExec ? "Show this executive's leads below" : undefined}
              >
                <td className="cust">{e.name}{!e.active && <div className="loc">Inactive</div>}</td>
                <td className="num-col strong">{e.assigned}</td>
                <td className="num-col">{e.notCalled > 0 ? <span className="text-warn">{e.notCalled}</span> : 0}</td>
                <td style={{ minWidth: 110 }}>
                  <div style={{ background: 'var(--line)', borderRadius: 4, height: 6 }}><div style={{ width: `${e.progressPct}%`, height: 6, borderRadius: 4, background: 'var(--leaf)' }} /></div>
                  <div className="loc">{e.progressPct}% called</div>
                </td>
                <td className="num-col">{e.calls}</td>
                <td className="num-col">{e.connected}</td>
                <td className="num-col">{e.notConnected}</td>
                <td className="num-col">{e.wrongNumber}</td>
                <td className="num-col">{e.notInterested}</td>
                <td className="num-col">{e.calls}</td>
                <td className="num-col">{e.awaiting > 0 ? <span className="text-warn">{e.awaiting}</span> : 0}</td>
                <td className="num-col">{e.verified}</td>
                <td className="num-col">{e.returned > 0 ? <span className="text-warn">{e.returned}</span> : 0}</td>
                <td>{e.lastCallAt ? <span className="loc">{ago(e.lastCallAt)}</span> : <span className="loc">No calls yet</span>}</td>
              </tr>
            ))}
            <tr>
              <td className="strong">Team</td>
              <td className="num-col strong">{summary.distributed}</td>
              <td className="num-col strong">{summary.notCalled}</td>
              <td />
              <td className="num-col strong">{summary.completedCalls}</td>
              <td className="num-col strong">{execRows.reduce((n, e) => n + e.connected, 0)}</td>
              <td className="num-col strong">{execRows.reduce((n, e) => n + e.notConnected, 0)}</td>
              <td className="num-col strong">{execRows.reduce((n, e) => n + e.wrongNumber, 0)}</td>
              <td className="num-col strong">{execRows.reduce((n, e) => n + e.notInterested, 0)}</td>
              <td className="num-col strong">{summary.reportsSubmitted}</td>
              <td className="num-col strong">{summary.awaitingVerification}</td>
              <td className="num-col strong">{summary.verified}</td>
              <td className="num-col strong">{summary.returned}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="pager">
          <span className="loc">{execRows.length} executives · showing {safePage * PAGE_SIZE + 1}–{Math.min(execRows.length, safePage * PAGE_SIZE + PAGE_SIZE)}</span>
          <div className="pager-btns exec-pages">
            <button className="btn-secondary btn-small" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} aria-label="Previous page">‹</button>
            {Array.from({ length: pageCount }, (_, i) => (
              <button
                key={i}
                className={`btn-small ${i === safePage ? 'btn-primary' : 'btn-secondary'}`}
                aria-current={i === safePage ? 'page' : undefined}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            ))}
            <button className="btn-secondary btn-small" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)} aria-label="Next page">›</button>
          </div>
        </div>
      )}
    </div>
  );
}
