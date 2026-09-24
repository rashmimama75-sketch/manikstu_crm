import React from 'react';
import { Franchise } from '../../data/initialData';

interface FranchiseViewProps {
  franchises: Franchise[];
  onOpenAddFranchiseModal: () => void;
}

export default function FranchiseView({ franchises, onOpenAddFranchiseModal }: FranchiseViewProps) {
  const activeCount = franchises.filter(f => f.status === 'Active').length;
  const onboardingCount = franchises.filter(f => f.status === 'Onboarding').length;

  return (
    <>
      <div className="scoreboard">
        <div className="score">
          <div className="num">{franchises.length}</div>
          <div className="label">Total Franchise Hubs</div>
        </div>
        <div className="score">
          <div className="num">{activeCount}</div>
          <div className="label">Active Hubs</div>
        </div>
        <div className="score">
          <div className="num">{onboardingCount}</div>
          <div className="label">Onboarding</div>
        </div>
        <div className="score">
          <div className="num">₹6.2L</div>
          <div className="label">Revenue This Month</div>
        </div>
      </div>

      <div className="page-toolbar">
        <div></div>
        <button className="btn-primary" onClick={onOpenAddFranchiseModal}>
          + Add Franchise Hub
        </button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Franchise Name</th>
                <th>District Location</th>
                <th>Franchise Partner</th>
                <th>Orders (Month)</th>
                <th>Revenue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {franchises.map((fr) => (
                <tr key={fr.id}>
                  <td style={{ fontWeight: 600 }}>{fr.name}</td>
                  <td>{fr.location}</td>
                  <td>{fr.owner}</td>
                  <td style={{ fontWeight: 600 }}>{fr.ordersThisMonth}</td>
                  <td style={{ fontWeight: 600 }}>{fr.revenue}</td>
                  <td>
                    <span className={`chip ${fr.status === 'Active' ? 'delivered' : 'transit'}`}>
                      {fr.status}
                    </span>
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
