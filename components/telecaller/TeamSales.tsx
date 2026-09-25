import React, { useState } from 'react';
import { TELECALLERS, TODAY, VERTICALS } from '../../data/managerDashboard';
import { MONTH, daysBefore, rupees, rupeesShort, shortDate } from '../../lib/format';
import { ExportFormat, exportTable } from '../../lib/export';
import HBarList from '../HBarList';
import ExportMenu from '../ExportMenu';
import { EmptyRow } from './shared';
import { TeamData, callerName, productName, productOf, salesByMonth, verticalName } from './tcData';

type Range = '7d' | 'month' | '6m';
const RANGE_LABEL: Record<Range, string> = { '7d': 'Last 7 days', month: 'This month', '6m': 'Last 6 months' };
const PAGE_SIZE = 20;

export default function TeamSales({ data, onToast }: { data: TeamData; onToast: (m: string) => void }) {
  const [range, setRange] = useState<Range>('month');
  const [caller, setCaller] = useState<number | 'all'>('all');
  const [verticalId, setVerticalId] = useState<number | 'all'>('all');
  const [page, setPage] = useState(0);

  const inRange = (d: string) => (range === '7d' ? daysBefore(d) <= 6 : range === 'month' ? d.startsWith(MONTH) : daysBefore(d) <= 183);
  const scoped = data.sales.filter(s =>
    (caller === 'all' || s.caller_id === caller) && (verticalId === 'all' || productOf(s.product_id)?.vertical_id === verticalId));
  const rows = scoped.filter(s => inRange(s.sold_at)).sort((a, b) => b.sold_at.localeCompare(a.sold_at) || b.id - a.id);
  const revenue = rows.reduce((a, s) => a + s.amount, 0);

  const group = <K,>(key: (s: typeof rows[number]) => K) =>
    Array.from(rows.reduce((m, s) => m.set(key(s), (m.get(key(s)) ?? 0) + s.amount), new Map<K, number>())).sort((a, b) => b[1] - a[1]);
  const byCaller = group(s => s.caller_id);
  const byProduct = group(s => s.product_id).slice(0, 6);
  const byVertical = group(s => productOf(s.product_id)?.vertical_id ?? 0);
  const months = salesByMonth(scoped);
  const maxMonth = Math.max(1, ...months.map(m => m.amount));

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);

  const runExport = async (format: ExportFormat) => {
    if (rows.length === 0) { onToast('No sales to export'); return; }
    try {
      await exportTable(format, {
        filename: `team-sales-${TODAY}`,
        title: 'Telecalling sales',
        subtitle: `${rows.length} sales · Rs. ${Math.round(revenue).toLocaleString('en-IN')} · ${RANGE_LABEL[range]}${caller === 'all' ? '' : ` · ${callerName(caller)}`} · exported ${shortDate(TODAY)}`,
        columns: [
          { header: 'Date', width: 10 }, { header: 'Telecaller', width: 16 }, { header: 'Customer', width: 18 },
          { header: 'Product', width: 24 }, { header: 'Qty', width: 6 }, { header: 'Amount', width: 11, money: true },
        ],
        rows: rows.map(s => [shortDate(s.sold_at), callerName(s.caller_id), s.customer_name, productName(s.product_id), s.quantity, s.amount]),
      });
      onToast(`Sales exported to ${format === 'excel' ? 'Excel' : 'PDF'}`);
    } catch {
      onToast('Export failed. Please try again.');
    }
  };

  return (
    <>
      <div className="page-toolbar">
        <div className="filters">
          {(['7d', 'month', '6m'] as Range[]).map(r => (
            <button key={r} className={`filter-chip ${range === r ? 'active' : ''}`} onClick={() => { setRange(r); setPage(0); }}>{RANGE_LABEL[r]}</button>
          ))}
        </div>
        <div className="toolbar-actions">
          <select className="filter-select" value={caller} onChange={e => { setCaller(e.target.value === 'all' ? 'all' : Number(e.target.value)); setPage(0); }} aria-label="Telecaller">
            <option value="all">All telecallers</option>
            {TELECALLERS.map(t => <option key={t.id} value={t.id}>{t.name}{t.is_active ? '' : ' (inactive)'}</option>)}
          </select>
          <select className="filter-select" value={verticalId} onChange={e => { setVerticalId(e.target.value === 'all' ? 'all' : Number(e.target.value)); setPage(0); }} aria-label="Product">
            <option value="all">All products</option>
            {VERTICALS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <ExportMenu onExport={runExport} />
        </div>
      </div>

      <div className="scoreboard">
        <div className="score"><div className="num">{rupeesShort(revenue)}</div><div className="label">Revenue · {RANGE_LABEL[range].toLowerCase()}</div></div>
        <div className="score"><div className="num">{rows.length}</div><div className="label">Sales</div></div>
        <div className="score"><div className="num">{rows.length ? rupees(revenue / rows.length) : '—'}</div><div className="label">Average sale</div></div>
        <div className="score"><div className="num best-seller">{byCaller[0] ? callerName(byCaller[0][0]) : '—'}</div><div className="label">Top telecaller</div></div>
        <div className="score"><div className="num best-seller">{byProduct[0] ? productName(byProduct[0][0]) : '—'}</div><div className="label">Top product</div></div>
      </div>

      <div className="grid equal-2">
        <div className="panel">
          <div className="panel-head"><h2>Sales by month</h2><span className="panel-meta">Last 6 months</span></div>
          <div className="bar-chart">
            {months.map((m, i) => (
              <div key={m.key} className="bc-col" data-tip={`${m.label}: ${rupees(m.amount)} · ${m.count} sales${i === 5 ? ' (month to date)' : ''}`}>
                <div className={`bc-bar ${i === 5 ? 'now' : ''}`} style={{ height: `${(m.amount / maxMonth) * 100}%` }} />
                <div className="bc-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><h2>By telecaller</h2><span className="panel-meta">{RANGE_LABEL[range]}</span></div>
          {byCaller.length === 0 ? <div className="loc">No sales in this range.</div> : (
            <HBarList rows={byCaller.map(([id, amt]) => ({ key: String(id), label: callerName(id), value: amt, display: rupeesShort(amt), tip: `${callerName(id)}: ${rupees(amt)}` }))} />
          )}
        </div>
      </div>

      <div className="grid equal-2">
        <div className="panel">
          <div className="panel-head"><h2>By product</h2><span className="panel-meta">{RANGE_LABEL[range]}</span></div>
          {byProduct.length === 0 ? <div className="loc">No sales in this range.</div> : (
            <HBarList rows={byProduct.map(([id, amt]) => ({ key: String(id), label: productName(id), value: amt, display: rupeesShort(amt), tip: `${productName(id)}: ${rupees(amt)}` }))} />
          )}
        </div>
        <div className="panel">
          <div className="panel-head"><h2>By vertical</h2><span className="panel-meta">{RANGE_LABEL[range]}</span></div>
          {byVertical.length === 0 ? <div className="loc">No sales in this range.</div> : (
            <HBarList rows={byVertical.map(([id, amt]) => ({ key: String(id), label: verticalName(id), value: amt, display: rupeesShort(amt), tip: `${verticalName(id)}: ${rupees(amt)}` }))} />
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Sales</h2><span className="panel-meta">{rows.length} in {RANGE_LABEL[range].toLowerCase()}</span></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Telecaller</th><th>Customer</th><th>Product</th><th className="num-col">Amount</th></tr></thead>
            <tbody>
              {rows.length === 0 && <EmptyRow cols={5} text="No sales in this range." />}
              {rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE).map(s => (
                <tr key={s.id}>
                  <td>{shortDate(s.sold_at)}</td>
                  <td>{callerName(s.caller_id)}</td>
                  <td className="cust">{s.customer_name}</td>
                  <td>{productName(s.product_id)} × {s.quantity}</td>
                  <td className="num-col strong">{rupees(s.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <span>{rows.length === 0 ? '0 sales' : `${safePage * PAGE_SIZE + 1}–${Math.min(rows.length, (safePage + 1) * PAGE_SIZE)} of ${rows.length}`}</span>
          <div className="pager-btns">
            <button className="btn-secondary btn-small" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
            <button className="btn-secondary btn-small" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>Next</button>
          </div>
        </div>
      </div>
    </>
  );
}
