import React, { useMemo, useState } from 'react';
import { Copy, X } from 'lucide-react';
import { SalesOrder, TELECALLERS, TODAY } from '../../data/managerDashboard';
import { Complaint } from '../../data/complaints';
import { daysBefore, nowStamp, rupees, shortDate, shortDateTime } from '../../lib/format';
import { ExportFormat, exportTable } from '../../lib/export';
import ExportMenu from '../ExportMenu';
import { EmptyRow } from './shared';
import { STATUS_LABEL } from './complaintsUtil';
import {
  STAGE_CHIP, STAGE_FLOW, STAGE_LABEL, TrackStage, Tracking, customerUpdate, stageIndex, trackingFor,
} from './orderTracking';

type Source = 'all' | 'telecaller' | 'website';
const PAGE_SIZE = 20;

const soldBy = (o: SalesOrder) => (o.caller_id === null ? 'Website' : TELECALLERS.find(t => t.id === o.caller_id)?.name ?? '—');
const lastAt = (t: Tracking, stage: TrackStage) => t.events.find(e => e.stage === stage)?.at ?? null;

/** "Needs action" shortcuts. */
const ATTENTION: { key: string; label: string; test: (o: SalesOrder, t: Tracking) => boolean }[] = [
  { key: 'late', label: 'Late with courier', test: (_, t) => t.delayed },
  { key: 'unconfirmed', label: 'Not confirmed 2+ days', test: (o, t) => t.stage === 'placed' && daysBefore(o.created_at) >= 2 },
  { key: 'unshipped', label: 'Confirmed, not shipped 2+ days', test: (_, t) => (t.stage === 'confirmed' || t.stage === 'packed') && daysBefore(lastAt(t, 'confirmed') ?? TODAY) >= 2 },
  { key: 'cash', label: 'Delivered, cash not collected', test: (o, t) => t.stage === 'delivered' && o.payment_method === 'COD' && o.payment_status === 'unpaid' },
];

/** Six dots showing how far the order has got. */
function TrackBar({ t }: { t: Tracking }) {
  const at = stageIndex(t.stage);
  if (t.stage === 'cancelled') return <div className="track-bar cancelled" aria-label="Cancelled"><span /></div>;
  return (
    <div className={`track-bar ${t.delayed ? 'late' : ''}`} aria-label={`${STAGE_LABEL[t.stage]}, step ${at + 1} of ${STAGE_FLOW.length}`}>
      {STAGE_FLOW.map((s, i) => <span key={s} className={i < at ? 'done' : i === at ? 'now' : ''} title={STAGE_LABEL[s]} />)}
    </div>
  );
}

interface Props {
  orders: SalesOrder[];
  complaints: Complaint[];
  searchQuery: string;
  onToast: (message: string) => void;
}

