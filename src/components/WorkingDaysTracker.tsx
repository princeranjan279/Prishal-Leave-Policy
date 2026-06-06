import React from 'react';
import { Calendar, CheckCircle2, Lock, Play, Info } from 'lucide-react';
import type { AccrualBlock } from '../types';

interface WorkingDaysTrackerProps {
  blocks: AccrualBlock[];
  simulatedToday: string;
  simulatedYear: number;
  onUpdateSimulatedDate: (date: string) => void;
  activeMonths: { start: number; end: number };
}

export const WorkingDaysTracker: React.FC<WorkingDaysTrackerProps> = ({
  blocks,
  simulatedToday,
  simulatedYear,
  onUpdateSimulatedDate,
  activeMonths,
}) => {
  const pad = (n: number) => (n < 10 ? `0${n}` : n);
  const minDate = `${simulatedYear}-${pad(activeMonths.start + 1)}-01`;
  
  const getDaysInMonth = (year: number, monthIndex: number) => {
    return new Date(year, monthIndex + 1, 0).getDate();
  };
  const maxDate = `${simulatedYear}-${pad(activeMonths.end + 1)}-${getDaysInMonth(simulatedYear, activeMonths.end)}`;

  // Helpers to count days
  const getDaysDiff = (startStr: string, endStr: string) => {
    const s = new Date(startStr);
    const e = new Date(endStr);
    return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Preset jump buttons
  const setPresetDate = (dateStr: string) => {
    onUpdateSimulatedDate(dateStr);
  };

  // Determine current active block and totals
  const todayTime = new Date(simulatedToday).getTime();
  const creditedCount = blocks.filter(b => todayTime >= new Date(b.creditDate).getTime()).length;

  return (
    <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h3 className="section-title">
          <Calendar className="text-info" size={20} /> Time Simulator &amp; EL Tracker
        </h3>
        <p className="subtitle">
          Change today's date to watch leaves credit automatically every 20 calendar days.
        </p>
      </div>

      {/* Interactive Date Simulator Widget */}
      <div 
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', justifyContent: 'between', width: '100%' }}>
            <span>Simulated "Today's Date"</span>
            <span style={{ marginLeft: 'auto', fontWeight: 600, color: 'var(--info)' }}>{simulatedToday}</span>
          </label>
          <input
            type="date"
            min={minDate}
            max={maxDate}
            value={simulatedToday}
            onChange={(e) => onUpdateSimulatedDate(e.target.value)}
            className="form-control"
            style={{ fontSize: '1rem', fontWeight: 600 }}
          />
        </div>

        {/* Quick jump presets */}
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 600 }}>
            Quick Jump Presets:
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {simulatedYear === 2026 ? (
              <>
                <button 
                  type="button" 
                  onClick={() => setPresetDate('2026-06-06')} 
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  June 6 (Standard)
                </button>
                <button 
                  type="button" 
                  onClick={() => setPresetDate('2026-05-20')} 
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  May 20 (+1 EL)
                </button>
                <button 
                  type="button" 
                  onClick={() => setPresetDate('2026-09-17')} 
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  Sept 17 (+7 EL)
                </button>
                <button 
                  type="button" 
                  onClick={() => setPresetDate('2026-12-31')} 
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  Dec 31 (Cycle End)
                </button>
              </>
            ) : (
              <>
                <button 
                  type="button" 
                  onClick={() => setPresetDate('2027-01-01')} 
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  Jan 1 (New Year)
                </button>
                <button 
                  type="button" 
                  onClick={() => setPresetDate('2027-06-15')} 
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  June 15 (Mid-Year)
                </button>
                <button 
                  type="button" 
                  onClick={() => setPresetDate('2027-12-31')} 
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem' }}
                >
                  Dec 31 (Year End)
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* EL Accrual Timeline Blocks */}
      <div>
        <div className="flex-between mb-2">
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            20-Day Accrual Schedule
          </h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
            {creditedCount} / {blocks.length} Blocks Credited
          </span>
        </div>

        <div 
          style={{ 
            maxHeight: '260px', 
            overflowY: 'auto', 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(0, 0, 0, 0.15)'
          }}
        >
          {blocks.map((block) => {
            const blockStart = new Date(block.startDate).getTime();
            const blockCredit = new Date(block.creditDate).getTime();
            
            let status: 'credited' | 'in-progress' | 'locked' = 'locked';
            let progressText = '';
            let progressPercent = 0;

            if (todayTime >= blockCredit) {
              status = 'credited';
            } else if (todayTime >= blockStart) {
              status = 'in-progress';
              const daysCompleted = getDaysDiff(block.startDate, simulatedToday);
              progressText = `${daysCompleted} / 20 days`;
              progressPercent = (daysCompleted / 20) * 100;
            }

            return (
              <div 
                key={block.index} 
                className="flex-between"
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--border-color)',
                  opacity: status === 'locked' ? 0.45 : 1,
                  backgroundColor: status === 'in-progress' ? 'rgba(99, 102, 241, 0.05)' : '',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span 
                      style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 700, 
                        color: status === 'credited' ? 'var(--success)' : status === 'in-progress' ? 'var(--info)' : 'var(--text-muted)'
                      }}
                    >
                      Block #{block.index}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                      {block.startDate.slice(5).replace('-', '/')} to {block.endDate.slice(5).replace('-', '/')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    Credit date: {block.creditDate}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {status === 'credited' && (
                    <span className="badge badge-el flex-center" style={{ gap: '0.25rem' }}>
                      <CheckCircle2 size={12} /> Credited
                    </span>
                  )}
                  {status === 'in-progress' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                      <span className="badge flex-center" style={{ gap: '0.25rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--info)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                        <Play size={10} className="text-info" /> {progressText}
                      </span>
                      {/* Sub-bar showing progress in active block */}
                      <div style={{ width: '60px', height: '3px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: 'var(--info)' }}></div>
                      </div>
                    </div>
                  )}
                  {status === 'locked' && (
                    <span className="badge flex-center" style={{ gap: '0.25rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                      <Lock size={10} /> Locked
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-center text-muted" style={{ fontSize: '0.75rem' }}>
        <Info size={12} />
        <span>EL accrues automatically. Changes to Simulated Date will instantly update your balance.</span>
      </div>
    </div>
  );
};
