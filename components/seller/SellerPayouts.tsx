import React, { useState } from 'react';
import type { Seller } from '../../data/sellers';
import { rupees, rupeesShort, shortDate } from '../../lib/format';
import { PAYOUT_CHIP, PayoutStatus, SellerOrder, nextPayoutDate } from './sellerData';

const TABS: PayoutStatus[] = ['Due', 'On hold', 'Paid out'];
const PAGE_SIZE = 15;

export default function SellerPayouts({ orders, seller }: { orders: SellerOrder[]; seller: Seller }) {
  const [tab, setTab] = useState<PayoutStatus>('Due');
  const [page, setPage] = useState(0);
  const sum = (s: PayoutStatus) => orders.filter(o => o.payout === s).reduce((n, o) => n + o.net, 0);
  const commissionTotal = orders.filter(o => o.payout === 'Paid out' || o.payout === 'Due').reduce((n, o) => n + o.commission, 0);

  const rows = orders.filter(o => o.payout === tab);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const shown = rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <>
      <div className="scoreboard">
        <div className="score"><div className="num">{rupeesShort(sum('Due'))}</div><div className="label">Due on {shortDate(nextPayoutDate())}</div></div>
        <div className="score"><div className="num">{rupeesShort(sum('On hold'))}</div><div className="label">On hold · not delivered yet</div></div>
        <div className="score"><div className="num">{rupeesShort(sum('Paid out'))}</div><div className="label">Paid out</div></div>
        <div className="score"><div className="num">{rupeesShort(commissionTotal)}</div><div className="label">Manikstu commission ({seller.commissionPct}%)</div></div>
      </div>

      <p className="loc" style={{ marginBottom: 14 }}>
        Delivered orders are paid out every Monday, {seller.payoutAfterDays} days after delivery, minus {seller.commissionPct}% commission.
        Orders not yet delivered are on hold. Cancelled and refunded orders earn nothing.
      </p>

      <div className="page-toolbar">
        <div className="filters">
          {TABS.map(t => (
            <button key={t} className={`filter-chip ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setPage(0); }}>
              {t} ({orders.filter(o => o.payout === t).length})
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Delivered</th><th className="num-col">Sale</th><th className="num-col">Commission</th><th className="num-col">You get</th><th>Payout</th></tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '24px 0' }}>No orders here.</td></tr>
              )}
              {shown.map(o => (
                <tr key={o.order.id}>
                  <td className="cust">{o.order.order_number}<div className="loc">{shortDate(o.order.created_at)}</div></td>
                  <td>{o.order.customer_name}</td>
                  <td>{o.deliveredAt ? shortDate(o.deliveredAt) : <span className="loc">Not yet</span>}</td>
                  <td className="num-col">{rupees(o.gross)}</td>
                  <td className="num-col">− {rupees(o.commission)}</td>
                  <td className="num-col strong">{rupees(o.net)}</td>
                  <td><span className={`chip ${PAYOUT_CHIP[o.payout]}`}>{o.payout}</span></td>
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
