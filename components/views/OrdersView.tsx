import React, { useMemo, useState } from 'react';
import { Phone, Printer, X } from 'lucide-react';
import {
  TODAY,
  TELECALLERS,
  SalesOrder,
  OrderStatus,
  PaymentStatus,
  OrderSource,
} from '../../data/managerDashboard';
import { MONTH, ORDER_CHIP, daysBefore, nowStamp, rupees, rupeesShort, shortDateTime } from '../../lib/format';
import { downloadCsv } from '../../lib/csv';

interface OrdersViewProps {
  orders: SalesOrder[];
  onOrdersChange: React.Dispatch<React.SetStateAction<SalesOrder[]>>;
  onOpenNewOrderModal: () => void;
  onToast: (message: string) => void;
}

const STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const FLOW: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];
const NEXT_LABEL: Partial<Record<OrderStatus, string>> = { pending: 'Confirm', confirmed: 'Ship', shipped: 'Deliver' };
const PAYMENT_CHIP: Record<PaymentStatus, string> = { paid: 'delivered', unpaid: 'pending', refunded: 'muted' };
const PAGE_SIZE = 15;

type Alert = 'stale-pending' | 'unpaid-delivered' | 'slow-shipping';
type DateRange = 'today' | '7d' | 'month' | 'all';

const callerName = (id: number | null) => (id === null ? 'Manager' : TELECALLERS.find(t => t.id === id)?.name ?? '—');
const nextStatus = (s: OrderStatus): OrderStatus | null => {
  const i = FLOW.indexOf(s);
  return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : null;
};
const lastChange = (o: SalesOrder, s: OrderStatus) => [...o.status_history].reverse().find(h => h.status === s)?.at ?? o.created_at;

const ALERTS: Record<Alert, { label: string; test: (o: SalesOrder) => boolean }> = {
  'stale-pending': { label: 'pending over 48 hours', test: o => o.status === 'pending' && daysBefore(o.created_at) >= 2 },
  'unpaid-delivered': { label: 'delivered but unpaid', test: o => o.status === 'delivered' && o.payment_status === 'unpaid' },
  'slow-shipping': { label: 'shipped over 7 days ago', test: o => o.status === 'shipped' && daysBefore(lastChange(o, 'shipped')) > 7 },
};

const itemsSummary = (o: SalesOrder) => ({
  first: o.items[0]?.product_name ?? '—',
  more: o.items.length - 1,
  qty: o.items.reduce((a, it) => a + it.quantity, 0),
});

function exportOrders(rows: SalesOrder[]) {
  downloadCsv(
    `orders-${TODAY}.csv`,
    ['Order', 'Date', 'Source', 'Telecaller', 'Customer', 'Phone', 'City', 'Items', 'Total', 'Payment', 'Method', 'Status'],
    rows.map(o => [
      o.order_number, o.created_at.replace('T', ' '), o.source, o.source === 'telecaller' ? callerName(o.caller_id) : '',
      o.customer_name, o.phone, o.city, o.items.map(it => `${it.product_name} x${it.quantity}`).join('; '),
      o.total, o.payment_status, o.payment_method, o.status,
    ]),
  );
}

function printInvoice(o: SalesOrder) {
  const win = window.open('', '_blank', 'width=720,height=900');
  if (!win) return;
  const rows = o.items
    .map(it => `<tr><td>${it.product_name}</td><td>${it.quantity}</td><td>${rupees(it.price)}</td><td>${rupees(it.price * it.quantity)}</td></tr>`)
    .join('');
  win.document.write(`<!doctype html><title>Invoice ${o.order_number}</title>
<style>body{font-family:system-ui,sans-serif;padding:32px;color:#2B2A22}h1{font-size:22px;margin:0}table{width:100%;border-collapse:collapse;margin-top:18px}
th,td{text-align:left;padding:8px;border-bottom:1px solid #ddd;font-size:14px}.r{text-align:right}.muted{color:#6B6A5C;font-size:13px}</style>
<h1>Maniksthu Agri Network</h1><p class="muted">Invoice for order ${o.order_number} · ${shortDateTime(o.created_at)}</p>
<p><strong>${o.customer_name}</strong><br>${o.address}, ${o.city}, ${o.state} ${o.pincode}<br>${o.phone}</p>
<table><thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody>
<tfoot><tr><th colspan="3">Total</th><th>${rupees(o.total)}</th></tr></tfoot></table>
<p class="muted">Payment: ${o.payment_method} · ${o.payment_status}</p>`);
  win.document.close();
  win.focus();
  win.print();
}

