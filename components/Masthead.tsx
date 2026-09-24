import React from 'react';

interface MastheadProps {
  currentTerritory: string;
  onTerritoryChange: (territory: string) => void;
}

export default function Masthead({ currentTerritory, onTerritoryChange }: MastheadProps) {
  return (
    <div className="masthead">
      <div className="masthead-bar">
        <div className="brand">
          <div className="brand-mark">🌾</div>
          <div>
            <div className="brand-name">Maniksthu Manager</div>
            <div className="brand-tag">
              <span>Odisha Agri-Business Operations</span>
              <span className="manager-badge">Territory Manager</span>
            </div>
          </div>
        </div>
        <div className="masthead-right">
          <span>Kharif Season · 2026–27</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <select
            value={currentTerritory}
            onChange={(e) => onTerritoryChange(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#FDF6EC',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="All Odisha" style={{ color: '#2B2A22' }}>HQ - All Odisha</option>
            <option value="Bhubaneswar Central" style={{ color: '#2B2A22' }}>Bhubaneswar Central</option>
            <option value="Cuttack Hub" style={{ color: '#2B2A22' }}>Cuttack Hub</option>
            <option value="Berhampur South" style={{ color: '#2B2A22' }}>Berhampur South</option>
            <option value="Balasore North" style={{ color: '#2B2A22' }}>Balasore North</option>
          </select>
        </div>
      </div>
    </div>
  );
}
