import React, { useState } from 'react';
import { Enquiry } from '../../data/initialData';

interface EnquiriesViewProps {
  enquiries: Enquiry[];
  onOpenNewEnquiryModal: () => void;
  onUpdateEnquiryStatus: (id: string, status: Enquiry['status']) => void;
}

export default function EnquiriesView({
  enquiries,
  onOpenNewEnquiryModal,
  onUpdateEnquiryStatus
}: EnquiriesViewProps) {
  const [filter, setFilter] = useState<string>('All');
  const filters = ['All', 'New', 'In progress', 'Converted', 'Closed'];

  const filteredEnquiries = enquiries.filter((e) => {
    if (filter === 'All') return true;
    return e.status.toLowerCase() === filter.toLowerCase();
  });

  const getCount = (st: string) => {
    if (st === 'All') return enquiries.length;
    return enquiries.filter((e) => e.status.toLowerCase() === st.toLowerCase()).length;
  };

  return (
    <>
      <div className="scoreboard">
        <div className="score">
          <div className="num">{enquiries.length}</div>
          <div className="label">Total Enquiries</div>
        </div>
        <div className="score">
          <div className="num">{getCount('New')}</div>
          <div className="label">New Leads</div>
        </div>
        <div className="score">
          <div className="num">{getCount('In progress')}</div>
          <div className="label">In Progress</div>
        </div>
        <div className="score">
          <div className="num">{getCount('Converted')}</div>
          <div className="label">Converted</div>
        </div>
        <div className="score">
          <div className="num">{getCount('Closed')}</div>
          <div className="label">Closed</div>
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
        <button className="btn-primary" onClick={onOpenNewEnquiryModal}>
          + New Enquiry
        </button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Enquiry ID</th>
                <th>Farmer Name</th>
                <th>Interested In</th>
                <th>Source</th>
                <th>Assigned Executive</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.map((enq) => (
                <tr key={enq.id}>
                  <td style={{ fontWeight: 600 }}>{enq.id}</td>
                  <td className="cust">{enq.name}</td>
                  <td>{enq.interestedIn}</td>
                  <td>{enq.source}</td>
                  <td>{enq.assignedTo}</td>
                  <td>
                    <select
                      value={enq.status}
                      onChange={(e) => onUpdateEnquiryStatus(enq.id, e.target.value as Enquiry['status'])}
                      className={`chip ${
                        enq.status === 'Converted' ? 'delivered' :
                        enq.status === 'In progress' ? 'transit' :
                        enq.status === 'New' ? 'pending' : 'confirmed'
                      }`}
                      style={{ border: 'none', cursor: 'pointer', outline: 'none' }}
                    >
                      <option value="New">New</option>
                      <option value="In progress">In progress</option>
                      <option value="Converted">Converted</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </td>
                  <td style={{ color: 'var(--ink-soft)', fontSize: 12.5 }}>{enq.received}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
