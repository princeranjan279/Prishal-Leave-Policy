import React, { useState, useEffect } from 'react';
import { PlusCircle, CalendarRange, CalendarDays } from 'lucide-react';
import type { LeaveType, LeaveBalances, LeaveRecord } from '../types';

interface LeaveFormProps {
  balances: LeaveBalances;
  existingLeaves: LeaveRecord[];
  simulatedYear: number;
  activeMonths: { start: number; end: number }; // e.g. start=4 (May), end=11 (Dec)
  onApplyLeave: (leave: Omit<LeaveRecord, 'id'>) => void;
}

export const LeaveForm: React.FC<LeaveFormProps> = ({
  balances,
  existingLeaves,
  simulatedYear,
  activeMonths,
  onApplyLeave,
}) => {
  const [type, setType] = useState<LeaveType>('CL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [excludeWeekends, setExcludeWeekends] = useState(true);
  const [error, setError] = useState('');
  const [calculatedDays, setCalculatedDays] = useState(0);

  // Min and Max dates based on simulatedYear and activeMonths
  const pad = (n: number) => (n < 10 ? `0${n}` : n);
  const minDate = `${simulatedYear}-${pad(activeMonths.start + 1)}-01`;
  
  // Last day of endMonth
  const getDaysInMonth = (year: number, monthIndex: number) => {
    return new Date(year, monthIndex + 1, 0).getDate();
  };
  const maxDate = `${simulatedYear}-${pad(activeMonths.end + 1)}-${getDaysInMonth(simulatedYear, activeMonths.end)}`;

  // Helper to count days between two dates
  const calculateDays = (startStr: string, endStr: string, skipWeekends: boolean): number => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (end < start) return 0;

    let count = 0;
    const current = new Date(start);
    while (current <= end) {
      if (skipWeekends) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) { // 0 = Sun, 6 = Sat
          count++;
        }
      } else {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  // Update calculated days on input changes
  useEffect(() => {
    setCalculatedDays(calculateDays(startDate, endDate, excludeWeekends));
  }, [startDate, endDate, excludeWeekends]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate) {
      setError('Please select both start and end dates.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be earlier than start date.');
      return;
    }

    if (calculatedDays <= 0) {
      setError('Requested leave duration must be at least 1 day (excluding weekends if selected).');
      return;
    }

    // Check bounds
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    const minObj = new Date(minDate);
    const maxObj = new Date(maxDate);

    if (startObj < minObj || endObj > maxObj) {
      setError(`Leaves for this cycle must fall within ${minDate} and ${maxDate}.`);
      return;
    }

    // Check available balance
    const available = balances[type].available;
    if (calculatedDays > available) {
      setError(
        `Insufficient balance. You requested ${calculatedDays} days of ${type}, but only ${available} days are available.`
      );
      return;
    }

    // Check overlapping leaves
    const hasOverlap = existingLeaves.some((item) => {
      const itemStart = new Date(item.startDate);
      const itemEnd = new Date(item.endDate);
      return startObj <= itemEnd && endObj >= itemStart;
    });

    if (hasOverlap) {
      setError('Selected dates overlap with an already logged leave.');
      return;
    }

    // Policy HR-POL-001 §7.2: CL maximum 3 consecutive working days per stretch
    if (type === 'CL' && calculatedDays > 3) {
      setError('Casual Leave (CL) cannot exceed 3 consecutive working days per stretch per company policy.');
      return;
    }

    // Policy HR-POL-001 §7.2 & §8.2: CL and SL cannot be combined
    const hasActiveCLOnDates = existingLeaves.some(item => {
      if (type === 'SL' && item.type === 'CL') {
        const s = new Date(startDate), e = new Date(endDate);
        const is = new Date(item.startDate), ie = new Date(item.endDate);
        return s <= ie && e >= is;
      }
      if (type === 'CL' && item.type === 'SL') {
        const s = new Date(startDate), e = new Date(endDate);
        const is = new Date(item.startDate), ie = new Date(item.endDate);
        return s <= ie && e >= is;
      }
      return false;
    });
    if (hasActiveCLOnDates) {
      setError('CL and SL cannot be combined or taken on overlapping dates per company policy.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for taking leave.');
      return;
    }

    // Success! Apply leave
    onApplyLeave({
      startDate,
      endDate,
      type,
      days: calculatedDays,
      reason: reason.trim(),
    });

    // Reset inputs
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  return (
    <div className="glass-card animate-fade-in">
      <h3 className="section-title">
        <PlusCircle className="text-warning" size={20} /> Request Manual Leave
      </h3>
      <p className="subtitle mb-4">
        Log a personal leave request manually. The balance will be adjusted instantly.
      </p>

      {error && (
        <div 
          className="text-danger" 
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Leave Type */}
        <div className="form-group">
          <label>Leave Category</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <button
              type="button"
              className={`btn ${type === 'CL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setType('CL')}
              style={{
                background: type === 'CL' ? 'var(--cl-gradient)' : '',
                borderColor: type === 'CL' ? 'transparent' : 'var(--border-color)',
              }}
            >
              Casual (CL)
            </button>
            <button
              type="button"
              className={`btn ${type === 'SL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setType('SL')}
              style={{
                background: type === 'SL' ? 'var(--sl-gradient)' : '',
                borderColor: type === 'SL' ? 'transparent' : 'var(--border-color)',
              }}
            >
              Sick (SL)
            </button>
            <button
              type="button"
              className={`btn ${type === 'EL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setType('EL')}
              style={{
                background: type === 'EL' ? 'var(--el-gradient)' : '',
                borderColor: type === 'EL' ? 'transparent' : 'var(--border-color)',
              }}
            >
              Earned (EL)
            </button>
          </div>
        </div>

        {/* Date Selectors */}
        <div className="form-row">
          <div className="form-group">
            <label className="flex-center">
              <CalendarRange size={14} /> Start Date
            </label>
            <input
              type="date"
              className="form-control"
              min={minDate}
              max={maxDate}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="flex-center">
              <CalendarRange size={14} /> End Date
            </label>
            <input
              type="date"
              className="form-control"
              min={startDate || minDate}
              max={maxDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Exclude Weekends Toggle */}
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <input
            type="checkbox"
            id="excludeWeekends"
            checked={excludeWeekends}
            onChange={(e) => setExcludeWeekends(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="excludeWeekends" style={{ margin: 0, cursor: 'pointer', userSelect: 'none', fontSize: '0.875rem' }}>
            Exclude Weekends (Saturdays &amp; Sundays)
          </label>
        </div>

        {/* Reason */}
        <div className="form-group">
          <label>Reason for Leave</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Family wedding, medical checkup..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>

        {/* Summary Details */}
        {calculatedDays > 0 && (
          <div 
            className="flex-between"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              marginBottom: '1.25rem',
              border: '1px solid var(--border-color)'
            }}
          >
            <span className="flex-center text-secondary">
              <CalendarDays size={16} /> Total Days Calculated:
            </span>
            <span style={{ fontWeight: 700 }}>
              {calculatedDays} {calculatedDays === 1 ? 'Day' : 'Days'}
            </span>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block">
          Submit Leave Request
        </button>
      </form>
    </div>
  );
};
