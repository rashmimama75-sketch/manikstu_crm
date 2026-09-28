import React, { useMemo, useState } from 'react';
import { TELECALLERS, TODAY, OrderSource, OrderStatus, SalesOrder } from '../../data/managerDashboard';
import { MONTH, ORDER_CHIP, daysBefore, pct, rupees, rupeesShort, shortDate } from '../../lib/format';
import { ExportFormat, exportTable } from '../../lib/export';
import { INDIA_STATES, INDIA_UTS, districtFor, stateFor } from '../../lib/regions';
import ExportMenu from '../ExportMenu';
import HBarList from '../HBarList';

type Period = 'month' | '30d' | '90d' | 'all';
const PERIOD_LABEL: Record<Period, string> = { month: 'This month', '30d': 'Last 30 days', '90d': 'Last 90 days', all: 'All time' };
const inPeriod = (ts: string, p: Period) => p === 'all' || (p === 'month' ? ts.startsWith(MONTH) : daysBefore(ts) < (p === '30d' ? 30 : 90));
const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
type View = 'orders' | 'farmers';
const PAGE_SIZE = 15;

const soldBy = (o: SalesOrder) => (o.caller_id === null ? 'Website' : TELECALLERS.find(t => t.id === o.caller_id)?.name ?? 'Telecalling');
const itemsText = (o: SalesOrder) => o.items.map(i => `${i.product_name} × ${i.quantity}`).join(', ');
const village = (o: SalesOrder) => o.address.split(',').slice(1).join(',').trim() || o.address;

interface Props {
  orders: SalesOrder[];
  /** Open an order on the Orders page. */
  onOpenOrder: (orderNumber: string) => void;
  onToast: (message: string) => void;
}

