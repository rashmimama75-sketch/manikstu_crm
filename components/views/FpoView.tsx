import React from 'react';
import { FPO } from '../../data/initialData';

interface FpoViewProps {
  fpos: FPO[];
  onOpenAddFpoModal: () => void;
}

export default function FpoView({ fpos, onOpenAddFpoModal }: FpoViewProps) {
  const totalMembers = fpos.reduce((acc, curr) => acc + curr.members, 0);

  return (
    <>
      <div className="scoreboard">
        <div className="score">
          <div className="num">{fpos.length}</div>
          <div className="label">Partnered FPOs</div>
        </div>
        <div className="score">
          <div className="num">{totalMembers.toLocaleString()}</div>
          <div className="label">Member Farmers</div>
        </div>
        <div className="score">
          <div className="num">3</div>
          <div className="label">Key Districts Covered</div>
        </div>
      </div>

      <div className="page-toolbar">
        <div></div>
        <button className="btn-primary" onClick={onOpenAddFpoModal}>
          + Partner New FPO
        </button>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>FPO Name</th>
                <th>District / Location</th>
                <th>Member Farmers</th>
                <th>Primary Harvest Crop</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {fpos.map((fpo) => (
                <tr key={fpo.id}>
                  <td style={{ fontWeight: 600 }}>{fpo.name}</td>
                  <td>{fpo.location}</td>
                  <td style={{ fontWeight: 600 }}>{fpo.members}</td>
                  <td>{fpo.primaryCrop}</td>
                  <td>
                    <span className={`chip ${fpo.status === 'Active' ? 'delivered' : 'transit'}`}>
                      {fpo.status}
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
