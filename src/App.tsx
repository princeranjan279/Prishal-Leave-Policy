import { useState } from 'react';
import { CalendarDays, LogOut, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { LeaveRecord, LeaveBalances, AccrualBlock } from './types';
import { Dashboard } from './components/Dashboard';
import { WorkingDaysTracker } from './components/WorkingDaysTracker';
import { LeaveForm } from './components/LeaveForm';
import { LeaveHistory } from './components/LeaveHistory';
import { Simulators } from './components/Simulators';

// Helper to generate 20-day calendar blocks for Earned Leave accrual
const generate20DayBlocks = (year: number, startMonth: number): AccrualBlock[] => {
  const blocks: AccrualBlock[] = [];
  const start = new Date(year, startMonth, 1);
  const endOfYear = new Date(year, 11, 31);
  
  let currentStart = new Date(start);
  let index = 1;
  
  while (true) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 19);
    
    if (currentEnd > endOfYear) {
      break;
    }
    
    const pad = (n: number) => (n < 10 ? `0${n}` : n);
    const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    
    blocks.push({
      index,
      startDate: formatDate(currentStart),
      endDate: formatDate(currentEnd),
      creditDate: formatDate(currentEnd),
    });
    
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
    index++;
  }
  return blocks;
};

interface ExitSettlement {
  payout: number;
  encashedDays: number;
  forfeitedDays: number;
  dailyRate: number;
}

