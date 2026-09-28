import React, { useState } from 'react';
import type { OrderStatus } from '../../data/managerDashboard';
import { ORDER_CHIP, rupees, shortDateTime } from '../../lib/format';
import { NEXT_STEP, ORDER_STATUS_LABEL, SellerOrder, ShipmentDetails } from './sellerData';

type Tab = 'all' | OrderStatus;
const TABS: Tab[] = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const PAGE_SIZE = 15;

interface Props {
  orders: SellerOrder[];
  /** Orders that also contain other sellers' items. */
  mixedOrderIds: number[];
  searchQuery: string;
  onAdvance: (orderId: number, to: OrderStatus) => void;
  /** Order No. / Tracking No. the seller typed in when confirming, keyed by order id. */
  shipmentDetails: Record<number, ShipmentDetails>;
  /** Opens the confirm-order / view-details card for one order. */
  onOpenConfirm: (orderId: number) => void;
}

export default function SellerOrders({ orders, mixedOrderIds, searchQuery, onAdvance, shipmentDetails, onOpenConfirm }: Props) {
  const [tab, setTab] = useState<Tab>('all');
  const [page, setPage] = useState(0);
  const count = (t: Tab) => (t === 'all' ? orders.length : orders.filter(o => o.order.status === t).length);

  const q = searchQuery.trim().toLowerCase();
  const rows = orders
    .filter(o => tab === 'all' || o.order.status === tab)
    .filter(o => !q || [o.order.order_number, o.order.customer_name, o.order.city, o.order.phone, ...o.items.map(i => i.product_name)]
      .some(v => v.toLowerCase().includes(q)));
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const shown = rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <>
      <div className="page-toolbar">
        <div className="filters">
          {TABS.map(t => (
            <button key={t} className={`filter-chip ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setPage(0); }}>
              {t === 'all' ? 'All' : ORDER_STATUS_LABEL[t]} ({count(t)})
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Order</th><th>Placed</th><th>Customer</th><th>My items</th><th className="num-col">Amount</th><th>Payment</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '24px 0' }}>No orders match.</td></tr>
              )}
              {shown.map(o => {
                const hasDetails = !!shipmentDetails[o.order.id];
                return (
                  <tr key={o.order.id}>
                    <td className="cust">{o.order.order_number}<div className="loc">{o.order.source === 'website' ? 'Website' : 'Telecaller'}</div></td>
                    <td>{shortDateTime(o.order.created_at)}</td>
                    <td>{o.order.customer_name}<div className="loc">{o.order.city}, {o.order.pincode}</div></td>
                    <td>
                      {o.items.map(i => <div key={i.product_name}>{i.product_name} × {i.quantity}</div>)}
                      {mixedOrderIds.includes(o.order.id) && <div className="loc">+ items from other sellers</div>}
                    </td>
                    <td className="num-col strong">{rupees(o.gross)}</td>
                    <td>{o.order.payment_method}<div className="loc">{o.order.payment_status}</div></td>
                    <td><span className={`chip ${ORDER_CHIP[o.order.status]}`}>{ORDER_STATUS_LABEL[o.order.status]}</span></td>
                    <td>
                      <div className="row-actions">
                        {o.order.status === 'pending' && (
                          <button className="btn-primary btn-small" onClick={() => onOpenConfirm(o.order.id)}>Confirm</button>
                        )}
                        {o.order.status === 'confirmed' && (
                          <>
                            <button className="btn-secondary btn-small" onClick={() => onOpenConfirm(o.order.id)}>View</button>
                            <button className="btn-primary btn-small" onClick={() => onAdvance(o.order.id, NEXT_STEP.confirmed!.to)}>{NEXT_STEP.confirmed!.label}</button>
                          </>
                        )}
                        {(o.order.status === 'shipped' || o.order.status === 'delivered') && hasDetails && (
                          <button className="btn-secondary btn-small" onClick={() => onOpenConfirm(o.order.id)}>View</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length > PAGE_SIZE && (
          <div className="pager">
            <span>{safePage * PAGE_SIZE + 1}–{Math.min(rows.length, (safePage + 1) * PAGE_SIZE)} of {rows.length} orders</span>
            <div className="pager-btns">
              <button className="btn-secondary btn-small" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>Previous</button>
              <button className="btn-secondary btn-small" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
