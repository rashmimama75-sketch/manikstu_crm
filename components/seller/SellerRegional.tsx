import React, { useMemo, useState } from 'react';
import { ChevronRight, IndianRupee, MapPin, PackageCheck, Receipt, ShoppingCart, Users, Wallet } from 'lucide-react';
import type { OrderStatus } from '../../data/managerDashboard';
import type { Seller } from '../../data/sellers';
import { TODAY } from '../../data/today';
import { MONTH, ORDER_CHIP, daysBefore, pct, rupees, rupeesShort, shortDate } from '../../lib/format';
import { ExportFormat, exportTable } from '../../lib/export';
import { INDIA_STATES, INDIA_UTS, districtFor, stateFor } from '../../lib/regions';
import ExportMenu from '../ExportMenu';
import PieChart, { PieSlice } from '../PieChart';
import { ORDER_STATUS_LABEL, SellerOrder, counts } from './sellerData';

type Period = 'month' | '30d' | '90d' | 'all';
const PERIOD_LABEL: Record<Period, string> = { month: 'This month', '30d': 'Last 30 days', '90d': 'Last 90 days', all: 'All time' };
const inPeriod = (ts: string, p: Period) => p === 'all' || (p === 'month' ? ts.startsWith(MONTH) : daysBefore(ts) < (p === '30d' ? 30 : 90));
const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
type View = 'orders' | 'customers';
const PAGE_SIZE = 15;

const itemsText = (o: SellerOrder) => o.items.map(i => `${i.product_name} × ${i.quantity}`).join(', ');
const village = (o: SellerOrder) => o.order.address.split(',').slice(1).join(',').trim() || o.order.address;

interface Props {
  seller: Seller;
  orders: SellerOrder[];
  onToast: (message: string) => void;
}

