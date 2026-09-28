import React, { useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import type { OrderStatus } from '../../data/managerDashboard';
import { TODAY } from '../../data/today';
import { daysBefore, rupees, shortDate, shortDateTime } from '../../lib/format';
import Modal from '../Modal';
import { STAGE_CHIP, STAGE_FLOW, STAGE_LABEL, TrackStage, Tracking, stageIndex, trackingFor } from '../telecaller/orderTracking';
import { NEXT_STEP, SellerOrder, ShipmentDetails } from './sellerData';

type Tab = 'confirmed' | 'active' | 'late' | 'delivered' | 'cancelled' | 'all';
const TABS: { key: Tab; label: string }[] = [
  { key: 'confirmed', label: 'Ready to ship' },
  { key: 'active', label: 'On the way' },
  { key: 'late', label: 'Late' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All' },
];
const PAGE_SIZE = 15;

const lastAt = (t: Tracking, stage: TrackStage) => t.events.find(e => e.stage === stage)?.at ?? null;
const isActive = (t: Tracking) => t.stage !== 'delivered' && t.stage !== 'cancelled';
const inTab = (o: SellerOrder, t: Tracking, tab: Tab) =>
  tab === 'all' ? true
    : tab === 'confirmed' ? o.order.status === 'confirmed'
    : tab === 'active' ? isActive(t) && o.order.status !== 'confirmed'
    : tab === 'late' ? t.delayed
    : t.stage === tab;

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
  orders: SellerOrder[];
  searchQuery: string;
  shipmentDetails: Record<number, ShipmentDetails>;
  onAdvance: (orderId: number, to: OrderStatus) => void;
  onOpenConfirm: (orderId: number) => void;
}

export default function SellerTracking({ orders, searchQuery, shipmentDetails, onAdvance, onOpenConfirm }: Props) {
  const [tab, setTab] = useState<Tab>('active');
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<number | null>(null);

  const tracked = useMemo(() => orders.map(o => ({ o, t: trackingFor(o.order) })), [orders]);
  const count = (k: Tab) => tracked.filter(x => inTab(x.o, x.t, k)).length;

  const q = searchQuery.trim().toLowerCase();
  const rows = tracked
    .filter(x => inTab(x.o, x.t, tab))
    .filter(x => !q || [x.o.order.order_number, x.o.order.customer_name, x.o.order.city, x.t.awb ?? '', x.t.courier ?? '']
      .some(v => v.toLowerCase().includes(q)))
    // late first, then the soonest expected delivery
    .sort((a, b) => Number(b.t.delayed) - Number(a.t.delayed) || (a.t.expected_at ?? '9').localeCompare(b.t.expected_at ?? '9') || b.o.order.created_at.localeCompare(a.o.order.created_at));
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const shown = rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const deliveredWeek = tracked.filter(x => x.t.stage === 'delivered' && daysBefore(lastAt(x.t, 'delivered') ?? '2000-01-01') < 7).length;
  const open = tracked.find(x => x.o.order.id === openId);

  // Ship from right here: move it into "On the way" too, or it'd vanish from "Ready to ship" with nothing to show for it.
  const shipOrder = (orderId: number) => {
    onAdvance(orderId, NEXT_STEP.confirmed!.to);
    setTab('active');
  };

  return (
    <>
      <div className="scoreboard">
        <div className="score"><div className="num">{tracked.filter(x => x.t.stage === 'confirmed' || x.t.stage === 'packed' || x.t.stage === 'placed').length}</div><div className="label">Waiting for pickup</div></div>
        <div className="score"><div className="num">{tracked.filter(x => x.t.stage === 'shipped').length}</div><div className="label">In transit</div></div>
        <div className="score"><div className="num">{tracked.filter(x => x.t.stage === 'out_for_delivery').length}</div><div className="label">Out for delivery</div></div>
        <div className="score"><div className="num">{count('late')}{count('late') > 0 && <small className="warn">past due date</small>}</div><div className="label">Late</div></div>
        <div className="score"><div className="num">{deliveredWeek}</div><div className="label">Delivered · last 7 days</div></div>
      </div>

      <div className="page-toolbar">
        <div className="filters">
          {TABS.map(t => (
            <button key={t.key} className={`filter-chip ${tab === t.key ? 'active' : ''}`} onClick={() => { setTab(t.key); setPage(0); }}>
              {t.label} ({count(t.key)})
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>My items</th><th>Delivery status</th><th>Courier</th><th></th></tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '24px 0' }}>No shipments here.</td></tr>
              )}
              {shown.map(({ o, t }) => (
                <tr key={o.order.id}>
                  <td className="cust">{o.order.order_number}<div className="loc">{shortDate(o.order.created_at)}</div></td>
                  <td>{o.order.customer_name}<div className="loc">{o.order.city}, {o.order.pincode}</div></td>
                  <td>
                    {o.items[0].product_name} × {o.items[0].quantity}
                    {o.items.length > 1 && <div className="loc">+ {o.items.length - 1} more</div>}
                  </td>
                  <td>
                    <TrackBar t={t} />
                    <div className="track-caption">
                      <span className={`chip ${t.delayed ? 'pending' : STAGE_CHIP[t.stage]}`}>{STAGE_LABEL[t.stage]}{t.delayed ? ' · late' : ''}</span>
                      {t.expected_at && <span className={`loc ${t.delayed ? 'text-warn' : ''}`}>{t.expectedIsEstimate ? 'est. ' : 'by '}{shortDate(t.expected_at)}</span>}
                    </div>
                  </td>
                  <td>{t.courier ? <>{t.courier}<div className="loc">{t.awb}</div></> : <span className="loc">Not shipped yet</span>}</td>
                  <td className="track-action">
                    <div className="row-actions">
                      {o.order.status === 'confirmed' && (
                        <button className="btn-primary btn-small" onClick={() => shipOrder(o.order.id)}>{NEXT_STEP.confirmed!.label}</button>
                      )}
                      <button className="icon-btn eye-btn" title="Track delivery" aria-label={`Track delivery of ${o.order.order_number}`} onClick={() => setOpenId(o.order.id)}>
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > PAGE_SIZE && (
          <div className="pager">
            <span>{safePage * PAGE_SIZE + 1}–{Math.min(rows.length, (safePage + 1) * PAGE_SIZE)} of {rows.length} shipments</span>
            <div className="pager-btns">
              <button className="btn-secondary btn-small" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
              <button className="btn-secondary btn-small" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!open} onClose={() => setOpenId(null)} title={open ? `Tracking · ${open.o.order.order_number}` : ''}>
        {open && (() => {
          const { o, t } = open;
          const reached = stageIndex(t.stage);
          return (
            <>
              <section className="od-section">
                <div className="od-label">Delivering to</div>
                <div className="strong">{o.order.customer_name}</div>
                <div className="loc">{o.order.address}, {o.order.city}, {o.order.state} {o.order.pincode}</div>
                <div className="loc" style={{ marginTop: 6 }}>
                  {o.items.map(i => `${i.product_name} × ${i.quantity}`).join(', ')} · {rupees(o.gross)}
                </div>
              </section>

              <section className="od-section od-row">
                <div>
                  <div className="od-label">Your order reference</div>
                  {shipmentDetails[o.order.id] ? (
                    <>
                      {shipmentDetails[o.order.id].orderNo}
                      <div className="loc">Tracking {shipmentDetails[o.order.id].trackingNo}</div>
                    </>
                  ) : (
                    <span className="loc">Not added yet</span>
                  )}
                </div>
                <button className="link link-btn" onClick={() => onOpenConfirm(o.order.id)}>
                  {shipmentDetails[o.order.id] ? 'Edit' : 'Add details'}
                </button>
              </section>

              {o.order.status === 'confirmed' && (
                <section className="od-section">
                  <button className="btn-primary btn-small" onClick={() => { shipOrder(o.order.id); setOpenId(null); }}>
                    {NEXT_STEP.confirmed!.label}
                  </button>
                </section>
              )}

              {t.stage !== 'cancelled' && (
                <section className="od-section">
                  <div className="od-label">Delivery tracking</div>
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
              {t.delayed && (
                <p className="loc text-warn" style={{ marginTop: 10 }}>
                  This delivery is past the courier&apos;s date of {t.expected_at ? shortDate(t.expected_at) : ''} (today is {shortDate(TODAY)}).
                </p>
              )}
            </>
          );
        })()}
      </Modal>
    </>
  );
}