/** Orders by location: state → district → town / pincode, with farmer summary and downloads. */
export default function RegionalReportView({ orders, onOpenOrder, onToast }: Props) {
  const located = useMemo(
    () => orders.map(o => ({ o, state: stateFor(o.state, o.pincode), district: districtFor(o.state, o.pincode, o.city) })),
    [orders],
  );
  // Orders per state / UT (all periods), for the State list
  const stateCounts = located.reduce((m, x) => m.set(x.state, (m.get(x.state) ?? 0) + 1), new Map<string, number>());
  const unknownCount = stateCounts.get('Unknown') ?? 0;

  const [state, setState] = useState('Odisha');
  const [district, setDistrict] = useState('all');
  const [area, setArea] = useState('all'); // town, or pin:<pincode>
  const [period, setPeriod] = useState<Period>('all');
  const [source, setSource] = useState<OrderSource | 'all'>('all');
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [view, setView] = useState<View>('orders');
  const [page, setPage] = useState(0);
  const reset = () => setPage(0);

  // Everything except the location filters
  const base = located.filter(({ o, state: st }) =>
    st === state && inPeriod(o.created_at, period) &&
    (source === 'all' || o.source === source) && (status === 'all' || o.status === status));
  const districtCounts = Array.from(base.reduce((m, x) => m.set(x.district, (m.get(x.district) ?? 0) + 1), new Map<string, number>()))
    .sort((a, b) => a[0].localeCompare(b[0]));
  const inDistrict = base.filter(x => district === 'all' || x.district === district);
  const towns = Array.from(new Set(inDistrict.map(x => x.o.city))).sort();
  const pincodes = Array.from(new Set(inDistrict.map(x => x.o.pincode))).sort();
  const rows = inDistrict
    .filter(x => area === 'all' || (area.startsWith('pin:') ? x.o.pincode === area.slice(4) : x.o.city === area))
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
  const byProduct = Array.from(live.reduce((m, o) => {
    o.items.forEach(i => m.set(i.product_name, (m.get(i.product_name) ?? 0) + i.price * i.quantity));
    return m;
  }, new Map<string, number>())).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const areaLabel = [state, district === 'all' ? 'all districts' : district, area === 'all' ? null : area.startsWith('pin:') ? `PIN ${area.slice(4)}` : area]
    .filter(Boolean).join(' › ');
  const summary = `${rows.length} orders · revenue ${rupees(revenue)} · ${farmers} farmers · ${pct(delivered, live.length)}% delivered · cash to collect ${rupees(cashDue)}`;

  const exportOrders = async (format: ExportFormat) => {
    if (rows.length === 0) { onToast('No orders in this area to export'); return; }
    try {
      await exportTable(format, {
        filename: `regional-orders-${(district === 'all' ? state : district).toLowerCase()}-${TODAY}`,
        title: `Orders · ${areaLabel}`,
        subtitle: `${PERIOD_LABEL[period]} · ${summary} · district from pincode · exported ${shortDate(TODAY)}`,
        columns: [
          { header: 'Order', width: 12 }, { header: 'Date', width: 10 }, { header: 'Farmer / customer', width: 18 }, { header: 'Phone', width: 12 },
          { header: 'Village / address', width: 20 }, { header: 'Town', width: 12 }, { header: 'District', width: 12 }, { header: 'PIN', width: 8 },
          { header: 'Products', width: 30 }, { header: 'Amount', width: 10, money: true }, { header: 'Payment', width: 14 }, { header: 'Status', width: 10 },
          { header: 'Sold by', width: 14 },
        ],
        rows: rows.map(o => [
          o.order_number, shortDate(o.created_at), o.customer_name, o.phone, o.address, o.city, districtFor(o.state, o.pincode, o.city), o.pincode,
          itemsText(o), o.total, `${o.payment_method} · ${o.payment_status}`, o.status, soldBy(o),
        ]),
      });
      onToast(`Orders for ${district === 'all' ? state : district} exported to ${format === 'excel' ? 'Excel' : 'PDF'}`);
    } catch {
      onToast('Export failed. Please try again.');
    }
  };

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

  const list = view === 'orders' ? rows : farmerRows;
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const slice = <T,>(xs: T[]) => xs.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <>
      <div className="panel region-picker">
        <div className="region-steps">
          <label className="form-group">
            <span>State</span>
            <select className="filter-select" value={state} onChange={e => { setState(e.target.value); setDistrict('all'); setArea('all'); reset(); }}>
              <optgroup label="States">
                {INDIA_STATES.map(s => <option key={s} value={s}>{s}{stateCounts.get(s) ? ` (${stateCounts.get(s)})` : ''}</option>)}
              </optgroup>
              <optgroup label="Union territories">
                {INDIA_UTS.map(s => <option key={s} value={s}>{s}{stateCounts.get(s) ? ` (${stateCounts.get(s)})` : ''}</option>)}
              </optgroup>
              {unknownCount > 0 && <option value="Unknown">Unknown state ({unknownCount})</option>}
            </select>
          </label>
          <span className="region-arrow" aria-hidden>›</span>
          <label className="form-group">
            <span>{state === 'Odisha' ? 'District' : 'District / town'}</span>
            <select className="filter-select" value={district} onChange={e => { setDistrict(e.target.value); setArea('all'); reset(); }}>
              <option value="all">All districts ({base.length})</option>
              {districtCounts.map(([d, n]) => <option key={d} value={d}>{d} ({n})</option>)}
            </select>
          </label>
          <span className="region-arrow" aria-hidden>›</span>
          <label className="form-group">
            <span>Town / PIN</span>
            <select className="filter-select" value={area} onChange={e => { setArea(e.target.value); reset(); }}>
              <option value="all">All towns</option>
              <optgroup label="Town">{towns.map(t => <option key={t} value={t}>{t}</option>)}</optgroup>
              <optgroup label="PIN code">{pincodes.map(p => <option key={p} value={`pin:${p}`}>{p}</option>)}</optgroup>
            </select>
          </label>
        </div>
        <div className="region-filters">
          <select className="filter-select" value={period} onChange={e => { setPeriod(e.target.value as Period); reset(); }} aria-label="Period">
            {(Object.keys(PERIOD_LABEL) as Period[]).map(p => <option key={p} value={p}>{PERIOD_LABEL[p]}</option>)}
          </select>
          <select className="filter-select" value={source} onChange={e => { setSource(e.target.value as OrderSource | 'all'); reset(); }} aria-label="Source">
            <option value="all">Website + telecalling</option>
            <option value="website">Website</option>
            <option value="telecaller">Telecalling</option>
          </select>
          <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value as OrderStatus | 'all'); reset(); }} aria-label="Status">
            <option value="all">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div className="scoreboard">
        <div className="score"><div className="num">{rows.length}</div><div className="label">Orders</div></div>
        <div className="score"><div className="num">{rupeesShort(revenue)}</div><div className="label">Revenue</div></div>
        <div className="score"><div className="num">{farmers}</div><div className="label">Farmers / customers</div></div>
        <div className="score"><div className="num">{live.length ? rupees(Math.round(revenue / live.length)) : '—'}</div><div className="label">Average order</div></div>
        <div className="score"><div className="num">{live.length ? `${pct(delivered, live.length)}%` : '—'}</div><div className="label">Delivered</div></div>
        <div className="score"><div className={`num ${cashDue ? 'text-warn' : ''}`}>{rupeesShort(cashDue)}</div><div className="label">Cash to collect (COD)</div></div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>{areaLabel}</h2>
          <span className="panel-meta">{PERIOD_LABEL[period]}</span>
        </div>
        <div className="page-toolbar" style={{ marginBottom: 12 }}>
          <div className="filters">
            <button className={`filter-chip ${view === 'orders' ? 'active' : ''}`} onClick={() => { setView('orders'); reset(); }}>Orders ({rows.length})</button>
            <button className={`filter-chip ${view === 'farmers' ? 'active' : ''}`} onClick={() => { setView('farmers'); reset(); }}>By farmer ({farmerRows.length})</button>
          </div>
          <div className="toolbar-actions">
            <ExportMenu onExport={exportOrders} label="Download orders" />
            <ExportMenu onExport={exportFarmers} label="Download farmers" />
          </div>
        </div>

        <div className="table-wrap">
          {view === 'orders' ? (
            <table className="orders-table">
              <thead>
                <tr><th>Order</th><th>Farmer / customer</th><th>Village · town</th><th>Products</th><th className="num-col">Amount</th><th>Status</th><th>Sold by</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={7} className="loc" style={{ textAlign: 'center', padding: 24 }}>{stateCounts.get(state) ? 'No orders in this area for these filters.' : `No orders from ${state} yet.`}</td></tr>}
                {slice(rows).map(o => (
                  <tr key={o.id} className="clickable" onClick={() => onOpenOrder(o.order_number)}>
                    <td className="order-cell"><div className="order-no">{o.order_number}</div><div className="loc">{shortDate(o.created_at)}</div></td>
                    <td className="cust">{o.customer_name}<div className="loc">{o.phone}</div></td>
                    <td>{village(o)}<div className="loc">{o.city} · {districtFor(o.state, o.pincode, o.city)} · {o.pincode}</div></td>
                    <td>{itemsText(o)}</td>
                    <td className="num-col">{rupees(o.total)}<div className="loc">{o.payment_method} · {o.payment_status}</div></td>
                    <td><span className={`chip ${ORDER_CHIP[o.status]}`}>{o.status}</span></td>
                    <td>{soldBy(o)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr><th>Farmer / customer</th><th>Village · town · PIN</th><th className="num-col">Orders</th><th className="num-col">Total spent</th><th>Last order</th><th>Top product</th></tr>
              </thead>
              <tbody>
                {farmerRows.length === 0 && <tr><td colSpan={6} className="loc" style={{ textAlign: 'center', padding: 24 }}>No farmers in this area for these filters.</td></tr>}
                {slice(farmerRows).map(f => (
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
          )}
        </div>
        <div className="pager">
          <span>{list.length} {view === 'orders' ? 'orders' : 'farmers'}{view === 'orders' && rows.length > 0 && ' · click an order to open it'}</span>
          {pages > 1 && (
            <div className="pager-btns">
              <button className="btn-secondary btn-small" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
              <button className="btn-secondary btn-small" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>Next</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid equal-2">
        <div className="panel">
          <div className="panel-head"><h2>Revenue by district</h2><span className="panel-meta">{state} · click to open</span></div>
          {byDistrict.length === 0 ? <div className="loc">No orders from {state}{period === 'all' ? '' : ` in ${PERIOD_LABEL[period].toLowerCase()}`}.</div> : (
            <ul className="hbar-list region-bars">
              {byDistrict.map(([d, amt]) => (
                <li key={d} className={`hbar-row ${district === d ? 'selected' : ''}`} data-tip={`${d}: ${rupees(amt)}`}>
                  <button className="hbar-label link-btn" onClick={() => { setDistrict(d); setArea('all'); reset(); }}>{d}</button>
                  <span className="hbar-track"><span className="hbar-fill" style={{ width: `${(amt / byDistrict[0][1]) * 100}%` }} /></span>
                  <span className="hbar-value">{rupeesShort(amt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Top products</h2><span className="panel-meta">{district === 'all' ? state : district}</span></div>
          {byProduct.length === 0 ? <div className="loc">No sales in this area.</div> : (
            <HBarList rows={byProduct.map(([p, amt]) => ({ key: p, label: p, value: amt, display: rupeesShort(amt), tip: `${p}: ${rupees(amt)}` }))} />
          )}
        </div>
      </div>

      <div className="panel-note">
        Orders don&apos;t store a district yet: for Odisha it&apos;s worked out from the PIN code (or town name); for other states the town is shown. If an order has no state, it&apos;s taken from the PIN code. Cancelled orders are listed but not counted in revenue.
      </div>
    </>
  );
}
