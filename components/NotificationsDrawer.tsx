import React from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface Notif {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'warning' | 'success' | 'info';
}

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notif[];
  onClearAll: () => void;
}

export default function NotificationsDrawer({
  isOpen,
  onClose,
  notifications,
  onClearAll
}: NotificationsDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="notifications-drawer">
        <div className="drawer-head">
          <h3>Manager Alerts</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {notifications.length === 0 ? (
          <div style={{ textTransform: 'none', color: 'var(--ink-soft)', padding: '20px 0', textAlign: 'center' }}>
            No pending alerts. All operations nominal!
          </div>
        ) : (
          <>
            <div className="notif-list">
              {notifications.map((n) => (
                <div key={n.id} className="notif-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    {n.type === 'warning' && <AlertTriangle size={15} color="var(--rust)" />}
                    {n.type === 'success' && <CheckCircle size={15} color="var(--leaf)" />}
                    {n.type === 'info' && <Info size={15} color="var(--gold)" />}
                    <div className="n-title">{n.title}</div>
                  </div>
                  <div style={{ color: 'var(--ink-soft)' }}>{n.message}</div>
                  <div className="n-time">{n.time}</div>
                </div>
              ))}
            </div>

            <button
              className="btn-secondary"
              style={{ marginTop: 'auto', width: '100%' }}
              onClick={onClearAll}
            >
              Clear All Alerts
            </button>
          </>
        )}
      </div>
    </>
  );
}
