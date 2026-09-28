import React, { useState } from 'react';
import { ORDER_CHIP, rupees, shortDateTime } from '../../lib/format';
import { ORDER_STATUS_LABEL, SellerOrder } from './sellerData';

// Orders lives before shipping only: new orders waiting to be confirmed, and ones that were
// cancelled before that happened. The moment an order is confirmed it moves to Tracking and
// disappears from here — Tracking already covers confirmed → packed → shipped → delivered.
type Tab = 'all' | 'pending' | 'cancelled';
const TABS: Tab[] = ['all', 'pending', 'cancelled'];
const PAGE_SIZE = 15;

interface Props {
  orders: SellerOrder[];
  /** Orders that also contain other sellers' items. */
  mixedOrderIds: number[];
  searchQuery: string;
  /** Opens the confirm-order card for one order. */
  onOpenConfirm: (orderId: number) => void;
}

export default function SellerOrders({ orders, mixedOrderIds, searchQuery, onOpenConfirm }: Props) {
  const [tab, setTab] = useState<Tab>('all');
  const [page, setPage] = useState(0);

  // Confirmed orders (and anything past that) belong to Tracking, not here.
  const unshipped = orders.filter(o => o.order.status === 'pending' || o.order.status === 'cancelled');
  const count = (t: Tab) => (t === 'all' ? unshipped.length : unshipped.filter(o => o.order.status === t).length);

  const q = searchQuery.trim().toLowerCase();
  const rows = unshipped
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
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '24px 0' }}>No orders match. Confirmed orders have moved to Tracking.</td></tr>
              )}
              {shown.map(o => (
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
                    {o.order.status === 'pending' && (
                      <button className="btn-primary btn-small" onClick={() => onOpenConfirm(o.order.id)}>Confirm</button>
                    )}
                  </td>
                </tr>
              ))}
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
