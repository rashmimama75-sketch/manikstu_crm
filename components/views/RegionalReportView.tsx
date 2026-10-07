import React, { useMemo, useState } from 'react';
import { ChevronRight, IndianRupee, MapPin, PackageCheck, Receipt, Users } from 'lucide-react';
import { TODAY, OrderSource, SalesOrder } from '../../data/managerDashboard';
import { MONTH, daysBefore, pct, rupees, rupeesShort, shortDate } from '../../lib/format';
import { ExportFormat, exportTable } from '../../lib/export';
import { INDIA_STATES, INDIA_UTS, districtFor, stateFor } from '../../lib/regions';
import ExportMenu from '../ExportMenu';
import PieChart, { PieSlice } from '../PieChart';

type Period = 'month' | '30d' | '90d' | 'all';
const PERIOD_LABEL: Record<Period, string> = { month: 'This month', '30d': 'Last 30 days', '90d': 'Last 90 days', all: 'All time' };
const inPeriod = (ts: string, p: Period) => p === 'all' || (p === 'month' ? ts.startsWith(MONTH) : daysBefore(ts) < (p === '30d' ? 30 : 90));
const PAGE_SIZE = 15;

const village = (o: SalesOrder) => { const a = o.address ?? ''; return a.split(',').slice(1).join(',').trim() || a; };

interface Props {
  orders: SalesOrder[];
  onToast: (message: string) => void;
}

