import React from 'react';
import { Order } from '../../data/initialData';

interface OrderTrackingViewProps {
  orderId: string;
  orders: Order[];
  onBack: () => void;
  onAdvanceTimeline: (orderId: string) => void;
}

export default function OrderTrackingView({
  orderId,
  orders,
  onBack,
  onAdvanceTimeline
}: OrderTrackingViewProps) {
  const currentOrder = orders.find(o => o.id === orderId) || orders[1] || {
    id: 'MK-2460',
    customer: 'Snehalata Behera',
    location: 'Puri',
    product: 'Cold-pressed mustard oil',
    amount: 1150,
    status: 'In transit',
    paymentStatus: 'Paid',
    date: '18 Sep'
  };

  return (
    <>
      <button className="back-link" onClick={onBack} style={{ background: 'none', border: 'none', padding: 0 }}>
        ← Back to orders
      </button>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="track-head">
          <div>
            <div className="track-order-id">Order {currentOrder.id}</div>
            <h2 style={{ margin: '2px 0 0' }}>{currentOrder.product}</h2>
            <div className="sub" style={{ marginTop: 4 }}>
              {currentOrder.customer} · {currentOrder.location}, Odisha
            </div>
          </div>
          <div className="track-amount">
            <span className={`chip ${currentOrder.status === 'Delivered' ? 'delivered' : 'transit'}`}>
              {currentOrder.status}
            </span>
            <div className="track-amt-num">₹{currentOrder.amount.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="panel">
          <div className="panel-head">
            <h2>Tracking Timeline</h2>
            {currentOrder.status !== 'Delivered' && (
              <span className="link" onClick={() => onAdvanceTimeline(currentOrder.id)}>
                + Mark Next Stage
              </span>
            )}
          </div>
          <ul className="track-timeline">
            <li>
              <div className="tt-title">Order Placed</div>
              <div className="tt-time">16 Sep, 9:40 AM</div>
            </li>
            <li>
              <div className="tt-title">Payment Confirmed ({currentOrder.paymentStatus})</div>
              <div className="tt-time">16 Sep, 12:10 PM</div>
            </li>
            <li>
              <div className="tt-title">Packed at Cuttack Warehouse</div>
              <div className="tt-time">17 Sep, 9:30 AM</div>
            </li>
            <li>
              <div className="tt-title">Shipped & Waybill Assigned</div>
              <div className="tt-time">17 Sep, 2:50 PM · Tracking DTDC5512087</div>
            </li>
            <li>
              <div className="tt-title">Out for Delivery</div>
              <div className="tt-time">18 Sep, 8:45 AM</div>
            </li>
            <li className={currentOrder.status === 'Delivered' ? '' : 'pending'}>
              <div className="tt-title">
                {currentOrder.status === 'Delivered' ? 'Delivered to Customer' : 'Delivery Pending'}
              </div>
              <div className="tt-time">
                {currentOrder.status === 'Delivered' ? '18 Sep, 4:15 PM' : 'Expected by 18 Sep, 7:00 PM'}
              </div>
            </li>
          </ul>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Dispatch & Courier Details</h2>
          </div>
          <ul className="partner-list">
            <li>
              <div>
                <div className="pname">Tracking Reference</div>
                <div className="ploc">Courier AWB / Consignment</div>
              </div>
              <span className="track-val">DTDC5512087</span>
            </li>
            <li>
              <div>
                <div className="pname">Logistics Partner</div>
                <div className="ploc">Territory Express Network</div>
              </div>
              <span className="track-val">DTDC Express (Odisha)</span>
            </li>
            <li>
              <div>
                <div className="pname">Destination Hub</div>
                <div className="ploc">Drop Location</div>
              </div>
              <span className="track-val">{currentOrder.location}, Odisha</span>
            </li>
            <li>
              <div>
                <div className="pname">Manager Escrow Status</div>
                <div className="ploc">Settlement hold</div>
              </div>
              <span className="track-val" style={{ color: 'var(--leaf)' }}>Approved</span>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
