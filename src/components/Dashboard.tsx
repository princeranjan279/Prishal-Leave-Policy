import React from 'react';
import { Calendar, Heart, ShieldAlert, Award } from 'lucide-react';
import type { LeaveBalances } from '../types';

interface DashboardProps {
  balances: LeaveBalances;
  simulatedYear: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ balances, simulatedYear }) => {
  // Helper to render SVG progress ring
  const renderProgressRing = (used: number, total: number, strokeColor: string) => {
    const radius = 28;
    const strokeWidth = 5;
    const circumference = 2 * Math.PI * radius;
    const percent = total > 0 ? Math.min(100, Math.max(0, ((total - used) / total) * 100)) : 0;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div className="progress-ring-container">
        <svg className="progress-ring" width="70" height="70">
          <circle
            className="progress-ring-circle-bg"
            strokeWidth={strokeWidth}
            r={radius}
            cx="35"
            cy="35"
          />
          <circle
            className="progress-ring-circle"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            r={radius}
            cx="35"
            cy="35"
          />
        </svg>
        <div className="progress-ring-text">
          {total > 0 ? `${Math.round(total - used)}` : '0'}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-grid animate-fade-in">
      {/* Casual Leave Card */}
      <div className="glass-card card-cl">
        <div className="balance-header">
          <div>
            <span className="badge badge-cl flex-center">
              <Calendar size={12} /> Casual Leave
            </span>
            <div className="balance-label">Available CL Balance</div>
          </div>
          {renderProgressRing(balances.CL.used, balances.CL.credited, 'url(#cl-gradient-fill)')}
          {/* SVG gradients definition specifically for stroke */}
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
              <linearGradient id="cl-gradient-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="balance-content">
          <div>
            <div className="balance-number">{balances.CL.available}</div>
            <div className="balance-label">Days Left</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{balances.CL.credited} Credited</div>
            <div className="balance-label">{balances.CL.used} Used</div>
          </div>
        </div>

        <div className="balance-meta">
          <span>Quarterly Credit · Lapses Dec 31</span>
          <span className="flex-center text-warning" style={{ fontSize: '0.75rem' }}>
            <ShieldAlert size={12} /> Not Encashable
          </span>
        </div>
      </div>

      {/* Sick Leave Card */}
      <div className="glass-card card-sl">
        <div className="balance-header">
          <div>
            <span className="badge badge-sl flex-center">
              <Heart size={12} /> Sick Leave
            </span>
            <div className="balance-label">Available SL Balance</div>
          </div>
          {renderProgressRing(balances.SL.used, balances.SL.credited, 'url(#sl-gradient-fill)')}
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
              <linearGradient id="sl-gradient-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#fb7185" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="balance-content">
          <div>
            <div className="balance-number">{balances.SL.available}</div>
            <div className="balance-label">Days Left</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{balances.SL.credited} Credited</div>
            <div className="balance-label">{balances.SL.used} Used</div>
          </div>
        </div>

        <div className="balance-meta">
          <span>Year-Start Credit · Lapses Dec 31</span>
          <span className="flex-center text-danger" style={{ fontSize: '0.75rem' }}>
            <ShieldAlert size={12} /> Not Encashable
          </span>
        </div>
      </div>

      {/* Earned Leave Card */}
      <div className="glass-card card-el">
        <div className="balance-header">
          <div>
            <span className="badge badge-el flex-center">
              <Award size={12} /> Earned Leave
            </span>
            <div className="balance-label">Available EL Balance</div>
          </div>
          {/* Note: EL doesn't have a fixed cap, but we can set a relative indicator or show accumulated balance directly */}
          {renderProgressRing(balances.EL.used, balances.EL.credited, 'url(#el-gradient-fill)')}
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
              <linearGradient id="el-gradient-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="balance-content">
          <div>
            <div className="balance-number">{balances.EL.available}</div>
            <div className="balance-label">Days Left</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{balances.EL.credited} Credited</div>
            <div className="balance-label">{balances.EL.used} Used</div>
          </div>
        </div>

        <div className="balance-meta">
          <span>Carry-fwd enabled · Cap: 45 days</span>
          <span className="flex-center text-success" style={{ fontSize: '0.75rem' }}>
            {balances.EL.accruedBlocksCount * 20} days elapsed
          </span>
        </div>
      </div>
    </div>
  );
};