/** Orders & tracking: what each customer bought and where the parcel is. Read-only for the head. */
export default function TeamOrders({ orders, complaints, searchQuery, onToast }: Props) {
  const hour = nowStamp().slice(0, 13); // recompute at most once an hour
  const tracked = useMemo(() => {
    const now = nowStamp();
    return orders.map(o => ({ o, t: trackingFor(o, now) }));
  }, [orders, hour]);

  const [stage, setStage] = useState<TrackStage | 'all'>('all');
  const [attention, setAttention] = useState<string | null>(null);
  const [source, setSource] = useState<Source>('all');
  const [caller, setCaller] = useState<string>('all');
  const [product, setProduct] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<number | null>(null);

  const products = useMemo(() => Array.from(new Set(orders.flatMap(o => o.items.map(i => i.product_name)))).sort(), [orders]);

  const q = searchQuery.trim().toLowerCase();
  const scoped = tracked.filter(({ o, t }) =>
    (source === 'all' || o.source === source) &&
    (caller === 'all' || o.caller_id === Number(caller)) &&
    (product === 'all' || o.items.some(i => i.product_name === product)) &&
    (!q || [o.order_number, o.customer_name, o.phone, o.city, t.awb ?? ''].some(v => v.toLowerCase().includes(q))),
  );
  const attn = ATTENTION.find(a => a.key === attention);
  const rows = scoped.filter(({ o, t }) => (attn ? attn.test(o, t) : stage === 'all' || t.stage === stage));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const stageCount = (s: TrackStage) => scoped.filter(x => x.t.stage === s).length;

  const pickStage = (s: TrackStage | 'all') => { setStage(stage === s ? 'all' : s); setAttention(null); setPage(0); };

  // Tiles
  const deliveredWeek = tracked.filter(({ t }) => t.stage === 'delivered' && daysBefore(lastAt(t, 'delivered') ?? '2000-01-01') < 7).length;
  const toPack = tracked.filter(({ t }) => t.stage === 'confirmed').length;
  const inTransit = tracked.filter(({ t }) => t.stage === 'shipped').length;
  const ofd = tracked.filter(({ t }) => t.stage === 'out_for_delivery').length;
  const late = tracked.filter(({ t }) => t.delayed).length;
  const placedToday = tracked.filter(({ o }) => o.created_at.startsWith(TODAY)).length;

  const runExport = async (format: ExportFormat) => {
    if (rows.length === 0) { onToast('No orders to export'); return; }
    try {
      await exportTable(format, {
        filename: `order-tracking-${TODAY}`,
        title: `Order tracking · ${attn ? attn.label : stage === 'all' ? 'All orders' : STAGE_LABEL[stage]}`,
        subtitle: `${rows.length} orders · exported ${shortDate(TODAY)}`,
        columns: [
          { header: 'Order', width: 12 }, { header: 'Date', width: 10 }, { header: 'Customer', width: 18 }, { header: 'Phone', width: 12 },
          { header: 'City', width: 12 }, { header: 'Products', width: 28 }, { header: 'Sold by', width: 14 }, { header: 'Amount', width: 10, money: true },
          { header: 'Payment', width: 12 }, { header: 'Tracking', width: 14 }, { header: 'Courier', width: 11 }, { header: 'AWB', width: 15 },
          { header: 'Expected', width: 10 },
        ],
        rows: rows.map(({ o, t }) => [
          o.order_number, shortDate(o.created_at), o.customer_name, o.phone, o.city,
          o.items.map(i => `${i.product_name} × ${i.quantity}`).join(', '), soldBy(o), o.total,
          `${o.payment_method} · ${o.payment_status}`, `${STAGE_LABEL[t.stage]}${t.delayed ? ' (late)' : ''}`,
          t.courier ?? '', t.awb ?? '', t.expected_at ? shortDate(t.expected_at) : '',
        ]),
      });
      onToast(`Orders exported to ${format === 'excel' ? 'Excel' : 'PDF'}`);
    } catch {
      onToast('Export failed. Please try again.');
    }
  };

  const opened = tracked.find(x => x.o.id === openId);

  return (
    <>
      <div className="scoreboard">
        <div className="score"><div className="num">{placedToday}</div><div className="label">Placed today</div></div>
        <button className="score score-btn" onClick={() => pickStage('confirmed')}><div className="num">{toPack}</div><div className="label">To pack</div></button>
        <button className="score score-btn" onClick={() => pickStage('shipped')}><div className="num">{inTransit}</div><div className="label">In transit</div></button>
        <button className="score score-btn" onClick={() => pickStage('out_for_delivery')}><div className="num">{ofd}</div><div className="label">Out for delivery</div></button>
        <div className="score"><div className="num">{deliveredWeek}</div><div className="label">Delivered this week</div></div>
        <button className="score score-btn" onClick={() => { setAttention('late'); setPage(0); }}><div className={`num ${late ? 'text-warn' : ''}`}>{late}</div><div className="label">Late with courier</div></button>
      </div>

      <div className="panel">
        <div className="stage-flow" role="tablist" aria-label="Tracking stage">
          {STAGE_FLOW.map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <span className="stage-arrow" aria-hidden>›</span>}
              <button role="tab" aria-selected={!attn && stage === s} className={`stage-step ${!attn && stage === s ? 'active' : ''}`} onClick={() => pickStage(s)}>
                <span className="stage-num">{stageCount(s)}</span>
                <span className="stage-name">{STAGE_LABEL[s]}</span>
              </button>
            </React.Fragment>
          ))}
          <button role="tab" aria-selected={!attn && stage === 'cancelled'} className={`stage-step muted ${!attn && stage === 'cancelled' ? 'active' : ''}`} onClick={() => pickStage('cancelled')}>
            <span className="stage-num">{stageCount('cancelled')}</span>
            <span className="stage-name">Cancelled</span>
          </button>
        </div>
      </div>

      <div className="alert-strip">
        <span className="alert-strip-label">Needs action</span>
        {ATTENTION.map(a => {
          const n = scoped.filter(x => a.test(x.o, x.t)).length;
          return (
            <button key={a.key} className={`alert-pill ${attention === a.key ? 'active' : ''} ${n === 0 ? 'zero' : ''}`} onClick={() => { setAttention(attention === a.key ? null : a.key); setPage(0); }}>
              {a.label} · {n}
            </button>
          );
        })}
      </div>

      <div className="page-toolbar">
        <div className="filters">
          {(['all', 'telecaller', 'website'] as Source[]).map(s => (
            <button key={s} className={`filter-chip ${source === s ? 'active' : ''}`} onClick={() => { setSource(s); setPage(0); }}>
              {s === 'all' ? 'All orders' : s === 'telecaller' ? 'Team sales' : 'Website'}
            </button>
          ))}
        </div>
        <div className="toolbar-actions">
          {(stage !== 'all' || attn) && <button className="link-btn clear-alert" onClick={() => { setStage('all'); setAttention(null); }}>Show all stages</button>}
          <ExportMenu onExport={runExport} />
        </div>
      </div>

      <div className="filter-row">
        <select className="filter-select" value={caller} onChange={e => { setCaller(e.target.value); setPage(0); }} aria-label="Sold by">
          <option value="all">Any telecaller</option>
          {TELECALLERS.map(t => <option key={t.id} value={t.id}>{t.name}{t.is_active ? '' : ' (inactive)'}</option>)}
        </select>
        <select className="filter-select" value={product} onChange={e => { setProduct(e.target.value); setPage(0); }} aria-label="Product">
          <option value="all">All products</option>
          {products.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="orders-table">
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Products</th><th>Sold by</th><th className="num-col">Amount</th><th>Tracking</th><th>Courier</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow cols={7} text="No orders here." />}
              {rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE).map(({ o, t }) => (
                <tr key={o.id} className="clickable" onClick={() => setOpenId(o.id)}>
                  <td className="order-no">{o.order_number}<div className="loc">{shortDate(o.created_at)}</div></td>
                  <td className="cust">{o.customer_name}<div className="loc">{o.city} · {o.phone}</div></td>
                  <td>
                    {o.items[0].product_name} × {o.items[0].quantity}
                    {o.items.length > 1 && <div className="loc">+ {o.items.length - 1} more</div>}
                  </td>
                  <td>{soldBy(o)}</td>
                  <td className="num-col">{rupees(o.total)}<div className="loc">{o.payment_method} · {o.payment_status}</div></td>
                  <td>
                    <TrackBar t={t} />
                    <div className="track-caption">
                      <span className={`chip ${t.delayed ? 'pending' : STAGE_CHIP[t.stage]}`}>{STAGE_LABEL[t.stage]}{t.delayed ? ' · late' : ''}</span>
                      {t.expected_at && <span className={`loc ${t.delayed ? 'text-warn' : ''}`}>{t.expectedIsEstimate ? 'est. ' : 'by '}{shortDate(t.expected_at)}</span>}
                    </div>
                  </td>
                  <td>{t.courier ? <>{t.courier}<div className="loc">{t.awb}</div></> : <span className="loc">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="pager">
            <button className="kanban-btn" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
            <span className="loc">Page {safePage + 1} of {pages} · {rows.length} orders</span>
            <button className="kanban-btn" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>Next</button>
          </div>
        )}
        <div className="panel-note">Packing, courier and AWB details are sample data: the backend stores only the order status so far.</div>
      </div>

      {opened && (
        <OrderTrackDrawer
          order={opened.o}
          tracking={opened.t}
          complaints={complaints.filter(c => c.order_number === opened.o.order_number)}
          onClose={() => setOpenId(null)}
          onToast={onToast}
        />
      )}
    </>
  );
}

