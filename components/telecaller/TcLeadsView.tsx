import React, { useState } from 'react';
import { LEAD_SOURCES, TODAY, VERTICALS, isWonStage } from '../../data/managerDashboard';
import { MONTH, ago, shortDateTime } from '../../lib/format';
import { CallButton, EmptyRow, StatusChip } from './shared';
import { TcSharedProps, isOpenLead, lastCallFor, stageName, stageOf, stagesFor, verticalName } from './tcData';

const PAGE_SIZE = 15;
type Show = 'open' | 'never-called' | 'won' | 'lost' | 'all';

export default function TcLeadsView({ leads, followups, activities, sales, onCall, onSale, searchQuery }: TcSharedProps & { searchQuery: string }) {
  const [show, setShow] = useState<Show>('open');
  const [verticalId, setVerticalId] = useState<number | 'all'>('all');
  const [stageId, setStageId] = useState<number | 'all'>('all');
  const [source, setSource] = useState<string>('all');
  const [page, setPage] = useState(0);

  const calledIds = new Set(activities.map(a => a.lead_id));
  const won = (stageId: number) => isWonStage(stageOf(stageId));
  const counts = {
    open: leads.filter(isOpenLead).length,
    'never-called': leads.filter(l => isOpenLead(l) && !calledIds.has(l.id)).length,
    won: leads.filter(l => won(l.stage_id)).length,
    lost: leads.filter(l => stageOf(l.stage_id)?.name === 'Lost').length,
    all: leads.length,
  };
  const soldThisMonth = new Set(sales.filter(s => s.sold_at.startsWith(MONTH)).map(s => s.lead_id)).size;

  const q = searchQuery.trim().toLowerCase();
  const filtered = leads
    .filter(l => {
      if (show === 'open' && !isOpenLead(l)) return false;
      if (show === 'never-called' && (!isOpenLead(l) || calledIds.has(l.id))) return false;
      if (show === 'won' && !won(l.stage_id)) return false;
      if (show === 'lost' && stageOf(l.stage_id)?.name !== 'Lost') return false;
      if (verticalId !== 'all' && l.vertical_id !== verticalId) return false;
      if (stageId !== 'all' && l.stage_id !== stageId) return false;
      if (source !== 'all' && l.source !== source) return false;
      if (q && ![l.customer_name, l.phone].some(v => v.toLowerCase().includes(q))) return false;
      return true;
    })
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at)); // least recently touched first

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const nextFollowup = (leadId: number) =>
    followups.filter(f => f.lead_id === leadId && f.status === 'pending').sort((a, b) => a.due_at.localeCompare(b.due_at))[0];

  const TABS: { key: Show; label: string }[] = [
    { key: 'open', label: 'Open' },
    { key: 'never-called', label: 'Never called' },
    { key: 'won', label: 'Won' },
    { key: 'lost', label: 'Lost' },
    { key: 'all', label: 'All' },
  ];

  return (
    <>
      <div className="scoreboard">
        <div className="score"><div className="num">{counts.open}</div><div className="label">Open leads</div></div>
        <div className="score"><div className="num">{counts['never-called']}</div><div className="label">Never called</div></div>
        <div className="score"><div className="num">{leads.filter(l => l.created_at.startsWith(TODAY)).length}</div><div className="label">Assigned today</div></div>
        <div className="score"><div className="num">{soldThisMonth}</div><div className="label">Leads sold · this month</div></div>
        <div className="score"><div className="num">{counts.won}</div><div className="label">Won</div></div>
        <div className="score"><div className="num">{counts.lost}</div><div className="label">Lost</div></div>
      </div>

      <div className="page-toolbar">
        <div className="filters">
          {TABS.map(t => (
            <button key={t.key} className={`filter-chip ${show === t.key ? 'active' : ''}`} onClick={() => { setShow(t.key); setPage(0); }}>
              {t.label} ({counts[t.key]})
            </button>
          ))}
        </div>
      </div>

      <div className="filter-row">
        <select className="filter-select" value={verticalId} onChange={e => { setVerticalId(e.target.value === 'all' ? 'all' : Number(e.target.value)); setStageId('all'); setPage(0); }} aria-label="Product vertical">
          <option value="all">All products</option>
          {VERTICALS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <select className="filter-select" value={stageId} onChange={e => { setStageId(e.target.value === 'all' ? 'all' : Number(e.target.value)); setPage(0); }} disabled={verticalId === 'all'} aria-label="Stage">
          <option value="all">{verticalId === 'all' ? 'Pick a product for stages' : 'All stages'}</option>
          {verticalId !== 'all' && stagesFor(verticalId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="filter-select" value={source} onChange={e => { setSource(e.target.value); setPage(0); }} aria-label="Source">
          <option value="all">All sources</option>
          {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {q && <span className="filter-note">Searching for “{searchQuery}”</span>}
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="orders-table">
            <thead>
              <tr><th>Lead</th><th>Product</th><th>Stage</th><th>Source</th><th>Last call</th><th>Next follow-up</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow cols={7} text="No leads match these filters." />}
              {rows.map(l => {
                const last = lastCallFor(l.id, activities);
                const next = nextFollowup(l.id);
                return (
                  <tr key={l.id}>
                    <td className="cust">
                      {l.customer_name}
                      <div className="loc">{l.phone} · added {ago(l.created_at)}</div>
                    </td>
                    <td>{verticalName(l.vertical_id)}</td>
                    <td><span className={`chip ${won(l.stage_id) ? 'delivered' : stageOf(l.stage_id)?.name === 'Lost' ? 'muted' : 'confirmed'}`}>{stageName(l.stage_id)}</span></td>
                    <td>{l.source === 'Website' ? <span className="source-tag website">Website</span> : l.source}</td>
                    <td>
                      {last ? <><StatusChip status={last.outcome} /><div className="loc">{ago(last.created_at)}</div></> : <span className="loc">Never</span>}
                    </td>
                    <td>{next ? <>{shortDateTime(next.due_at).split(',')[0]}<div className="loc">{next.note}</div></> : <span className="loc">—</span>}</td>
                    <td>
                      <div className="row-actions">
                        {isOpenLead(l) && <CallButton onClick={() => onCall(l, next)} />}
                        {stageOf(l.stage_id)?.name !== 'Lost' && <button className="kanban-btn" onClick={() => onSale(l)}>Sale</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <span>{filtered.length === 0 ? '0 leads' : `${safePage * PAGE_SIZE + 1}–${Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)} of ${filtered.length} leads · least recently contacted first`}</span>
          <div className="pager-btns">
            <button className="btn-secondary btn-small" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
            <button className="btn-secondary btn-small" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>Next</button>
          </div>
        </div>
      </div>
    </>
  );
}
