import React, { useState } from 'react';
import { LEAD_SOURCES, TELECALLERS, TODAY, VERTICALS } from '../../data/managerDashboard';
import { Upload } from 'lucide-react';
import { ago, daysBefore, shortDate } from '../../lib/format';
import Modal from '../Modal';
import ImportLeads, { NewLead } from './ImportLeads';
import { EmptyRow, StatusChip } from './shared';
import { TeamData, callerOf, callerName, isOpenLead, isWonLead, lastCallFor, stageName, stageOf, stagesFor, verticalName } from './tcData';

type Tab = 'open' | 'new-today' | 'stale' | 'inactive' | 'all';
const PAGE_SIZE = 20;

interface Props {
  data: TeamData;
  searchQuery: string;
  initialCaller?: number;
  onReassign: (leadIds: number[], toCallerId: number) => void;
  onImport: (leads: NewLead[]) => void;
  onToast: (message: string) => void;
}

export default function TeamLeads({ data, searchQuery, initialCaller, onReassign, onImport, onToast }: Props) {
  const [importOpen, setImportOpen] = useState(false);
  const inactiveIds = new Set(TELECALLERS.filter(t => !t.is_active).map(t => t.id));
  const [tab, setTab] = useState<Tab>(initialCaller && inactiveIds.has(initialCaller) ? 'inactive' : 'open');
  const [caller, setCaller] = useState<number | 'all'>(initialCaller ?? 'all');
  const [verticalId, setVerticalId] = useState<number | 'all'>('all');
  const [stageId, setStageId] = useState<number | 'all'>('all');
  const [source, setSource] = useState('all');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [target, setTarget] = useState<number>(TELECALLERS.find(t => t.is_active)!.id);

  const TABS: { key: Tab; label: string; test: (l: typeof data.leads[number]) => boolean }[] = [
    { key: 'open', label: 'Open', test: isOpenLead },
    { key: 'new-today', label: 'New today', test: l => l.created_at.startsWith(TODAY) },
    { key: 'stale', label: 'Untouched 3+ days', test: l => isOpenLead(l) && daysBefore(l.updated_at) >= 3 },
    { key: 'inactive', label: 'With inactive staff', test: l => isOpenLead(l) && inactiveIds.has(l.assigned_to) },
    { key: 'all', label: 'All', test: () => true },
  ];
  const tabTest = TABS.find(t => t.key === tab)!.test;

  const q = searchQuery.trim().toLowerCase();
  const filtered = data.leads
    .filter(l => tabTest(l))
    .filter(l => caller === 'all' || l.assigned_to === caller)
    .filter(l => verticalId === 'all' || l.vertical_id === verticalId)
    .filter(l => stageId === 'all' || l.stage_id === stageId)
    .filter(l => source === 'all' || l.source === source)
    .filter(l => !q || [l.customer_name, l.phone].some(v => v.toLowerCase().includes(q)))
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at));

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const reset = () => { setPage(0); setSelected(new Set()); };

  const allOnPage = rows.length > 0 && rows.every(l => selected.has(l.id));
  const toggle = (id: number) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const togglePage = () => setSelected(prev => { const n = new Set(prev); rows.forEach(l => (allOnPage ? n.delete(l.id) : n.add(l.id))); return n; });

  const reassignSelected = () => {
    const ids = Array.from(selected).filter(id => data.leads.find(l => l.id === id)?.assigned_to !== target);
    if (ids.length === 0) { onToast(`Those leads are already with ${callerName(target)}`); return; }
    onReassign(ids, target);
    setSelected(new Set());
  };

  const createImported = (newLeads: NewLead[]) => {
    onImport(newLeads);
    setImportOpen(false);
    setTab('new-today');
    setCaller('all');
    reset();
  };

  // Every source in use, including "Imported file" and anything else brought in by an import
  const sources = Array.from(new Set([...LEAD_SOURCES, ...data.leads.map(l => l.source)]));

  const count = (test: (l: typeof data.leads[number]) => boolean) => data.leads.filter(test).length;

  return (
    <>
      <div className="scoreboard">
        <div className="score"><div className="num">{count(isOpenLead)}</div><div className="label">Open leads</div></div>
        <div className="score"><div className="num">{count(l => l.created_at.startsWith(TODAY))}</div><div className="label">New today</div></div>
        <div className="score"><div className="num">{count(l => isOpenLead(l) && daysBefore(l.updated_at) >= 3)}</div><div className="label">Untouched 3+ days</div></div>
        <div className="score"><div className="num">{count(l => isOpenLead(l) && inactiveIds.has(l.assigned_to))}</div><div className="label">With inactive staff</div></div>
        <div className="score"><div className="num">{count(isWonLead)}</div><div className="label">Won</div></div>
      </div>

      <div className="page-toolbar">
        <div className="filters">
          {TABS.map(t => (
            <button key={t.key} className={`filter-chip ${tab === t.key ? 'active' : ''}`} onClick={() => { setTab(t.key); reset(); }}>
              {t.label} ({count(t.test)})
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          <button className="btn-primary" onClick={() => setImportOpen(true)}>
            <Upload size={15} /> Import leads
          </button>
        </div>
      </div>

      <div className="filter-row">
        <select className="filter-select" value={caller} onChange={e => { setCaller(e.target.value === 'all' ? 'all' : Number(e.target.value)); reset(); }} aria-label="Telecaller">
          <option value="all">All telecallers</option>
          {TELECALLERS.map(t => <option key={t.id} value={t.id}>{t.name}{t.is_active ? '' : ' (inactive)'}</option>)}
        </select>
        <select className="filter-select" value={verticalId} onChange={e => { setVerticalId(e.target.value === 'all' ? 'all' : Number(e.target.value)); setStageId('all'); reset(); }} aria-label="Product">
          <option value="all">All products</option>
          {VERTICALS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <select className="filter-select" value={stageId} disabled={verticalId === 'all'} onChange={e => { setStageId(e.target.value === 'all' ? 'all' : Number(e.target.value)); reset(); }} aria-label="Stage">
          <option value="all">{verticalId === 'all' ? 'Pick a product for stages' : 'All stages'}</option>
          {verticalId !== 'all' && stagesFor(verticalId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="filter-select" value={source} onChange={e => { setSource(e.target.value); reset(); }} aria-label="Source">
          <option value="all">All sources</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="bulk-bar">
          <strong>{selected.size} selected</strong>
          <span>Reassign to</span>
          <select className="filter-select" value={target} onChange={e => setTarget(Number(e.target.value))} aria-label="Reassign to">
            {TELECALLERS.filter(t => t.is_active).map(t => <option key={t.id} value={t.id}>{t.name} · {t.region}</option>)}
          </select>
          <button className="btn-primary btn-small" onClick={reassignSelected}>Reassign</button>
          <button className="link-btn" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      <div className="panel">
        <div className="table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={allOnPage} onChange={togglePage} aria-label="Select all on this page" /></th>
                <th>Lead</th><th>Telecaller</th><th>Product</th><th>Stage</th><th>Source</th><th>Last call</th><th>Last touched</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow cols={8} text="No leads match these filters." />}
              {rows.map(l => {
                const last = lastCallFor(l.id, data.activities);
                const owner = callerOf(l.assigned_to);
                const stale = isOpenLead(l) && daysBefore(l.updated_at) >= 3;
                return (
                  <tr key={l.id} className={selected.has(l.id) ? 'row-selected' : undefined}>
                    <td><input type="checkbox" checked={selected.has(l.id)} onChange={() => toggle(l.id)} aria-label={`Select ${l.customer_name}`} /></td>
                    <td className="cust">{l.customer_name}<div className="loc">{l.phone} · added {shortDate(l.created_at)}</div></td>
                    <td>
                      {owner?.name ?? '—'}
                      {owner && !owner.is_active && <div><span className="chip muted">Inactive</span></div>}
                    </td>
                    <td>{verticalName(l.vertical_id)}</td>
                    <td><span className={`chip ${isWonLead(l) ? 'delivered' : stageOf(l.stage_id)?.name === 'Lost' ? 'muted' : 'confirmed'}`}>{stageName(l.stage_id)}</span></td>
                    <td>{l.source === 'Website' ? <span className="source-tag website">Website</span> : l.source}</td>
                    <td>{last ? <><StatusChip status={last.outcome} /><div className="loc">{ago(last.created_at)}</div></> : <span className="loc">Never</span>}</td>
                    <td className={stale ? 'text-warn' : undefined}>{ago(l.updated_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <span>{filtered.length === 0 ? '0 leads' : `${safePage * PAGE_SIZE + 1}–${Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)} of ${filtered.length} leads · least recently touched first`}</span>
          <div className="pager-btns">
            <button className="btn-secondary btn-small" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
            <button className="btn-secondary btn-small" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>Next</button>
          </div>
        </div>
      </div>

      <Modal isOpen={importOpen} onClose={() => setImportOpen(false)} title="Import leads from Excel or PDF" wide>
        <ImportLeads leads={data.leads} onCreate={createImported} onClose={() => setImportOpen(false)} />
      </Modal>
    </>
  );
}
