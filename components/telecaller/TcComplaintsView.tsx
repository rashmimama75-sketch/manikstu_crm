import React, { useState } from 'react';
import { Complaint } from '../../data/telecallerData';
import { EmptyRow, FilterChips, StatusChip } from './shared';

const FILTERS = ['All', 'Open', 'In progress', 'Resolved'] as const;
type Filter = typeof FILTERS[number];

const NEXT_STATUS: Partial<Record<Complaint['status'], Complaint['status']>> = {
  Open: 'In progress',
  'In progress': 'Resolved',
};

interface Props {
  complaints: Complaint[];
  searchQuery: string;
  onAdvance: (id: string, next: Complaint['status']) => void;
}

export default function TcComplaintsView({ complaints, searchQuery, onAdvance }: Props) {
  const [filter, setFilter] = useState<Filter>('All');
  const q = searchQuery.trim().toLowerCase();
  const visible = complaints.filter(
    c => (filter === 'All' || c.status === filter) &&
      (!q || `${c.id} ${c.customer} ${c.issue} ${c.order}`.toLowerCase().includes(q))
  );

  return (
    <>
      <div className="scoreboard">
        <div className="score"><div className="num">{complaints.filter(c => c.status !== 'Resolved').length}</div><div className="label">Assigned to me</div></div>
        <div className="score"><div className="num">{complaints.filter(c => c.status === 'In progress').length}</div><div className="label">In progress</div></div>
        <div className="score"><div className="num">{complaints.filter(c => c.status === 'Resolved').length}</div><div className="label">Resolved this month</div></div>
        <div className="score"><div className="num">0</div><div className="label">Escalated</div></div>
      </div>
      <div className="page-toolbar">
        <FilterChips<Filter> options={FILTERS} value={filter} onChange={setFilter} />
      </div>
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Complaint</th><th>Customer</th><th>Issue</th><th>Order</th><th>Status</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {visible.length === 0 && <EmptyRow cols={7} text="No complaints match this filter." />}
              {visible.map(c => {
                const next = NEXT_STATUS[c.status];
                return (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td className="cust">{c.customer}</td>
                    <td>{c.issue}</td>
                    <td>{c.order}</td>
                    <td><StatusChip status={c.status} /></td>
                    <td>{c.date}</td>
                    <td>
                      {next && (
                        <button className="btn-secondary btn-small" onClick={() => onAdvance(c.id, next)}>
                          {next === 'In progress' ? 'Start' : 'Resolve'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
