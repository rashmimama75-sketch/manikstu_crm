import React, { useState } from 'react';
import { FollowUp } from '../../data/telecallerData';
import { CallButton, EmptyRow, FilterChips, StatusChip } from './shared';

const FILTERS = ['Due today', 'Overdue', 'Upcoming', 'Completed'] as const;
type Filter = typeof FILTERS[number];

interface Props {
  followUps: FollowUp[];
  searchQuery: string;
  onCall: (target: { name: string; followUpId: string }) => void;
}

export default function TcFollowUpsView({ followUps, searchQuery, onCall }: Props) {
  const [filter, setFilter] = useState<Filter>('Due today');
  const q = searchQuery.trim().toLowerCase();
  const visible = followUps.filter(
    f => f.status === filter && (!q || `${f.name} ${f.reason}`.toLowerCase().includes(q))
  );
  const count = (s: FollowUp['status']) => followUps.filter(f => f.status === s).length;

  return (
    <>
      <div className="scoreboard">
        <div className="score"><div className="num">{count('Due today')}</div><div className="label">Due today</div></div>
        <div className="score"><div className="num">{count('Overdue')}</div><div className="label">Overdue</div></div>
        <div className="score"><div className="num">{count('Upcoming')}</div><div className="label">Upcoming</div></div>
        <div className="score"><div className="num">{count('Completed')}</div><div className="label">Completed today</div></div>
      </div>
      <div className="page-toolbar">
        <FilterChips<Filter> options={FILTERS} value={filter} onChange={setFilter} />
      </div>
      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Lead</th><th>Reason</th><th>Last contacted</th><th>Due</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {visible.length === 0 && <EmptyRow cols={6} text={`No ${filter.toLowerCase()} follow-ups.`} />}
              {visible.map(f => (
                <tr key={f.id}>
                  <td className="cust">{f.name}</td>
                  <td>{f.reason}</td>
                  <td>{f.lastContacted}</td>
                  <td>{f.due}</td>
                  <td><StatusChip status={f.status} /></td>
                  <td>{f.status !== 'Completed' && <CallButton onClick={() => onCall({ name: f.name, followUpId: f.id })} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
