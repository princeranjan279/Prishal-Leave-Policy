import React, { useState } from 'react';
import { LogOut, ArrowRightCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import type { LeaveBalances } from '../types';

interface SimulatorsProps {
  balances: LeaveBalances;
  simulatedYear: number;
  onRollover: () => void;
  onExitCompany: (payout: number, encashedDays: number, forfeitedDays: number, dailyRate: number) => void;
  onResetAll: () => void;
}

export const Simulators: React.FC<SimulatorsProps> = ({
  balances,
  simulatedYear,
  onRollover,
  onExitCompany,
  onResetAll,
}) => {
  const [dailyRate, setDailyRate] = useState<number>(200);
  const [currency, setCurrency] = useState<string>('$');

  // Math for Earned Leave Encashment
  const elBalance = balances.EL.available;
  const maxEncashable = 45;
  const encashedDays = Math.min(elBalance, maxEncashable);
  const forfeitedDays = Math.max(0, elBalance - maxEncashable);
  const totalPayout = encashedDays * dailyRate;

  const handleExitClick = () => {
    onExitCompany(totalPayout, encashedDays, forfeitedDays, dailyRate);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade-in">
      {/* Encashment / Exit Simulator */}
      <div className="glass-card" style={{ borderLeft: '4px solid var(--danger)' }}>
        <h3 className="section-title text-danger">
          <LogOut size={20} /> Exit &amp; EL Encashment
        </h3>
        <p className="subtitle mb-4">
          Calculate your Earned Leave encashment value. Maximum encashable EL is capped at <strong>45 days</strong>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Currency</label>
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)} 
              className="form-control"
            >
              <option value="$">USD ($)</option>
              <option value="₹">INR (₹)</option>
              <option value="€">EUR (€)</option>
              <option value="£">GBP (£)</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Daily Salary Rate</label>
            <input
              type="number"
              min="0"
              value={dailyRate}
              onChange={(e) => setDailyRate(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="form-control"
            />
          </div>
        </div>

        {/* Math Table */}
        <div 
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            border: '1px solid var(--border-color)',
            fontSize: '0.9rem'
          }}
        >
          <div className="flex-between mb-2">
            <span className="text-secondary">Accumulated EL:</span>
            <span style={{ fontWeight: 600 }}>{elBalance} Days</span>
          </div>
          <div className="flex-between mb-2">
            <span className="text-secondary">Encashed Days (Max 45):</span>
            <span className="text-success" style={{ fontWeight: 600 }}>{encashedDays} Days</span>
          </div>
          <div className="flex-between mb-2">
            <span className="text-secondary">Forfeited Days:</span>
            <span className={forfeitedDays > 0 ? 'text-danger' : 'text-muted'} style={{ fontWeight: 600 }}>
              {forfeitedDays} Days
            </span>
          </div>
          <div className="divider" style={{ margin: '0.5rem 0' }}></div>
          <div className="flex-between" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
            <span>Estimated Payout:</span>
            <span className="text-success">
              {currency}{totalPayout.toLocaleString()}
            </span>
          </div>
        </div>

        {forfeitedDays > 0 && (
          <div 
            className="flex-center text-warning mb-4" 
            style={{ 
              fontSize: '0.8rem',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <AlertTriangle size={14} />
            <span>Warning: {forfeitedDays} EL days exceed the 45-day cap and will be lost.</span>
          </div>
        )}

        <button 
          type="button" 
          onClick={handleExitClick} 
          className="btn btn-danger btn-block"
        >
          Simulate Resignation / Exit
        </button>
      </div>

      {/* Year-End Rollover Simulator */}
      {simulatedYear === 2026 && (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--border-focus)' }}>
          <h3 className="section-title text-info">
            <ArrowRightCircle size={20} /> Year Rollover (2026 → 2027)
          </h3>
          <p className="subtitle mb-4">
            Simulate moving into 2027. This will apply the annual leave policies:
          </p>

          <ul 
            style={{ 
              fontSize: '0.85rem', 
              color: 'var(--text-secondary)', 
              paddingLeft: '1.25rem',
              marginBottom: '1.25rem',
              lineHeight: 1.6
            }}
          >
            <li>
              <span className="text-danger" style={{ fontWeight: 600 }}>Casual Leave (CL):</span> Expires on Dec 31. Restarts with 0 starting balance in Jan 2027 (credits accrue in March, June, etc.).
            </li>
            <li>
              <span className="text-danger" style={{ fontWeight: 600 }}>Sick Leave (SL):</span> Expires on Dec 31. Credited with a fresh <strong>7 days</strong> for the full year of 2027.
            </li>
            <li>
              <span className="text-success" style={{ fontWeight: 600 }}>Earned Leave (EL):</span> All current <strong>{balances.EL.available} days</strong> will carry forward!
            </li>
          </ul>

          <button 
            type="button" 
            onClick={onRollover} 
            className="btn btn-primary btn-block"
            style={{ background: 'linear-gradient(to right, #4f46e5, #06b6d4)', border: 'none' }}
          >
            Simulate Year-End Rollover
          </button>
        </div>
      )}

      {/* Reset Simulation Button */}
      <div style={{ textAlign: 'center' }}>
        <button 
          type="button" 
          onClick={onResetAll} 
          className="btn btn-secondary btn-sm"
          style={{ gap: '0.25rem' }}
        >
          <RotateCcw size={14} /> Reset Simulation Data
        </button>
      </div>
    </div>
  );
};
