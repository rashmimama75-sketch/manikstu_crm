import React, { useState } from 'react';
import { Order } from '../../data/initialData';

interface OrdersViewProps {
  orders: Order[];
  onTrackOrder: (orderId: string) => void;
  onOpenNewOrderModal: () => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
}

export default function OrdersView({
  orders,
  onTrackOrder,
  onOpenNewOrderModal,
  onUpdateOrderStatus
}: OrdersViewProps) {
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const filters = ['All', 'Payment pending', 'Confirmed', 'In transit', 'Delivered', 'Cancelled'];

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'All') return true;
    return o.status.toLowerCase() === activeFilter.toLowerCase();
  });

  const countByStatus = (st: string) => {
    if (st === 'All') return orders.length;
    return orders.filter((o) => o.status.toLowerCase() === st.toLowerCase()).length;
  };

  return (
    <>
      <div className="scoreboard">
        <div className="score">
          <div className="num">{orders.length}</div>
          <div className="label">Total Orders</div>
        </div>
        <div className="score">
          <div className="num">{countByStatus('Payment pending')}</div>
          <div className="label">Payment Pending</div>
        </div>
        <div className="score">
          <div className="num">{countByStatus('In transit')}</div>
          <div className="label">In Transit</div>
        </div>
        <div className="score">
          <div className="num">{countByStatus('Delivered')}</div>
          <div className="label">Delivered</div>
        </div>
        <div className="score">
          <div className="num">{countByStatus('Cancelled')}</div>
          <div className="label">Cancelled</div>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="filters">
          {filters.map((f) => (
            <button
              key={f}
              className={`filter-chip ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f} ({countByStatus(f)})
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={onOpenNewOrderModal}>
          + New Order
        </button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--ink-soft)', padding: '24px 0' }}>
                    No orders match filter "{activeFilter}".
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id}>
                    <td style={{ fontWeight: 600 }}>{ord.id}</td>
                    <td className="cust">
                      {ord.customer}
                      <div className="loc">{ord.location}</div>
                    </td>
                    <td>{ord.product}</td>
                    <td style={{ fontWeight: 600 }}>₹{ord.amount.toLocaleString()}</td>
                    <td>
                      <span className={`chip ${ord.paymentStatus === 'Paid' ? 'delivered' : 'pending'}`}>
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <select
                        value={ord.status}
                        onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value as Order['status'])}
                        className={`chip ${
                          ord.status === 'Delivered' ? 'delivered' :
                          ord.status === 'In transit' ? 'transit' :
                          ord.status === 'Confirmed' ? 'confirmed' : 'pending'
                        }`}
                        style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="Payment pending">Payment pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="In transit">In transit</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td style={{ color: 'var(--ink-soft)', fontSize: 12.5 }}>{ord.date}</td>
                    <td>
                      <button
                        className="view-btn"
                        title="Track Shipment Details"
                        onClick={() => onTrackOrder(ord.id)}
                      >
                        👁
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
