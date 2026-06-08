import { useState, useEffect, useCallback, useRef } from 'react';
import { CalendarDays, LogOut, CheckCircle2, ShieldAlert, UserCircle2, Loader2 } from 'lucide-react';
import type { LeaveRecord, LeaveBalances, AccrualBlock } from './types';
import { Dashboard } from './components/Dashboard';
import { WorkingDaysTracker } from './components/WorkingDaysTracker';
import { LeaveForm } from './components/LeaveForm';
import { LeaveHistory } from './components/LeaveHistory';
import { Simulators } from './components/Simulators';
import { AuthPage } from './components/AuthPage';
import type { AuthSuccessPayload } from './components/AuthPage';
import {
  getLeaves,
  addLeave,
  deleteLeave,
  deleteAllLeaves,
  getSettings,
  saveSettings,
  resetSettings,
} from './lib/leaveService';
import { signOut } from './lib/authService';

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

/** Count how many accrual blocks have been credited by a given date */
function computeAccruedBlocks(dateStr: string, blocks: AccrualBlock[]): number {
  const t = new Date(dateStr).getTime();
  return blocks.filter(b => t >= new Date(b.creditDate).getTime()).length;
}

/** Format a Date as YYYY-MM-DD */
function toDateStr(d: Date): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface ExitSettlement {
  payout: number;
  encashedDays: number;
  forfeitedDays: number;
  dailyRate: number;
}

