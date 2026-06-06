import React from 'react';
import { History, Calendar, Trash2 } from 'lucide-react';
import type { LeaveRecord } from '../types';

interface LeaveHistoryProps {
  leaves: LeaveRecord[];
  onCancelLeave: (id: string) => void;
}

export const LeaveHistory: React.FC<LeaveHistoryProps> = ({ leaves, onCancelLeave }) => {
  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'CL': return 'badge-cl';
      case 'SL': return 'badge-sl';
      case 'EL': return 'badge-el';
      default: return '';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'CL': return 'Casual Leave';
      case 'SL': return 'Sick Leave';
      case 'EL': return 'Earned Leave';
      default: return type;
    }
  };

  // Sort leaves by start date descending
  const sortedLeaves = [...leaves].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <div className="glass-card animate-fade-in">
      <h3 className="section-title">
        <History className="text-secondary" size={20} /> Leave Transaction History
      </h3>
      <p className="subtitle mb-4">
        Review your applied leaves. You can cancel requests to instantly restore your leave balances.
      </p>

      {sortedLeaves.length === 0 ? (
        <div className="empty-state">
          No leaves applied or recorded for this period yet.
        </div>
      ) : (
        <div className="history-list">
          {sortedLeaves.map((leave) => (
            <div key={leave.id} className={`history-item type-${leave.type.toLowerCase()}`}>
              <div className="history-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className={`badge ${getBadgeClass(leave.type)}`}>
                    {leave.type}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{getTypeName(leave.type)}</span>
                </div>
                <div className="history-details">
                  <span className="history-date">
                    <Calendar size={12} />
                    {leave.startDate} to {leave.endDate}
                  </span>
                  <span>
                    • <strong>{leave.days} {leave.days === 1 ? 'day' : 'days'}</strong>
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Reason:</span> "{leave.reason}"
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => onCancelLeave(leave.id)}
                  className="btn btn-danger btn-sm"
                  title="Cancel and refund leave"
                  style={{ padding: '0.5rem' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
