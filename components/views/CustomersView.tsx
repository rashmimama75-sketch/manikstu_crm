import React, { useState } from 'react';
import { Customer } from '../../data/initialData';

interface CustomersViewProps {
  customers: Customer[];
  onSelectCustomer: (cust: Customer) => void;
  onOpenAddCustomerModal: () => void;
}

export default function CustomersView({
  customers,
  onSelectCustomer,
  onOpenAddCustomerModal
}: CustomersViewProps) {
  const [filter, setFilter] = useState<string>('All');
  const filters = ['All', 'Active', 'New', 'Inactive'];

  const filteredCustomers = customers.filter((c) => {
    if (filter === 'All') return true;
    return c.status.toLowerCase() === filter.toLowerCase();
  });

  const getCount = (st: string) => {
    if (st === 'All') return customers.length;
    return customers.filter((c) => c.status.toLowerCase() === st.toLowerCase()).length;
  };

  return (
    <>
      <div className="scoreboard">
        <div className="score">
          <div className="num">2,410</div>
          <div className="label">Total Farmers</div>
        </div>
        <div className="score">
          <div className="num">86</div>
          <div className="label">New This Month</div>
        </div>
        <div className="score">
          <div className="num">612</div>
          <div className="label">Repeat Buyers</div>
        </div>
        <div className="score">
          <div className="num">₹1,240</div>
          <div className="label">Avg. Order Value</div>
        </div>
      </div>

      <div className="page-toolbar">
        <div className="filters">
          {filters.map((f) => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f} ({getCount(f)})
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={onOpenAddCustomerModal}>
          + Add Farmer Profile
        </button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Location</th>
                <th>Total Orders</th>
                <th>Lifetime Value</th>
                <th>Last Order</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust) => (
                <tr key={cust.id}>
                  <td className="cust">
                    {cust.name}
                    <div className="loc">{cust.phone}</div>
                  </td>
                  <td>{cust.location}</td>
                  <td style={{ fontWeight: 600 }}>{cust.ordersCount}</td>
                  <td style={{ fontWeight: 600 }}>₹{cust.lifetimeValue.toLocaleString()}</td>
                  <td style={{ color: 'var(--ink-soft)', fontSize: 12.5 }}>{cust.lastOrder}</td>
                  <td>
                    <span className={`chip ${
                      cust.status === 'Active' ? 'delivered' :
                      cust.status === 'New' ? 'transit' : 'pending'
                    }`}>
                      {cust.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="view-btn"
                      title="View Farm Details"
                      onClick={() => onSelectCustomer(cust)}
                    >
                      👁
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