function App() {
  // ── Auth State ──────────────────────────────────────────────────────────
  const [authUser, setAuthUser] = useState<AuthSuccessPayload | null>(null);
  const [dbLoading, setDbLoading] = useState(false);

  // ── Real-time clock (actual system clock, refreshes every minute) ───────
  const [realToday, setRealToday] = useState<string>(toDateStr(new Date()));
  useEffect(() => {
    const tick = () => setRealToday(toDateStr(new Date()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // --- Simulation States ---
  const [simulatedYear, setSimulatedYear] = useState<number>(2026);
  const [simulatedToday, setSimulatedToday] = useState<string>('2026-06-08');
  const [exitStatus, setExitStatus] = useState<ExitSettlement | null>(null);

  // --- Leaves Logged States ---
  const [leaves2026, setLeaves2026] = useState<LeaveRecord[]>([]);
  const [leaves2027, setLeaves2027] = useState<LeaveRecord[]>([]);

  // --- Rollover States ---
  const [elCarryForwarded, setElCarryForwarded] = useState<number>(0);
  const [archivedLeaves2026, setArchivedLeaves2026] = useState<LeaveRecord[]>([]);

  // Ref to track the current userId without stale closures
  const userIdRef = useRef<string>('');

  // Configuration factors
  const is2026 = simulatedYear === 2026;
  const currentLeaves = is2026 ? leaves2026 : leaves2027;

  // Active Month index bounds for leave ranges (0-indexed)
  const activeMonths = is2026 
    ? { start: 4, end: 11 } // May to Dec (4 to 11)
    : { start: 0, end: 11 }; // Jan to Dec (0 to 11)

  // --- Dynamic Accrual Blocks for EL ---
  const accrualBlocks = generate20DayBlocks(simulatedYear, is2026 ? 4 : 0);

  // Calculate completed accruals based on Simulated Today's Date
  const todayTime = new Date(simulatedToday).getTime();
  const accruedBlocksCount = accrualBlocks.filter(b => todayTime >= new Date(b.creditDate).getTime()).length;

  // Real-time EL (live, based on actual today's date — always 2026 base)
  const realTimeAccrualBlocks = generate20DayBlocks(2026, 4);
  const realTimeAccruedCount = computeAccruedBlocks(realToday, realTimeAccrualBlocks);

  // --- Dynamic Balance Calculations ---
  
  // 1. Casual Leave (CL)
  const clCredited = is2026 ? 6 : 8;
  const clUsed = currentLeaves.filter(l => l.type === 'CL').reduce((sum, l) => sum + l.days, 0);
  const clAvailable = Math.max(0, clCredited - clUsed);

  // 2. Sick Leave (SL)
  const slCredited = is2026 ? 5 : 7;
  const slUsed = currentLeaves.filter(l => l.type === 'SL').reduce((sum, l) => sum + l.days, 0);
  const slAvailable = Math.max(0, slCredited - slUsed);

  // 3. Earned Leave (EL)
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

  // ── DB Hydration on Login ───────────────────────────────────────────────
  const hydrateFromDb = useCallback(async (userId: string) => {
    setDbLoading(true);
    try {
      const [settings, lv2026, lv2027] = await Promise.all([
        getSettings(userId),
        getLeaves(userId, 2026),
        getLeaves(userId, 2027),
      ]);
      setSimulatedYear(settings.simulatedYear);
      setSimulatedToday(settings.simulatedToday);
      setElCarryForwarded(settings.elCarryForwarded);
      setLeaves2026(lv2026);
      setLeaves2027(lv2027);
      if (settings.simulatedYear === 2027) {
        setArchivedLeaves2026(lv2026);
      }
    } catch (err: unknown) {
      console.error(err instanceof Error ? err.message : 'Failed to load data from database.');
    } finally {
      setDbLoading(false);
    }
  }, []);

  const handleAuthSuccess = useCallback((user: AuthSuccessPayload) => {
    userIdRef.current = user.id;
    setAuthUser(user);
    hydrateFromDb(user.id);
  }, [hydrateFromDb]);

  // --- Handlers ---

  const handleApplyLeave = useCallback(async (newLeave: Omit<LeaveRecord, 'id'>) => {
    const userId = userIdRef.current;
    const year = simulatedYear;
    try {
      const tempId = '__temp__' + Date.now();
      const tempRecord: LeaveRecord = { id: tempId, ...newLeave };
      if (year === 2026) {
        setLeaves2026(prev => [...prev, tempRecord]);
      } else {
        setLeaves2027(prev => [...prev, tempRecord]);
      }
      
      const saved = await addLeave(userId, year, newLeave);
      
      if (year === 2026) {
        setLeaves2026(prev => prev.map(l => (l.id === tempId ? saved : l)));
      } else {
        setLeaves2027(prev => prev.map(l => (l.id === tempId ? saved : l)));
      }
    } catch (err) {
      console.error('Failed to save leave:', err);
    }
  }, [simulatedYear]);

  const handleCancelLeave = useCallback(async (id: string) => {
    if (simulatedYear === 2026) {
      setLeaves2026(prev => prev.filter(l => l.id !== id));
    } else {
      setLeaves2027(prev => prev.filter(l => l.id !== id));
    }
    try {
      await deleteLeave(id);
    } catch (err) {
      console.error('Failed to delete leave:', err);
    }
  }, [simulatedYear]);

  const handleRollover = useCallback(async () => {
    if (!is2026) return;
    const userId = userIdRef.current;
    const leftoverEL = elAvailable;

    setElCarryForwarded(leftoverEL);
    setArchivedLeaves2026(leaves2026);
    setSimulatedYear(2027);
    setSimulatedToday('2027-01-01');

    try {
      await saveSettings(userId, {
        simulatedYear: 2027,
        simulatedToday: '2027-01-01',
        elCarryForwarded: leftoverEL,
      });
    } catch (err) {
      console.error('Failed to save rollover settings:', err);
    }
  }, [is2026, elAvailable, leaves2026]);

  const handleSimulatedDateChange = useCallback(async (date: string) => {
    setSimulatedToday(date);
    const userId = userIdRef.current;
    try {
      await saveSettings(userId, {
        simulatedYear,
        simulatedToday: date,
        elCarryForwarded,
      });
    } catch (err) {
      console.error('Failed to persist simulated date:', err);
    }
  }, [simulatedYear, elCarryForwarded]);

  const handleExitCompany = useCallback((payout: number, encashed: number, forfeited: number, dailyRate: number) => {
    setExitStatus({ payout, encashedDays: encashed, forfeitedDays: forfeited, dailyRate });
  }, []);

  const handleResetAll = useCallback(async () => {
    const userId = userIdRef.current;
    setSimulatedYear(2026);
    setSimulatedToday('2026-06-08');
    setExitStatus(null);
    setLeaves2026([]);
    setLeaves2027([]);
    setElCarryForwarded(0);
    setArchivedLeaves2026([]);
    try {
      await Promise.all([
        deleteAllLeaves(userId),
        resetSettings(userId),
      ]);
    } catch (err) {
      console.error('Failed to reset DB data:', err);
    }
  }, []);

  const handleLogout = useCallback(() => {
    signOut();
    setAuthUser(null);
    userIdRef.current = '';
    setSimulatedYear(2026);
    setSimulatedToday('2026-06-08');
    setExitStatus(null);
    setLeaves2026([]);
    setLeaves2027([]);
    setElCarryForwarded(0);
    setArchivedLeaves2026([]);
  }, []);

  // ─── Auth Gate ─────────────────────────────────────────────────────────
  if (!authUser) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // ─── Loading Screen ────────────────────────────────────────────────────
  if (dbLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '1rem',
        background: 'var(--bg-main)',
      }}>
        <Loader2 size={40} className="spin-icon text-info" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Loading your leave data from Turso…
        </p>
      </div>
    );
  }

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Real-time EL counter pill */}
          <div className="realtime-el-pill">
            <span className="realtime-dot" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Live EL</span>
            <span style={{ fontWeight: 700, color: 'var(--el-color)', fontSize: '0.9rem' }}>
              {realTimeAccruedCount}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>days</span>
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

          {/* User + Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="user-avatar-chip">
              <UserCircle2 size={16} className="text-info" />
              <span style={{
                fontSize: '0.8rem', fontWeight: 600,
                maxWidth: '120px', overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {authUser.name}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              title="Sign out"
              style={{ gap: '0.35rem' }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
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
                  onUpdateSimulatedDate={handleSimulatedDateChange}
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
        Prishal Leave Hub © {simulatedYear} • Powered by React, Vite, Turso &amp; Vanilla CSS
      </footer>
    </div>
  );
}

export default App;
