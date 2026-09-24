import React, { useState } from 'react';
import { TcLead } from '../../data/telecallerData';
import { CallButton, EmptyRow, FilterChips, StatusChip } from './shared';

const FILTERS = ['All', 'Pending', 'Called', 'No answer', 'Connected'] as const;
type Filter = typeof FILTERS[number];

interface Props {
  leads: TcLead[];
  searchQuery: string;
  onCall: (target: { name: string; leadId: string }) => void;
}

function matchesFilter(lead: TcLead, filter: Filter): boolean {
  if (filter === 'All') return true;
  if (filter === 'Called') return lead.status !== 'Pending';
  return lead.status === filter;
}

export default function TcLeadsView({ leads, searchQuery, onCall }: Props) {
  const [filter, setFilter] = useState<Filter>('All');
  const q = searchQuery.trim().toLowerCase();
  const visible = leads.filter(
    l => matchesFilter(l, filter) && (!q || `${l.name} ${l.village} ${l.interest}`.toLowerCase().includes(q))
  );

  const called = leads.filter(l => l.status !== 'Pending').length;

  return (
    <>
      <div className="scoreboard">
        <div className="score"><div className="num">{leads.length}</div><div className="label">Assigned today</div></div>
        <div className="score"><div className="num">{called}</div><div className="label">Called</div></div>
        <div className="score"><div className="num">{leads.length - called}</div><div className="label">Pending</div></div>
        <div className="score"><div className="num">{leads.filter(l => l.status === 'Connected').length}</div><div className="label">Connected</div></div>
      </div>
      <div className="page-toolbar">
        <FilterChips<Filter> options={FILTERS} value={filter} onChange={setFilter} />
      </div>
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Lead</th><th>Village</th><th>Interested in</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {visible.length === 0 && <EmptyRow cols={5} text="No leads match this filter." />}
              {visible.map(l => (
                <tr key={l.id}>
                  <td className="cust">{l.name}</td>
                  <td>{l.village}</td>
                  <td>{l.interest}</td>
                  <td><StatusChip status={l.status} /></td>
                  <td><CallButton onClick={() => onCall({ name: l.name, leadId: l.id })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