/** Orders by location: state → district → town / pincode, with farmer summary and downloads. */
export default function RegionalReportView({ orders, onToast }: Props) {
  const located = useMemo(
    () => orders.map(o => ({ o, state: stateFor(o.state, o.pincode), district: districtFor(o.state, o.pincode, o.city) })),
    [orders],
  );
  // Orders per state / UT (all periods), for the State list
  const stateCounts = located.reduce((m, x) => m.set(x.state, (m.get(x.state) ?? 0) + 1), new Map<string, number>());
  const unknownCount = stateCounts.get('Unknown') ?? 0;

  const [state, setState] = useState('Odisha');
  const [district, setDistrict] = useState('all');
  const [period, setPeriod] = useState<Period>('all');
  const [source, setSource] = useState<OrderSource | 'all'>('all');
  const [page, setPage] = useState(0);
  const reset = () => setPage(0);

  // Everything except the location filters
  const base = located.filter(({ o, state: st }) =>
    st === state && inPeriod(o.created_at, period) && (source === 'all' || o.source === source));
  const districtCounts = Array.from(base.reduce((m, x) => m.set(x.district, (m.get(x.district) ?? 0) + 1), new Map<string, number>()))
    .sort((a, b) => a[0].localeCompare(b[0]));
  const rows = base
    .filter(x => district === 'all' || x.district === district)
    .map(x => x.o)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  // Tiles
  const live = rows.filter(o => o.status !== 'cancelled');
  const revenue = live.reduce((a, o) => a + o.total, 0);
  const farmers = new Set(rows.map(o => o.phone)).size;
  const delivered = live.filter(o => o.status === 'delivered').length;
  const cashDue = live.filter(o => o.payment_method === 'COD' && o.payment_status === 'unpaid').reduce((a, o) => a + o.total, 0);

  // Farmer summary: one row per customer (by phone)
  const farmerRows = useMemo(() => {
    const m = new Map<string, { name: string; phone: string; place: string; orders: number; spent: number; last: string; products: Map<string, number> }>();
    rows.forEach(o => {
      const f = m.get(o.phone) ?? { name: o.customer_name, phone: o.phone, place: `${village(o)}, ${o.city} ${o.pincode}`, orders: 0, spent: 0, last: o.created_at, products: new Map() };
      f.orders++;
      if (o.status !== 'cancelled') f.spent += o.total;
      if (o.created_at > f.last) f.last = o.created_at;
      o.items.forEach(i => f.products.set(i.product_name, (f.products.get(i.product_name) ?? 0) + i.quantity));
      m.set(o.phone, f);
    });
    return Array.from(m.values())
      .map(f => ({ ...f, top: Array.from(f.products).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—' }))
      .sort((a, b) => b.spent - a.spent);
  }, [rows]);

  // Breakdown charts
  const byDistrict = Array.from(base.filter(x => x.o.status !== 'cancelled').reduce((m, x) => m.set(x.district, (m.get(x.district) ?? 0) + x.o.total), new Map<string, number>()))
    .sort((a, b) => b[1] - a[1]);
  const productTotals = Array.from(live.reduce((m, o) => {
    o.items.forEach(i => m.set(i.product_name, (m.get(i.product_name) ?? 0) + i.price * i.quantity));
    return m;
  }, new Map<string, number>())).sort((a, b) => b[1] - a[1]);
  // Pie: top 5 products, the rest folded into "Other" (max 6 slices)
  const byProduct: PieSlice[] = productTotals.length <= 6
    ? productTotals.map(([p, amt]) => ({ key: p, label: p, value: amt, display: rupeesShort(amt) }))
    : [
        ...productTotals.slice(0, 5).map(([p, amt]) => ({ key: p, label: p, value: amt, display: rupeesShort(amt) })),
        (amt => ({ key: 'other', label: `Other (${productTotals.length - 5})`, value: amt, display: rupeesShort(amt), other: true }))(
          productTotals.slice(5).reduce((a, [, amt]) => a + amt, 0)),
      ];

  const areaLabel = `${state} › ${district === 'all' ? 'all districts' : district}`;
  const summary = `${rows.length} orders · revenue ${rupees(revenue)} · ${farmers} farmers · ${pct(delivered, live.length)}% delivered · cash to collect ${rupees(cashDue)}`;

  const exportFarmers = async (format: ExportFormat) => {
    if (farmerRows.length === 0) { onToast('No farmers in this area to export'); return; }
    try {
      await exportTable(format, {
        filename: `regional-farmers-${(district === 'all' ? state : district).toLowerCase()}-${TODAY}`,
        title: `Farmers · ${areaLabel}`,
        subtitle: `${PERIOD_LABEL[period]} · ${summary} · exported ${shortDate(TODAY)}`,
        columns: [
          { header: 'Farmer / customer', width: 20 }, { header: 'Phone', width: 12 }, { header: 'Village, town, PIN', width: 30 },
          { header: 'Orders', width: 8 }, { header: 'Total spent', width: 12, money: true }, { header: 'Last order', width: 11 }, { header: 'Top product', width: 24 },
        ],
        rows: farmerRows.map(f => [f.name, f.phone, f.place, f.orders, f.spent, shortDate(f.last), f.top]),
      });
      onToast(`Farmer summary exported to ${format === 'excel' ? 'Excel' : 'PDF'}`);
    } catch {
      onToast('Export failed. Please try again.');
    }
  };

  const pages = Math.max(1, Math.ceil(farmerRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const pageRows = farmerRows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <>
      <div className="region-toolbar">
        <div className="region-crumb">
          <MapPin size={16} className="region-pin" aria-hidden />
          <div className="pill-select">
            <select value={state} onChange={e => { setState(e.target.value); setDistrict('all'); reset(); }} aria-label="State">
              <optgroup label="States">
                {INDIA_STATES.map(s => <option key={s} value={s}>{s}{stateCounts.get(s) ? ` (${stateCounts.get(s)})` : ''}</option>)}
              </optgroup>
              <optgroup label="Union territories">
                {INDIA_UTS.map(s => <option key={s} value={s}>{s}{stateCounts.get(s) ? ` (${stateCounts.get(s)})` : ''}</option>)}
              </optgroup>
              {unknownCount > 0 && <option value="Unknown">Unknown state ({unknownCount})</option>}
            </select>
          </div>
          <ChevronRight size={15} className="region-sep" aria-hidden />
          <div className="pill-select">
            <select value={district} onChange={e => { setDistrict(e.target.value); reset(); }} aria-label={state === 'Odisha' ? 'District' : 'District / town'}>
              <option value="all">All districts ({base.length})</option>
              {districtCounts.map(([d, n]) => <option key={d} value={d}>{d} ({n})</option>)}
            </select>
          </div>
        </div>
        <div className="region-toolbar-right">
          <div className="pill-select">
            <select value={period} onChange={e => { setPeriod(e.target.value as Period); reset(); }} aria-label="Period">
              {(Object.keys(PERIOD_LABEL) as Period[]).map(p => <option key={p} value={p}>{PERIOD_LABEL[p]}</option>)}
            </select>
          </div>
          <div className="pill-select">
            <select value={source} onChange={e => { setSource(e.target.value as OrderSource | 'all'); reset(); }} aria-label="Source">
              <option value="all">Website + telecalling</option>
              <option value="website">Website</option>
              <option value="telecaller">Telecalling</option>
            </select>
          </div>
        </div>
      </div>

      <div className="region-kpis four">
        <div className="stat-tile accent">
          <IndianRupee className="stat-icon" size={20} />
          <div className="num">{rupeesShort(revenue)}</div>
          <div className="label">Revenue</div>
        </div>
        <div className="stat-tile">
          <Users className="stat-icon" size={20} />
          <div className="num">{farmers}</div>
          <div className="label">Farmers / customers</div>
        </div>
        <div className="stat-tile">
          <Receipt className="stat-icon" size={20} />
          <div className="num">{live.length ? rupees(Math.round(revenue / live.length)) : '—'}</div>
          <div className="label">Average order</div>
        </div>
        <div className="stat-tile">
          <PackageCheck className="stat-icon" size={20} />
          <div className="num">{live.length ? `${pct(delivered, live.length)}%` : '—'}</div>
          <div className="label">Delivered</div>
        </div>
      </div>

      <div className="grid equal-2">
        <div className="panel">
          <div className="panel-head"><h2>Revenue by district</h2><span className="panel-meta">{state} · click a bar to filter</span></div>
          {byDistrict.length === 0 ? <div className="loc">No orders from {state}{period === 'all' ? '' : ` in ${PERIOD_LABEL[period].toLowerCase()}`}.</div> : (
            <div className="col-chart">
              {byDistrict.map(([d, amt], i) => (
                <button
                  key={d}
                  className={`col ${district === d ? 'selected' : ''}`}
                  data-tip={`${d}: ${rupees(amt)}`}
                  aria-label={`${d}: ${rupees(amt)}`}
                  onClick={() => { setDistrict(district === d ? 'all' : d); reset(); }}
                >
                  <span className="col-plot">
                    <span className="col-bar" style={{ height: `${Math.max(1, (amt / byDistrict[0][1]) * 100)}%` }}>
                      {(i === 0 || district === d) && <span className="col-value">{rupeesShort(amt)}</span>}
                    </span>
                  </span>
                  <span className="col-label">{d}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Product share</h2><span className="panel-meta">{district === 'all' ? state : district}</span></div>
          {byProduct.length === 0 ? <div className="loc">No sales in this area.</div> : (
            <PieChart slices={byProduct} label={`Share of sales by product in ${district === 'all' ? state : district}`} />
          )}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>{areaLabel}</h2>
          <span className="panel-meta">{PERIOD_LABEL[period]}</span>
        </div>
        <div className="page-toolbar" style={{ marginBottom: 12 }}>
          <div className="panel-meta">Farmer-wise · {farmerRows.length} farmers, {rows.length} orders</div>
          <div className="toolbar-actions">
            <ExportMenu onExport={exportFarmers} />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Farmer / customer</th><th>Village · town · PIN</th><th className="num-col">Orders</th><th className="num-col">Total spent</th><th>Last order</th><th>Top product</th></tr>
            </thead>
            <tbody>
              {farmerRows.length === 0 && <tr><td colSpan={6} className="loc" style={{ textAlign: 'center', padding: 24 }}>{stateCounts.get(state) ? 'No farmers in this area for these filters.' : `No orders from ${state} yet.`}</td></tr>}
              {pageRows.map(f => (
                <tr key={f.phone}>
                  <td className="cust">{f.name}<div className="loc">{f.phone}</div></td>
                  <td>{f.place}</td>
                  <td className="num-col">{f.orders}</td>
                  <td className="num-col strong">{rupees(f.spent)}</td>
                  <td>{shortDate(f.last)}</td>
                  <td>{f.top}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <span>{farmerRows.length} farmers</span>
          {pages > 1 && (
            <div className="pager-btns">
              <button className="btn-secondary btn-small" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
              <button className="btn-secondary btn-small" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>Next</button>
            </div>
          )}
        </div>
      </div>

      <div className="panel-note">
        Orders don&apos;t store a district yet: for Odisha it&apos;s worked out from the PIN code (or town name); for other states the town is shown. If an order has no state, it&apos;s taken from the PIN code. Cancelled orders are listed but not counted in revenue.
      </div>
    </>
  );
}