export default function OrdersView({ orders, onOrdersChange, onOpenNewOrderModal, onToast }: OrdersViewProps) {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<OrderSource | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [alert, setAlert] = useState<Alert | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [openId, setOpenId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  // Summary tiles: this month, all sources
  const month = orders.filter(o => o.created_at.startsWith(MONTH));
  const tiles = {
    count: month.length,
    today: month.filter(o => o.created_at.startsWith(TODAY)).length,
    revenue: month.filter(o => o.payment_status === 'paid').reduce((a, o) => a + o.total, 0),
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    toCollect: orders.filter(o => o.payment_status === 'unpaid' && o.status !== 'cancelled'),
    cancelled: month.filter(o => o.status === 'cancelled').length,
    refunded: month.filter(o => o.payment_status === 'refunded').length,
  };

  // Everything except the status tab, so the tab counts reflect the other filters
  const baseFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(o => {
      if (alert) return ALERTS[alert].test(o);
      if (sourceFilter !== 'all' && o.source !== sourceFilter) return false;
      if (paymentFilter !== 'all' && o.payment_status !== paymentFilter) return false;
      const age = daysBefore(o.created_at);
      if (dateRange === 'today' && age !== 0) return false;
      if (dateRange === '7d' && age > 6) return false;
      if (dateRange === 'month' && !o.created_at.startsWith(MONTH)) return false;
      if (q && ![o.order_number, o.customer_name, o.phone, o.city].some(v => v.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [orders, alert, sourceFilter, paymentFilter, dateRange, query]);

  const filtered = statusFilter === 'all' ? baseFiltered : baseFiltered.filter(o => o.status === statusFilter);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const open = orders.find(o => o.id === openId) ?? null;

  const resetPage = () => { setPage(0); setSelected(new Set()); };

  // ---- Updates -----------------------------------------------------------------------------
  /** Applies `change` to each order in `ids`; `change` returns null when the action doesn't apply. */
  const update = (ids: number[], change: (o: SalesOrder) => SalesOrder | null, message: string) => {
    let changed = 0;
    const next = orders.map(o => {
      if (!ids.includes(o.id)) return o;
      const updated = change(o);
      if (updated) changed++;
      return updated ?? o;
    });
    if (changed === 0) {
      onToast(ids.length === 1 ? 'That action doesn’t apply to this order' : 'None of the selected orders are at the right stage');
      return;
    }
    onOrdersChange(next);
    const skipped = ids.length - changed;
    onToast(message.replace('{n}', String(changed)) + (skipped > 0 ? ` · ${skipped} skipped (wrong stage)` : ''));
  };

  const setStatus = (ids: number[], status: OrderStatus) =>
    update(ids, o => {
      const ok = status === 'cancelled' ? o.status !== 'delivered' && o.status !== 'cancelled' : nextStatus(o.status) === status;
      return ok ? { ...o, status, status_history: [...o.status_history, { status, at: nowStamp() }] } : null;
    }, ids.length === 1 ? `Order marked ${status}` : `{n} orders marked ${status}`);

  const setPayment = (ids: number[], payment_status: PaymentStatus) =>
    update(ids, o => {
      const ok = payment_status === 'paid'
        ? o.payment_status === 'unpaid' && o.status !== 'cancelled'
        : o.payment_status === 'paid' && o.status === 'cancelled';
      return ok ? { ...o, payment_status } : null;
    }, ids.length === 1 ? `Payment marked ${payment_status}` : `{n} orders marked ${payment_status}`);

  const saveNote = (id: number) => {
    onOrdersChange(prev => prev.map(o => (o.id === id ? { ...o, notes: noteDraft.trim() || null } : o)));
    onToast('Note saved');
  };

  const openOrder = (o: SalesOrder) => { setOpenId(o.id); setNoteDraft(o.notes ?? ''); };

  // ---- Selection ---------------------------------------------------------------------------
  const allOnPageSelected = pageRows.length > 0 && pageRows.every(o => selected.has(o.id));
  const toggle = (id: number) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const togglePage = () => setSelected(prev => {
    const next = new Set(prev);
    pageRows.forEach(o => (allOnPageSelected ? next.delete(o.id) : next.add(o.id)));
    return next;
  });
  const selectedIds = Array.from(selected);

  return (
    <>
      {/* 1. Summary tiles */}
      <div className="scoreboard">
        <div className="score">
          <div className="num">{tiles.count} <small>+{tiles.today} today</small></div>
          <div className="label">Orders · this month</div>
        </div>
        <div className="score">
          <div className="num">{rupeesShort(tiles.revenue)}</div>
          <div className="label">Paid revenue · this month</div>
        </div>
        <div className="score">
          <div className="num">{tiles.pending}</div>
          <div className="label">Waiting to confirm</div>
        </div>
        <div className="score">
          <div className="num">{tiles.shipped}</div>
          <div className="label">Out for delivery</div>
        </div>
        <div className="score">
          <div className="num">{rupeesShort(tiles.toCollect.reduce((a, o) => a + o.total, 0))} <small className="warn">{tiles.toCollect.length} orders</small></div>
          <div className="label">Unpaid · to collect</div>
        </div>
        <div className="score">
          <div className="num">{tiles.cancelled} <small className="warn">{tiles.refunded} refunded</small></div>
          <div className="label">Cancelled · this month</div>
        </div>
      </div>

      {/* 2. Needs-action strip */}
      <div className="alert-strip">
        <span className="alert-strip-label">Needs action</span>
        {(Object.keys(ALERTS) as Alert[]).map(key => {
          const n = orders.filter(ALERTS[key].test).length;
          return (
            <button
              key={key}
              className={`alert-pill ${alert === key ? 'active' : ''} ${n === 0 ? 'zero' : ''}`}
              onClick={() => { setAlert(alert === key ? null : key); setStatusFilter('all'); resetPage(); }}
            >
              <strong>{n}</strong> {ALERTS[key].label}
            </button>
          );
        })}
        {alert && <button className="link-btn clear-alert" onClick={() => { setAlert(null); resetPage(); }}>Show all orders</button>}
      </div>

      {/* 3. Filters */}
      <div className="page-toolbar">
        <div className="filters">
          {(['all', ...STATUSES] as const).map(s => (
            <button
              key={s}
              className={`filter-chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => { setStatusFilter(s); resetPage(); }}
            >
              <span style={{ textTransform: 'capitalize' }}>{s}</span> ({s === 'all' ? baseFiltered.length : baseFiltered.filter(o => o.status === s).length})
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          <button className="btn-secondary" onClick={() => exportOrders(filtered)}>Export CSV</button>
          <button className="btn-primary" onClick={onOpenNewOrderModal}>+ New Order</button>
        </div>
      </div>

      <div className="filter-row">
        <input
          className="filter-input"
          type="search"
          placeholder="Search order no., customer, phone, city…"
          value={query}
          onChange={e => { setQuery(e.target.value); resetPage(); }}
        />
        <select className="filter-select" value={sourceFilter} onChange={e => { setSourceFilter(e.target.value as OrderSource | 'all'); resetPage(); }} aria-label="Source">
          <option value="all">All sources</option>
          <option value="website">Website</option>
          <option value="telecaller">Telecaller</option>
        </select>
        <select className="filter-select" value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value as PaymentStatus | 'all'); resetPage(); }} aria-label="Payment">
          <option value="all">All payments</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
        </select>
        <select className="filter-select" value={dateRange} onChange={e => { setDateRange(e.target.value as DateRange); resetPage(); }} aria-label="Date range">
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="month">This month</option>
          <option value="all">All time</option>
        </select>
        {alert && <span className="filter-note">Other filters are paused while a “Needs action” filter is on.</span>}
      </div>

      {/* 4. Bulk actions */}
      {selected.size > 0 && (
        <div className="bulk-bar">
          <strong>{selected.size} selected</strong>
          <button className="btn-secondary btn-small" onClick={() => setStatus(selectedIds, 'confirmed')}>Confirm</button>
          <button className="btn-secondary btn-small" onClick={() => setStatus(selectedIds, 'shipped')}>Mark shipped</button>
          <button className="btn-secondary btn-small" onClick={() => setStatus(selectedIds, 'delivered')}>Mark delivered</button>
          <button className="btn-secondary btn-small" onClick={() => setPayment(selectedIds, 'paid')}>Mark paid</button>
          <button className="btn-secondary btn-small" onClick={() => exportOrders(orders.filter(o => selected.has(o.id)))}>Export CSV</button>
          <button className="link-btn" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {/* 5. Orders table */}
      <div className="panel">
        <div className="table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={allOnPageSelected} onChange={togglePage} aria-label="Select all on this page" /></th>
                <th>Order</th>
                <th>Source</th>
                <th>Customer</th>
                <th>Items</th>
                <th className="num-col">Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th className="num-col">Age</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '28px 0' }}>
                    No orders match these filters.
                  </td>
                </tr>
              ) : pageRows.map(o => {
                const it = itemsSummary(o);
                const age = daysBefore(o.created_at);
                const next = nextStatus(o.status);
                return (
                  <tr key={o.id} className={selected.has(o.id) ? 'row-selected' : undefined}>
                    <td><input type="checkbox" checked={selected.has(o.id)} onChange={() => toggle(o.id)} aria-label={`Select ${o.order_number}`} /></td>
                    <td>
                      <button className="link-btn order-no" onClick={() => openOrder(o)}>{o.order_number}</button>
                      <div className="loc">{shortDateTime(o.created_at)}</div>
                    </td>
                    <td>
                      <span className={`source-tag ${o.source}`}>{o.source === 'website' ? 'Website' : 'Telecaller'}</span>
                      {o.source === 'telecaller' && <div className="loc">{callerName(o.caller_id)}</div>}
                    </td>
                    <td className="cust">
                      {o.customer_name}
                      <div className="loc">{o.phone} · {o.city}</div>
                    </td>
                    <td>
                      {it.first}{it.more > 0 && <span className="more-items"> +{it.more} more</span>}
                      <div className="loc">{it.qty} {it.qty === 1 ? 'unit' : 'units'}</div>
                    </td>
                    <td className="num-col strong">{rupees(o.total)}</td>
                    <td>
                      <span className={`chip ${PAYMENT_CHIP[o.payment_status]}`}>{o.payment_status}</span>
                      <div className="loc">{o.payment_method}</div>
                    </td>
                    <td><span className={`chip ${ORDER_CHIP[o.status]}`}>{o.status}</span></td>
                    <td className={`num-col ${o.status === 'pending' && age >= 2 ? 'text-warn' : ''}`}>{age === 0 ? 'Today' : `${age}d`}</td>
                    <td>
                      <div className="row-actions">
                        <button className="kanban-btn" onClick={() => openOrder(o)}>View</button>
                        {next && <button className="kanban-btn" onClick={() => setStatus([o.id], next)}>{NEXT_LABEL[o.status]}</button>}
                        {o.payment_status === 'unpaid' && o.status !== 'cancelled' && (
                          <button className="kanban-btn" onClick={() => setPayment([o.id], 'paid')}>Paid</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <span>
            {filtered.length === 0 ? '0 orders' : `${safePage * PAGE_SIZE + 1}–${Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)} of ${filtered.length} orders`}
            {' · '}{rupees(filtered.reduce((a, o) => a + o.total, 0))}
          </span>
          <div className="pager-btns">
            <button className="btn-secondary btn-small" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
            <button className="btn-secondary btn-small" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>Next</button>
          </div>
        </div>
      </div>

      <div className="panel-note">
        Sample data. The backend doesn’t store yet: order source, telecaller on website orders, status change dates, courier and tracking number,
        delivery address per order, discounts and shipping charges, and cancellation reason.
      </div>

      {/* 6. Order detail drawer */}
      {open && (
        <>
          <div className="drawer-overlay" onClick={() => setOpenId(null)} />
          <aside className="order-drawer" role="dialog" aria-label={`Order ${open.order_number}`}>
            <div className="drawer-head">
              <div>
                <h3>{open.order_number}</h3>
                <div className="loc">
                  {shortDateTime(open.created_at)} · <span className={`source-tag ${open.source}`}>{open.source === 'website' ? 'Website' : 'Telecaller'}</span>
                  {open.source === 'telecaller' && <> · {callerName(open.caller_id)}</>}
                </div>
              </div>
              <button className="modal-close" onClick={() => setOpenId(null)} aria-label="Close"><X size={20} /></button>
            </div>

            <div className="drawer-body">
              <section className="od-section">
                <div className="od-label">Customer</div>
                <div className="od-customer">
                  <div>
                    <div className="strong">{open.customer_name}</div>
                    <div className="loc">{open.address}, {open.city}, {open.state} {open.pincode}</div>
                  </div>
                  <a className="call-btn" href={`tel:+91${open.phone}`}><Phone size={13} /> {open.phone}</a>
                </div>
              </section>

              <section className="od-section">
                <div className="od-label">Items</div>
                <table>
                  <thead>
                    <tr><th>Product</th><th className="num-col">Qty</th><th className="num-col">Price</th><th className="num-col">Amount</th></tr>
                  </thead>
                  <tbody>
                    {open.items.map(item => (
                      <tr key={item.product_name}>
                        <td>{item.product_name}</td>
                        <td className="num-col">{item.quantity}</td>
                        <td className="num-col">{rupees(item.price)}</td>
                        <td className="num-col">{rupees(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} className="strong">Total</td>
                      <td className="num-col strong">{rupees(open.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <section className="od-section od-row">
                <div>
                  <div className="od-label">Payment</div>
                  <span className={`chip ${PAYMENT_CHIP[open.payment_status]}`}>{open.payment_status}</span> <span className="loc">{open.payment_method}</span>
                </div>
                <div>
                  <div className="od-label">Status</div>
                  <span className={`chip ${ORDER_CHIP[open.status]}`}>{open.status}</span>
                </div>
              </section>

              <section className="od-section">
                <div className="od-label">Status history</div>
                <ul className="track-timeline">
                  {(open.status === 'cancelled' ? open.status_history : FLOW.map(s => ({
                    status: s,
                    at: open.status_history.find(h => h.status === s)?.at ?? '',
                  }))).map(h => (
                    <li key={h.status} className={h.at ? '' : 'pending'}>
                      <div className="tt-title" style={{ textTransform: 'capitalize' }}>{h.status === 'pending' ? 'Placed' : h.status}</div>
                      <div className="tt-time">{h.at ? shortDateTime(h.at) : 'Not yet'}</div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="od-section">
                <div className="od-label">Notes</div>
                <textarea
                  className="od-notes"
                  rows={3}
                  placeholder="Add a note for the team…"
                  value={noteDraft}
                  onChange={e => setNoteDraft(e.target.value)}
                />
                {noteDraft !== (open.notes ?? '') && (
                  <button className="btn-secondary btn-small" onClick={() => saveNote(open.id)}>Save note</button>
                )}
              </section>
            </div>

            <div className="drawer-actions">
              {nextStatus(open.status) && (
                <button className="btn-primary" onClick={() => setStatus([open.id], nextStatus(open.status)!)}>
                  {open.status === 'pending' ? 'Confirm order' : open.status === 'confirmed' ? 'Mark shipped' : 'Mark delivered'}
                </button>
              )}
              {open.payment_status === 'unpaid' && open.status !== 'cancelled' && (
                <button className="btn-secondary" onClick={() => setPayment([open.id], 'paid')}>Mark paid</button>
              )}
              {open.status === 'cancelled' && open.payment_status === 'paid' && (
                <button className="btn-secondary" onClick={() => setPayment([open.id], 'refunded')}>Refund</button>
              )}
              <button className="btn-secondary" onClick={() => printInvoice(open)}><Printer size={14} /> Invoice</button>
              {open.status !== 'delivered' && open.status !== 'cancelled' && (
                <button className="btn-secondary danger" onClick={() => setStatus([open.id], 'cancelled')}>Cancel order</button>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
