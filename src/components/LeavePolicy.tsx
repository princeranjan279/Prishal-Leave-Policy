import React, { useState } from 'react';
import {
  BookOpen, Calendar, Heart, Award, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle2, Info, Clock, FileText, ShieldAlert,
  ArrowRight, Ban, RefreshCw, IndianRupee
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgAlpha: string;
  borderAlpha: string;
  content: React.ReactNode;
}

export const LeavePolicy: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>('cl');

  const toggle = (id: string) => setOpenSection(prev => prev === id ? null : id);

  const Rule: React.FC<{ icon?: React.ReactNode; children: React.ReactNode; type?: 'info' | 'warning' | 'success' | 'danger' }> = ({
    icon, children, type = 'info'
  }) => {
    const colors: Record<string, string> = {
      info: 'var(--info)',
      warning: 'var(--warning)',
      success: 'var(--success)',
      danger: 'var(--danger)',
    };
    return (
      <div style={{
        display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
        padding: '0.6rem 0.75rem',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: `rgba(${type === 'info' ? '59,130,246' : type === 'warning' ? '245,158,11' : type === 'success' ? '16,185,129' : '239,68,68'}, 0.07)`,
        borderLeft: `3px solid ${colors[type]}`,
        fontSize: '0.83rem',
        lineHeight: 1.55,
        color: 'var(--text-primary)',
      }}>
        <span style={{ color: colors[type], marginTop: '2px', flexShrink: 0 }}>
          {icon ?? <ArrowRight size={13} />}
        </span>
        <span>{children}</span>
      </div>
    );
  };

  const TableRow: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.55rem 0.75rem',
      borderRadius: 'var(--radius-sm)',
      backgroundColor: 'var(--bg-surface-elevated)',
      fontSize: '0.83rem',
    }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
        {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub}</div>}
      </div>
    </div>
  );

  const sections: Section[] = [
    {
      id: 'cl',
      title: 'Casual Leave (CL)',
      icon: <Calendar size={16} />,
      color: 'var(--cl-color)',
      bgAlpha: 'var(--cl-bg-alpha)',
      borderAlpha: 'var(--cl-border-alpha)',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {/* Entitlement Table */}
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entitlement</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <TableRow label="Full Year (Jan–Dec)" value="8 Days" sub="Full Pay" />
            <TableRow label="Q1 Joiner (Jan–Mar)" value="8 Days" sub="Full Year Credit" />
            <TableRow label="Q2 Joiner (Apr–Jun)" value="6 Days" sub="Pro-rata" />
            <TableRow label="Q3 Joiner (Jul–Sep)" value="4 Days" sub="Pro-rata" />
            <TableRow label="Q4 Joiner (Oct–Dec)" value="2 Days" sub="Pro-rata" />
            <TableRow label="Crediting Schedule" value="Quarterly" sub="2 days on 1 Jan, Apr, Jul, Oct" />
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usage Rules</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Rule icon={<CheckCircle2 size={13} />} type="success">For short-term personal needs, urgent domestic obligations, or unforeseen circumstances.</Rule>
            <Rule icon={<Info size={13} />} type="info">Minimum: <strong>half a day</strong>. Maximum: <strong>3 consecutive working days</strong> at a stretch.</Rule>
            <Rule icon={<Clock size={13} />} type="info">Advance notice: minimum <strong>2 working days</strong>. Emergencies may be regularised on return.</Rule>
            <Rule icon={<Ban size={13} />} type="danger">Cannot be combined with Sick Leave.</Rule>
            <Rule icon={<Info size={13} />} type="info">May be combined with weekly offs or holidays at the Reporting Manager's discretion.</Rule>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Carry Forward & Encashment</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Rule icon={<ShieldAlert size={13} />} type="warning">Unused CL <strong>lapses at end of calendar year</strong> — cannot be carried forward.</Rule>
            <Rule icon={<Ban size={13} />} type="danger">CL is <strong>not encashable</strong> under any circumstances.</Rule>
          </div>
        </div>
      ),
    },
    {
      id: 'sl',
      title: 'Sick Leave (SL)',
      icon: <Heart size={16} />,
      color: 'var(--sl-color)',
      bgAlpha: 'var(--sl-bg-alpha)',
      borderAlpha: 'var(--sl-border-alpha)',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entitlement</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <TableRow label="Full Year (Jan–Dec)" value="7 Days" sub="Full Pay" />
            <TableRow label="Q1 Joiner (Jan–Mar)" value="7 Days" sub="Full Year Credit" />
            <TableRow label="Q2 Joiner (Apr–Jun)" value="5 Days" sub="Pro-rata" />
            <TableRow label="Q3 Joiner (Jul–Sep)" value="4 Days" sub="Pro-rata" />
            <TableRow label="Q4 Joiner (Oct–Dec)" value="2 Days" sub="Pro-rata" />
            <TableRow label="Crediting Schedule" value="Start of Year" sub="Or pro-rata for new joiners" />
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usage Rules</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Rule icon={<CheckCircle2 size={13} />} type="success">For absence due to illness, injury, or medical treatment of the employee.</Rule>
            <Rule icon={<Clock size={13} />} type="warning">Inform Reporting Manager (call/email/message) by <strong>10:30 AM</strong> on the first day of absence.</Rule>
            <Rule icon={<FileText size={13} />} type="info">Medical certificate from a registered practitioner is <strong>mandatory for 2+ consecutive days</strong> of absence.</Rule>
            <Rule icon={<Ban size={13} />} type="danger">Cannot be combined with Casual Leave.</Rule>
            <Rule icon={<Info size={13} />} type="info">If SL is exhausted, further illness-related absence may be adjusted against EL or treated as Loss of Pay (LOP).</Rule>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hospitalisation</div>
          <Rule icon={<AlertCircle size={13} />} type="warning">For serious illness or hospitalisation, EL or a sabbatical may be applied at HR Head's discretion. Hospital admission/discharge documents must be submitted.</Rule>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Carry Forward & Encashment</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Rule icon={<ShieldAlert size={13} />} type="warning">Unused SL <strong>lapses at year-end</strong>.</Rule>
            <Rule icon={<Ban size={13} />} type="danger">SL is <strong>not encashable</strong>.</Rule>
          </div>
        </div>
      ),
    },
    {
      id: 'el',
      title: 'Earned Leave (EL)',
      icon: <Award size={16} />,
      color: 'var(--el-color)',
      bgAlpha: 'var(--el-bg-alpha)',
      borderAlpha: 'var(--el-border-alpha)',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Eligibility & Entitlement</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <TableRow label="Annual Entitlement" value="18 Days" sub="After 240 days of service in previous year" />
            <TableRow label="Accrual Rate" value="1 day per 20 days worked" sub="Accrues throughout the year" />
            <TableRow label="New Joiners Eligible After" value="240 Days of Service" sub="From date of joining" />
            <TableRow label="Maximum Accumulation Cap" value="45 Days" sub="Statutory limit — excess lapses" />
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Application & Approval</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Rule icon={<Clock size={13} />} type="info">For EL up to <strong>5 days</strong>: minimum <strong>7 working days</strong> advance notice. Approved by Reporting Manager.</Rule>
            <Rule icon={<Clock size={13} />} type="warning">For EL exceeding <strong>5 days</strong>: minimum <strong>15 working days</strong> advance notice. Requires both Reporting Manager & Department Head approval.</Rule>
            <Rule icon={<Info size={13} />} type="info">Maximum continuous EL per instance: <strong>15 working days</strong>, except in special cases approved by HR Head.</Rule>
            <Rule icon={<AlertCircle size={13} />} type="warning">EL approval is always contingent upon business requirements and team coverage.</Rule>
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Carry Forward & Encashment</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Rule icon={<RefreshCw size={13} />} type="success">Unused EL <strong>carries forward</strong> to the next year (up to 45-day statutory cap).</Rule>
            <Rule icon={<IndianRupee size={13} />} type="success">EL is <strong>encashable at separation</strong> (resignation, retirement, or non-misconduct termination).</Rule>
            <Rule icon={<Info size={13} />} type="info">Encashment Formula: <strong>(Basic + DA) ÷ 30 × Number of EL days encashable</strong>.</Rule>
            <Rule icon={<Info size={13} />} type="info">Company may offer in-service EL encashment once a year for accrued leave above 30 days (at discretion).</Rule>
            <Rule icon={<ShieldAlert size={13} />} type="warning">EL accrued beyond the 45-day cap shall lapse unless encashed at year-end.</Rule>
          </div>
        </div>
      ),
    },
    {
      id: 'general',
      title: 'General Rules & Compliance',
      icon: <BookOpen size={16} />,
      color: '#f59e0b',
      bgAlpha: 'rgba(245,158,11,0.08)',
      borderAlpha: 'rgba(245,158,11,0.25)',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Working Days & Hours</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <TableRow label="Working Days" value="Mon – Sat" sub="6 days per week" />
            <TableRow label="Working Hours" value="10:15 AM – 7:00 PM" sub="8 effective hours (45-min break)" />
            <TableRow label="Weekly Off" value="Sunday (Paid)" sub="Every Sunday is a paid weekly holiday" />
            <TableRow label="Max Hours/Week" value="48 Hours" sub="Statutory limit per Bihar Act, 2025" />
          </div>

          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>National Holidays (3 Days — Mandatory)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Rule icon={<CheckCircle2 size={13} />} type="success">Republic Day — 26 January</Rule>
            <Rule icon={<CheckCircle2 size={13} />} type="success">Independence Day — 15 August</Rule>
            <Rule icon={<CheckCircle2 size={13} />} type="success">Gandhi Jayanti — 2 October</Rule>
          </div>

          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Festival Holidays (8 Days — as declared by Company)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
            {['Makar Sankranti','Holi','Janmashtami','Raksha Bandhan','Vijay Dashmi','Diwali','Chatt Puja (Day 1)','Chatt Puja (Day 2)'].map(h => (
              <Rule key={h} icon={<CheckCircle2 size={13} />} type="info">{h}</Rule>
            ))}
          </div>

          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compensatory Off (Comp-Off)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Rule icon={<Info size={13} />} type="info">If required to work on a Sunday or notified holiday (at Company's request), employee earns <strong>1 day Comp-Off</strong>.</Rule>
            <Rule icon={<Clock size={13} />} type="warning">Comp-Off must be availed within <strong>60 days</strong> of accrual — failing which it lapses.</Rule>
            <Rule icon={<AlertCircle size={13} />} type="warning">Requires pre-approval from Reporting Manager to qualify. Cannot be encashed. Non-cumulative beyond 60 days.</Rule>
          </div>

          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loss of Pay (LOP)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Rule icon={<ShieldAlert size={13} />} type="danger">Once all leave categories are exhausted, any further absence is treated as <strong>Loss of Pay (LOP)</strong>.</Rule>
            <Rule icon={<Info size={13} />} type="info">LOP Deduction: (Monthly Gross Salary ÷ Number of paid days in month).</Rule>
            <Rule icon={<AlertCircle size={13} />} type="danger"><strong>3+ consecutive unauthorised days</strong> may be treated as abandonment of service and invite disciplinary proceedings.</Rule>
            <Rule icon={<Info size={13} />} type="warning">LOP days do <strong>not count</strong> towards EL accrual or annual increment cycles.</Rule>
          </div>

          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leave During Notice Period</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Rule icon={<Ban size={13} />} type="danger">CL and EL <strong>cannot be availed</strong> during the notice period without prior written approval of HR Head.</Rule>
            <Rule icon={<Info size={13} />} type="info">SL may be availed only with a valid medical certificate from a registered practitioner.</Rule>
            <Rule icon={<AlertCircle size={13} />} type="warning">Any unapproved leave during notice period shall <strong>extend the notice period</strong> by equivalent days.</Rule>
          </div>

          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statutory Basis</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <Rule icon={<FileText size={13} />} type="info">Bihar Shops & Establishments (Regulation of Employment & Conditions of Service) Act, 2025</Rule>
            <Rule icon={<FileText size={13} />} type="info">Maternity Benefit Act, 1961 (as amended in 2017)</Rule>
            <Rule icon={<FileText size={13} />} type="info">Industrial Employment (Standing Orders) Act, 1946</Rule>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 className="section-title" style={{ marginBottom: '0.35rem' }}>
          <BookOpen className="text-warning" size={20} /> Leave Policy — Prishal Technolabs Pvt Ltd
        </h3>
        <p className="subtitle" style={{ fontSize: '0.82rem' }}>
          HR-POL-001 · v1.0 · Effective 2 May 2026 · Governed by Bihar Shops &amp; Establishments Act, 2025
        </p>
      </div>

      {/* Quick Summary Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.6rem',
        marginBottom: '1.25rem',
      }}>
        {[
          { label: 'Casual Leave', days: '8 days/yr', color: 'var(--cl-color)', bg: 'var(--cl-bg-alpha)', border: 'var(--cl-border-alpha)', note: 'Quarterly Credit • No Carry-fwd' },
          { label: 'Sick Leave', days: '7 days/yr', color: 'var(--sl-color)', bg: 'var(--sl-bg-alpha)', border: 'var(--sl-border-alpha)', note: 'Jan Credit • Lapses Year-end' },
          { label: 'Earned Leave', days: '18 days/yr', color: 'var(--el-color)', bg: 'var(--el-bg-alpha)', border: 'var(--el-border-alpha)', note: '1 per 20 days • Cap: 45 days' },
        ].map(item => (
          <div key={item.label} style={{
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: item.bg,
            border: `1px solid ${item.border}`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{item.label}</div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: item.color }}>{item.days}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.note}</div>
          </div>
        ))}
      </div>

      {/* Accordion Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {sections.map(sec => (
          <div key={sec.id} style={{
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${openSection === sec.id ? sec.borderAlpha : 'var(--border-color)'}`,
            overflow: 'hidden',
            transition: 'border-color 0.2s ease',
          }}>
            {/* Accordion Header */}
            <button
              type="button"
              onClick={() => toggle(sec.id)}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                background: openSection === sec.id ? sec.bgAlpha : 'var(--bg-surface-elevated)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ color: sec.color }}>{sec.icon}</span>
                <span style={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: openSection === sec.id ? sec.color : 'var(--text-primary)',
                  fontFamily: 'var(--font-heading)',
                }}>
                  {sec.title}
                </span>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>
                {openSection === sec.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>

            {/* Accordion Body */}
            {openSection === sec.id && (
              <div style={{
                padding: '1rem',
                borderTop: `1px solid ${sec.borderAlpha}`,
                backgroundColor: 'var(--bg-surface)',
              }}>
                {sec.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div style={{
        marginTop: '1rem',
        padding: '0.6rem 0.85rem',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.15)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'flex-start',
      }}>
        <Info size={12} style={{ color: 'var(--info)', marginTop: 1, flexShrink: 0 }} />
        <span>
          This policy supersedes all earlier leave-related communications or practices. Any conflict between this Policy and applicable law shall be resolved in favour of the law. Policy reviewed annually by HR Department.
        </span>
      </div>
    </div>
  );
};