function OrderTrackDrawer({ order: o, tracking: t, complaints, onClose, onToast }: {
  order: SalesOrder;
  tracking: Tracking;
  complaints: Complaint[];
  onClose: () => void;
  onToast: (m: string) => void;
}) {
  const reached = stageIndex(t.stage);
  const copyUpdate = async () => {
    try {
      await navigator.clipboard.writeText(customerUpdate(o, t));
      onToast('Update copied: paste it into WhatsApp or SMS');
    } catch {
      onToast('Could not copy. Please try again.');
    }
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="order-drawer" role="dialog" aria-label={`Order ${o.order_number}`}>
        <div className="drawer-head">
          <div>
            <h3>{o.order_number}</h3>
            <div className="loc">
              Placed {shortDateTime(o.created_at)} · {soldBy(o)} ·{' '}
              <span className={`chip ${t.delayed ? 'pending' : STAGE_CHIP[t.stage]}`}>{STAGE_LABEL[t.stage]}{t.delayed ? ' · late' : ''}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        <div className="drawer-body">
          <section className="od-section">
            <div className="od-label">Customer</div>
            <div className="od-customer">
              <div>
                <strong>{o.customer_name}</strong>
                <div className="loc">{o.address}, {o.city}, {o.state} {o.pincode}</div>
              </div>
              <a className="call-btn" href={`tel:${o.phone}`}>{o.phone}</a>
            </div>
          </section>

          <section className="od-section">
            <div className="od-label">Products</div>
            <ul className="attn-list">
              {o.items.map(i => (
                <li key={i.product_name}>
                  <div><div className="name">{i.product_name}</div><div className="action">{i.quantity} × {rupees(i.price)}</div></div>
                  <div className="attn-side"><span className="strong">{rupees(i.price * i.quantity)}</span></div>
                </li>
              ))}
            </ul>
            <div className="od-customer" style={{ marginTop: 6 }}>
              <span className="loc">{o.payment_method} · {o.payment_status}</span>
              <strong>{rupees(o.total)}</strong>
            </div>
          </section>

          {t.stage !== 'cancelled' && (
            <section className="od-section">
              <div className="od-label">Shipment</div>
              <div className="od-row">
                <div><div className="loc">Courier</div>{t.courier ?? 'Not shipped yet'}{t.awb && <div className="loc">AWB {t.awb}</div>}</div>
                <div>
                  <div className="loc">{t.stage === 'delivered' ? 'Delivered' : t.expectedIsEstimate ? 'Estimated delivery' : 'Expected delivery'}</div>
                  <span className={t.delayed ? 'text-warn' : undefined}>
                    {t.stage === 'delivered' ? shortDateTime(lastAt(t, 'delivered')!) : t.expected_at ? shortDate(t.expected_at) : '—'}
                    {t.delayed && ' · late'}
                  </span>
                </div>
              </div>
              <div className="step-track">
                {STAGE_FLOW.map((s, i) => (
                  <div key={s} className={`step ${i < reached ? 'done' : i === reached ? 'now' : ''}`}>
                    <span className="step-dot" />
                    <span className="step-name">{STAGE_LABEL[s]}</span>
                    <span className="step-time">{lastAt(t, s) ? shortDate(lastAt(t, s)!) : ''}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="od-section">
            <div className="od-label">Tracking history</div>
            <ul className="track-timeline">
              {[...t.events].reverse().map((e, i) => (
                <li key={i}>
                  <div className="tt-title">{e.text}</div>
                  <div className="tt-time">{shortDateTime(e.at)} · {e.place}</div>
                </li>
              ))}
            </ul>
          </section>

          {complaints.length > 0 && (
            <section className="od-section">
              <div className="od-label">Complaints on this order</div>
              <ul className="attn-list">
                {complaints.map(c => (
                  <li key={c.id}>
                    <div><div className="name">{c.ticket} · {c.category}</div><div className="action">{c.description}</div></div>
                    <div className="attn-side"><span className="loc">{STATUS_LABEL[c.status]}</span></div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {o.notes && (
            <section className="od-section">
              <div className="od-label">Notes</div>
              <div>{o.notes}</div>
            </section>
          )}
        </div>

        <div className="drawer-actions">
          <button className="btn-primary btn-small" onClick={copyUpdate}><Copy size={14} /> Copy update for customer</button>
          <a className="btn-secondary btn-small" href={`tel:${o.phone}`}>Call customer</a>
        </div>
      </aside>
    </>
  );
}