function App() {
  // --- Simulation States ---
  const [simulatedYear, setSimulatedYear] = useState<number>(2026);
  const [simulatedToday, setSimulatedToday] = useState<string>('2026-06-06'); // Real current metadata date
  const [exitStatus, setExitStatus] = useState<ExitSettlement | null>(null);

  // --- Leaves Logged States ---
  const [leaves2026, setLeaves2026] = useState<LeaveRecord[]>([]);
  const [leaves2027, setLeaves2027] = useState<LeaveRecord[]>([]);

  // --- Rollover States ---
  const [elCarryForwarded, setElCarryForwarded] = useState<number>(0);
  const [archivedLeaves2026, setArchivedLeaves2026] = useState<LeaveRecord[]>([]);

  // Configuration factors
  const is2026 = simulatedYear === 2026;
  const currentLeaves = is2026 ? leaves2026 : leaves2027;
  const setLeaves = is2026 ? setLeaves2026 : setLeaves2027;

  // Active Month index bounds for leave ranges (0-indexed)
  const activeMonths = is2026 
    ? { start: 4, end: 11 } // May to Dec (4 to 11)
    : { start: 0, end: 11 }; // Jan to Dec (0 to 11)

  // --- Dynamic Accrual Blocks for EL ---
  const accrualBlocks = generate20DayBlocks(simulatedYear, is2026 ? 4 : 0);

  // Calculate completed accruals based on Simulated Today's Date
  const todayTime = new Date(simulatedToday).getTime();
  const accruedBlocksCount = accrualBlocks.filter(b => todayTime >= new Date(b.creditDate).getTime()).length;

  // --- Dynamic Balance Calculations ---
  
  // 1. Casual Leave (CL)
  // 2026: May to Dec (8 months). Credits occur in June, Sept, Dec => 3 quarters active => 6 CL.
  // 2027: Jan to Dec (12 months). Credits occur in March, June, Sept, Dec => 4 quarters active => 8 CL.
  const clCredited = is2026 ? 6 : 8;
  const clUsed = currentLeaves.filter(l => l.type === 'CL').reduce((sum, l) => sum + l.days, 0);
  const clAvailable = Math.max(0, clCredited - clUsed);

  // 2. Sick Leave (SL)
  // 2026: May to Dec (8 months). Pro-rata: 7 * 8/12 = 5 SL.
  // 2027: Jan to Dec (12 months). Full year: 7 SL.
  const slCredited = is2026 ? 5 : 7;
  const slUsed = currentLeaves.filter(l => l.type === 'SL').reduce((sum, l) => sum + l.days, 0);
  const slAvailable = Math.max(0, slCredited - slUsed);

  // 3. Earned Leave (EL)
  // Credited as 1 day for each completed 20-day block + carry forwarded from 2026
  const elCredited = accruedBlocksCount + (is2026 ? 0 : elCarryForwarded);
  const elUsed = currentLeaves.filter(l => l.type === 'EL').reduce((sum, l) => sum + l.days, 0);
  const elAvailable = Math.max(0, elCredited - elUsed);

  // Consolidated Balance Object
  const balances: LeaveBalances = {
    CL: { available: clAvailable, credited: clCredited, used: clUsed },
    SL: { available: slAvailable, credited: slCredited, used: slUsed },
    EL: { 
      available: elAvailable, 
      credited: elCredited, 
      used: elUsed, 
      accruedBlocksCount, 
      carryForwarded: is2026 ? 0 : elCarryForwarded 
    }
  };

  // --- Handlers ---

  const handleApplyLeave = (newLeave: Omit<LeaveRecord, 'id'>) => {
    const record: LeaveRecord = {
      ...newLeave,
      id: Math.random().toString(36).substring(2, 9),
    };
    setLeaves(prev => [...prev, record]);
  };

  const handleCancelLeave = (id: string) => {
    setLeaves(prev => prev.filter(l => l.id !== id));
  };

  const handleRollover = () => {
    if (!is2026) return;
    
    // Carry forward remaining EL
    const leftoverEL = elAvailable;
    setElCarryForwarded(leftoverEL);
    
    // Archive 2026 leaves
    setArchivedLeaves2026(leaves2026);
    
    // Roll year to 2027 and adjust simulated today date to start of year
    setSimulatedYear(2027);
    setSimulatedToday('2027-01-01');
  };

  const handleExitCompany = (payout: number, encashed: number, forfeited: number, dailyRate: number) => {
    setExitStatus({
      payout,
      encashedDays: encashed,
      forfeitedDays: forfeited,
      dailyRate
    });
  };

  const handleResetAll = () => {
    setSimulatedYear(2026);
    setSimulatedToday('2026-06-06');
    setExitStatus(null);
    setLeaves2026([]);
    setLeaves2027([]);
    setElCarryForwarded(0);
    setArchivedLeaves2026([]);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Top Banner / Navigation */}
      <header 
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
          padding: '1.25rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }} className="flex-center">
            <CalendarDays className="text-info" size={24} /> PRISHAL LEAVE HUB
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Interactive Leave Entitlement &amp; Settlement System
          </p>
        </div>

        {/* Year Indicator & Reset buttons */}
        <div className="sim-banner">
          <div className="sim-info">
            <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Leave Cycle:</span>
            <span style={{ color: '#fff', fontWeight: 700 }}>
              {is2026 ? 'May - Dec 2026 (Pro-rata Active)' : 'Jan - Dec 2027 (Full Year)'}
            </span>
          </div>
          <span 
            className="badge" 
            style={{ 
              backgroundColor: is2026 ? 'var(--cl-bg-alpha)' : 'var(--el-bg-alpha)', 
              color: is2026 ? 'var(--cl-color)' : 'var(--el-color)',
              border: `1px solid ${is2026 ? 'var(--cl-border-alpha)' : 'var(--el-border-alpha)'}`
            }}
          >
            FY {simulatedYear}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="app-container">
        
        {/* Sidebar Column: Summary & Simulation triggers */}
        <section className="sidebar-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Active Status Badge if exited */}
          {exitStatus ? (
            <div 
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center'
              }}
            >
              <div className="flex-center text-danger" style={{ justifyContent: 'center', fontWeight: 700 }}>
                <ShieldAlert size={16} /> Employee Exited
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Simulating exit &amp; encashment settlement.
              </p>
            </div>
          ) : (
            <div 
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid var(--success)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                textAlign: 'center'
              }}
            >
              <div className="flex-center text-success" style={{ justifyContent: 'center', fontWeight: 700 }}>
                <CheckCircle2 size={16} /> Employee Active
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                All systems online. Accessing live dashboards.
              </p>
            </div>
          )}

          {/* Simulators Widget */}
          <Simulators
            balances={balances}
            simulatedYear={simulatedYear}
            onRollover={handleRollover}
            onExitCompany={handleExitCompany}
            onResetAll={handleResetAll}
          />

          {/* Past Archives list */}
          {!is2026 && archivedLeaves2026.length > 0 && (
            <div className="glass-card" style={{ borderLeft: '4px solid var(--text-muted)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                FY 2026 Archive
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Your leave activity for 2026 has been locked.
              </p>
              <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div className="flex-between">
                  <span>CL used:</span>
                  <span>{archivedLeaves2026.filter(l => l.type === 'CL').reduce((s, l) => s + l.days, 0)} days</span>
                </div>
                <div className="flex-between">
                  <span>SL used:</span>
                  <span>{archivedLeaves2026.filter(l => l.type === 'SL').reduce((s, l) => s + l.days, 0)} days</span>
                </div>
                <div className="flex-between">
                  <span>EL used:</span>
                  <span>{archivedLeaves2026.filter(l => l.type === 'EL').reduce((s, l) => s + l.days, 0)} days</span>
                </div>
                <div className="flex-between" style={{ fontWeight: 600, color: 'var(--el-color)' }}>
                  <span>Carried over EL:</span>
                  <span>{elCarryForwarded} days</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Content Column */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {exitStatus ? (
            /* Exited / Resigned Screen overlay */
            <div className="exit-splash">
              <LogOut size={48} className="text-danger" style={{ marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                Resignation / Exit Settlement Slip
              </h2>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem' }}>
                Your resignation exit settlement has been simulated. Below is your leave compensation summary.
              </p>

              <div 
                style={{
                  maxWidth: '450px',
                  margin: '0 auto 2rem',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  textAlign: 'left'
                }}
              >
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  Settlement Breakdown
                </h3>
                
                <div className="flex-between mb-3" style={{ fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Accumulated EL Days:</span>
                  <span style={{ fontWeight: 600 }}>
                    {balances.EL.available} {balances.EL.available === 1 ? 'Day' : 'Days'}
                  </span>
                </div>

                <div className="flex-between mb-3" style={{ fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Eligible for Encashment (Cap 45):</span>
                  <span className="text-success" style={{ fontWeight: 600 }}>
                    {exitStatus.encashedDays} Days
                  </span>
                </div>

                <div className="flex-between mb-3" style={{ fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Uncompensated / Forfeited Days:</span>
                  <span className={exitStatus.forfeitedDays > 0 ? 'text-danger' : ''} style={{ fontWeight: 600 }}>
                    {exitStatus.forfeitedDays} Days
                  </span>
                </div>

                <div className="flex-between mb-3" style={{ fontSize: '0.95rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Daily Wage Multiplier:</span>
                  <span style={{ fontWeight: 600 }}>
                    {exitStatus.dailyRate.toLocaleString()} / Day
                  </span>
                </div>

                <div className="divider" style={{ margin: '1rem 0' }} />

                <div className="flex-between" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  <span>Final Net Payout:</span>
                  <span className="text-success">
                    {exitStatus.payout.toLocaleString()}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  type="button" 
                  onClick={() => setExitStatus(null)} 
                  className="btn btn-primary"
                >
                  Cancel Exit &amp; Rejoin Company
                </button>
                <button 
                  type="button" 
                  onClick={handleResetAll} 
                  className="btn btn-secondary"
                >
                  Reset Dashboard
                </button>
              </div>
            </div>
          ) : (
            /* Active Dashboard and Interactive Panels */
            <>
              {/* Balances Dashboard */}
              <Dashboard balances={balances} simulatedYear={simulatedYear} />

              <div className="grid-2">
                {/* Apply Leave Panel */}
                <LeaveForm
                  balances={balances}
                  existingLeaves={currentLeaves}
                  simulatedYear={simulatedYear}
                  activeMonths={activeMonths}
                  onApplyLeave={handleApplyLeave}
                />

                {/* Simulated Time & EL Timeline Panel */}
                <WorkingDaysTracker
                  blocks={accrualBlocks}
                  simulatedToday={simulatedToday}
                  simulatedYear={simulatedYear}
                  onUpdateSimulatedDate={setSimulatedToday}
                  activeMonths={activeMonths}
                />
              </div>

              {/* History Timeline */}
              <LeaveHistory
                leaves={currentLeaves}
                onCancelLeave={handleCancelLeave}
              />
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer 
        style={{
          marginTop: 'auto',
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-color)',
          padding: '1.5rem 2rem',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}
      >
        Prishal Leave Hub © {simulatedYear} • Powered by React, Vite &amp; Vanilla CSS • Designed for visual excellence.
      </footer>
    </div>
  );
}

export default App;