/** The seller's orders by location: state → district → town / PIN, with customer summary and downloads. */
export default function SellerRegional({ seller, orders, onToast }: Props) {
  const located = useMemo(
    () => orders.map(o => ({ o, state: stateFor(o.order.state, o.order.pincode), district: districtFor(o.order.state, o.order.pincode, o.order.city) })),
    [orders],
  );
  const stateCounts = located.reduce((m, x) => m.set(x.state, (m.get(x.state) ?? 0) + 1), new Map<string, number>());
  const unknownCount = stateCounts.get('Unknown') ?? 0;
  const topState = Array.from(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Odisha';

  const [state, setState] = useState(topState);
  const [district, setDistrict] = useState('all');
  const [area, setArea] = useState('all'); // town, or pin:<pincode>
  const [period, setPeriod] = useState<Period>('all');
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [view, setView] = useState<View>('orders');
  const [page, setPage] = useState(0);
  const reset = () => setPage(0);

  // Everything except the location filters below state
  const base = located.filter(({ o, state: st }) =>
    st === state && inPeriod(o.order.created_at, period) && (status === 'all' || o.order.status === status));
  const districtCounts = Array.from(base.reduce((m, x) => m.set(x.district, (m.get(x.district) ?? 0) + 1), new Map<string, number>()))
    .sort((a, b) => a[0].localeCompare(b[0]));
  const inDistrict = base.filter(x => district === 'all' || x.district === district);
  const towns = Array.from(new Set(inDistrict.map(x => x.o.order.city))).sort();
  const pincodes = Array.from(new Set(inDistrict.map(x => x.o.order.pincode))).sort();
  const rows = inDistrict
    .filter(x => area === 'all' || (area.startsWith('pin:') ? x.o.order.pincode === area.slice(4) : x.o.order.city === area))
    .map(x => x.o);

  // Tiles: cancelled and refunded orders are listed but not counted in sales
  const live = rows.filter(counts);
  const sales = live.reduce((a, o) => a + o.gross, 0);
  const net = live.reduce((a, o) => a + o.net, 0);
  const customers = new Set(rows.map(o => o.order.phone)).size;
  const delivered = live.filter(o => o.order.status === 'delivered').length;

  // Customer summary: one row per customer
  const customerRows = useMemo(() => {
    const m = new Map<string, { key: string; name: string; place: string; orders: number; spent: number; last: string; products: Map<string, number> }>();
    rows.forEach(o => {
      const key = o.order.phone;
      const c = m.get(key) ?? { key, name: o.order.customer_name, place: `${village(o)}, ${o.order.city} ${o.order.pincode}`, orders: 0, spent: 0, last: o.order.created_at, products: new Map() };
      c.orders++;
      if (counts(o)) c.spent += o.gross;
      if (o.order.created_at > c.last) c.last = o.order.created_at;
      o.items.forEach(i => c.products.set(i.product_name, (c.products.get(i.product_name) ?? 0) + i.quantity));
      m.set(key, c);
    });
    return Array.from(m.values())
      .map(c => ({ ...c, top: Array.from(c.products).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—' }))
      .sort((a, b) => b.spent - a.spent);
  }, [rows]);

  const byDistrict = Array.from(base.filter(x => counts(x.o)).reduce((m, x) => m.set(x.district, (m.get(x.district) ?? 0) + x.o.gross), new Map<string, number>()))
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

  const areaLabel = [state, district === 'all' ? 'all districts' : district, area === 'all' ? null : area.startsWith('pin:') ? `PIN ${area.slice(4)}` : area]
    .filter(Boolean).join(' › ');
  const summary = `${rows.length} orders · sales ${rupees(sales)} · you get ${rupees(net)} · ${customers} customers · ${pct(delivered, live.length)}% delivered`;
  const fileArea = (district === 'all' ? state : district).toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const exportOrders = async (format: ExportFormat) => {
    if (rows.length === 0) { onToast('No orders in this area to export'); return; }
    try {
      await exportTable(format, {
        filename: `regional-orders-${fileArea}-${TODAY}`,
        title: `Orders · ${areaLabel}`,
        subtitle: `${seller.business} · ${PERIOD_LABEL[period]} · ${summary} · exported ${shortDate(TODAY)}`,
        columns: [
          { header: 'Order', width: 12 }, { header: 'Date', width: 10 }, { header: 'Customer', width: 18 }, { header: 'Village / address', width: 20 },
          { header: 'Town', width: 12 }, { header: 'District', width: 12 }, { header: 'PIN', width: 8 }, { header: 'My items', width: 28 },
          { header: 'Sale', width: 10, money: true }, { header: 'You get', width: 10, money: true }, { header: 'Status', width: 10 },
        ],
        rows: rows.map(o => [
          o.order.order_number, shortDate(o.order.created_at), o.order.customer_name, o.order.address, o.order.city,
          districtFor(o.order.state, o.order.pincode, o.order.city), o.order.pincode, itemsText(o), o.gross, o.net, ORDER_STATUS_LABEL[o.order.status],
        ]),
      });
      onToast(`Orders for ${district === 'all' ? state : district} exported to ${format === 'excel' ? 'Excel' : 'PDF'}`);
    } catch {
      onToast('Export failed. Please try again.');
    }
  };

  const exportCustomers = async (format: ExportFormat) => {
    if (customerRows.length === 0) { onToast('No customers in this area to export'); return; }
    try {
      await exportTable(format, {
        filename: `regional-customers-${fileArea}-${TODAY}`,
        title: `Customers · ${areaLabel}`,
        subtitle: `${seller.business} · ${PERIOD_LABEL[period]} · ${summary} · exported ${shortDate(TODAY)}`,
        columns: [
          { header: 'Customer', width: 20 }, { header: 'Village, town, PIN', width: 30 }, { header: 'Orders', width: 8 },
          { header: 'Bought from you', width: 14, money: true }, { header: 'Last order', width: 11 }, { header: 'Top product', width: 24 },
        ],
        rows: customerRows.map(c => [c.name, c.place, c.orders, c.spent, shortDate(c.last), c.top]),
      });
      onToast(`Customer summary exported to ${format === 'excel' ? 'Excel' : 'PDF'}`);
    } catch {
      onToast('Export failed. Please try again.');
    }
  };

  const list = view === 'orders' ? rows : customerRows;
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const slice = <T,>(xs: T[]) => xs.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <>
      <div className="region-toolbar">
        <div className="region-crumb">
          <MapPin size={16} className="region-pin" aria-hidden />
          <div className="pill-select">
            <select value={state} onChange={e => { setState(e.target.value); setDistrict('all'); setArea('all'); reset(); }} aria-label="State">
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
            <select value={district} onChange={e => { setDistrict(e.target.value); setArea('all'); reset(); }} aria-label={state === 'Odisha' ? 'District' : 'District / town'}>
              <option value="all">All districts ({base.length})</option>
              {districtCounts.map(([d, n]) => <option key={d} value={d}>{d} ({n})</option>)}
            </select>
          </div>
          <ChevronRight size={15} className="region-sep" aria-hidden />
          <div className="pill-select">
            <select value={area} onChange={e => { setArea(e.target.value); reset(); }} aria-label="Town or PIN">
              <option value="all">All towns</option>
              <optgroup label="Town">{towns.map(t => <option key={t} value={t}>{t}</option>)}</optgroup>
              <optgroup label="PIN code">{pincodes.map(p => <option key={p} value={`pin:${p}`}>{p}</option>)}</optgroup>
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
            <select value={status} onChange={e => { setStatus(e.target.value as OrderStatus | 'all'); reset(); }} aria-label="Status">
              <option value="all">All statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="region-kpis">
        <div className="stat-tile accent">
          <IndianRupee className="stat-icon" size={20} />
          <div className="num">{rupeesShort(sales)}</div>
          <div className="label">Sales</div>
        </div>
        <div className="stat-tile">
          <ShoppingCart className="stat-icon" size={20} />
          <div className="num">{rows.length}</div>
          <div className="label">Orders</div>
        </div>
        <div className="stat-tile">
          <Wallet className="stat-icon" size={20} />
          <div className="num">{rupeesShort(net)}</div>
          <div className="label">You get · after {seller.commissionPct}%</div>
        </div>
        <div className="stat-tile">
          <Users className="stat-icon" size={20} />
          <div className="num">{customers}</div>
          <div className="label">Customers</div>
        </div>
        <div className="stat-tile">
          <Receipt className="stat-icon" size={20} />
          <div className="num">{live.length ? rupees(Math.round(sales / live.length)) : '—'}</div>
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
          <div className="panel-head"><h2>Sales by district</h2><span className="panel-meta">{state} · click a bar to filter</span></div>
          {byDistrict.length === 0 ? <div className="loc">No sales from {state}{period === 'all' ? '' : ` in ${PERIOD_LABEL[period].toLowerCase()}`}.</div> : (
            <div className="col-chart">
              {byDistrict.map(([d, amt], i) => (
                <button
                  key={d}
                  className={`col ${district === d ? 'selected' : ''}`}
                  data-tip={`${d}: ${rupees(amt)}`}
                  aria-label={`${d}: ${rupees(amt)}`}
                  onClick={() => { setDistrict(district === d ? 'all' : d); setArea('all'); reset(); }}
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
          <div className="panel-head"><h2>My products here</h2><span className="panel-meta">{district === 'all' ? state : district}</span></div>
          {byProduct.length === 0 ? <div className="loc">No sales in this area.</div> : (
            <PieChart slices={byProduct} label={`Share of your sales by product in ${district === 'all' ? state : district}`} />
          )}
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>{areaLabel}</h2>
          <span className="panel-meta">{PERIOD_LABEL[period]}</span>
        </div>
        <div className="page-toolbar" style={{ marginBottom: 12 }}>
          <div className="filters">
            <button className={`filter-chip ${view === 'orders' ? 'active' : ''}`} onClick={() => { setView('orders'); reset(); }}>Orders ({rows.length})</button>
            <button className={`filter-chip ${view === 'customers' ? 'active' : ''}`} onClick={() => { setView('customers'); reset(); }}>By customer ({customerRows.length})</button>
          </div>
          <div className="toolbar-actions">
            <ExportMenu onExport={exportOrders} label="Download orders" />
            <ExportMenu onExport={exportCustomers} label="Download customers" />
          </div>
        </div>

        <div className="table-wrap">
          {view === 'orders' ? (
            <table>
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Village · town</th><th>My items</th><th className="num-col">Sale</th><th>Status</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={6} className="loc" style={{ textAlign: 'center', padding: 24 }}>{stateCounts.get(state) ? 'No orders in this area for these filters.' : `No orders from ${state} yet.`}</td></tr>}
                {slice(rows).map(o => (
                  <tr key={o.order.id}>
                    <td className="cust">{o.order.order_number}<div className="loc">{shortDate(o.order.created_at)}</div></td>
                    <td>{o.order.customer_name}</td>
                    <td>{village(o)}<div className="loc">{o.order.city} · {districtFor(o.order.state, o.order.pincode, o.order.city)} · {o.order.pincode}</div></td>
                    <td>{itemsText(o)}</td>
                    <td className="num-col">{rupees(o.gross)}<div className="loc">you get {rupees(o.net)}</div></td>
                    <td><span className={`chip ${ORDER_CHIP[o.order.status]}`}>{ORDER_STATUS_LABEL[o.order.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr><th>Customer</th><th>Village · town · PIN</th><th className="num-col">Orders</th><th className="num-col">Bought from you</th><th>Last order</th><th>Top product</th></tr>
              </thead>
              <tbody>
                {customerRows.length === 0 && <tr><td colSpan={6} className="loc" style={{ textAlign: 'center', padding: 24 }}>No customers in this area for these filters.</td></tr>}
                {slice(customerRows).map(c => (
                  <tr key={c.key}>
                    <td className="cust">{c.name}</td>
                    <td>{c.place}</td>
                    <td className="num-col">{c.orders}</td>
                    <td className="num-col strong">{rupees(c.spent)}</td>
                    <td>{shortDate(c.last)}</td>
                    <td>{c.top}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="pager">
          <span>{list.length} {view === 'orders' ? 'orders' : 'customers'}</span>
          {pages > 1 && (
            <div className="pager-btns">
              <button className="btn-secondary btn-small" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
              <button className="btn-secondary btn-small" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>Next</button>
            </div>
          )}
        </div>
      </div>

      <div className="panel-note">
        Orders don&apos;t store a district yet: for Odisha it&apos;s worked out from the PIN code (or town name); for other states the town is shown.
        Amounts are for your products only. Cancelled and refunded orders are listed but not counted in sales.
      </div>
    </>
  );
}
