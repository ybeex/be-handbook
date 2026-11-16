'use client';

import { SECTIONS, type Section, type Difficulty } from '@/data/interviewQuestions';

interface InterviewSidebarProps {
  activeSection: Section;
  onSectionChange: (s: Section) => void;
  doneCounts: Record<Section, number>;
  totalCounts: Record<Section, number>;
  diffFilter: Difficulty | 'all';
  onDiffChange: (d: Difficulty | 'all') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalDone: number;
  totalQuestions: number;
}

const DIFF_OPTS: { value: Difficulty | 'all'; label: string; color: string }[] = [
  { value: 'all',    label: 'All',    color: '#9090b8' },
  { value: 'easy',   label: 'Easy',   color: '#3dd68c' },
  { value: 'medium', label: 'Medium', color: '#fb923c' },
  { value: 'hard',   label: 'Hard',   color: '#f87171' },
];

export default function InterviewSidebar({
  activeSection, onSectionChange, doneCounts, totalCounts,
  diffFilter, onDiffChange, searchQuery, onSearchChange,
  totalDone, totalQuestions,
}: InterviewSidebarProps) {
  const pct = totalQuestions ? Math.round((totalDone / totalQuestions) * 100) : 0;
  const frontend = SECTIONS.slice(0, 5);
  const backend  = SECTIONS.slice(5);

  const NavItem = ({ sec }: { sec: typeof SECTIONS[0] }) => {
    const done  = doneCounts[sec.id] ?? 0;
    const total = totalCounts[sec.id] ?? 0;
    const allDone = done === total && total > 0;
    const active = activeSection === sec.id;
    return (
      <button
        onClick={() => onSectionChange(sec.id)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '7px 10px', borderRadius: '8px',
          cursor: 'pointer', marginBottom: '2px', textAlign: 'left',
          border: `1px solid ${active ? 'rgba(201,168,76,0.3)' : 'transparent'}`,
          background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
          color: active ? '#c9a84c' : '#9090b8', fontWeight: active ? 500 : 400,
          fontFamily: 'Inter, sans-serif', fontSize: '13px', transition: 'all 0.15s',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '15px', height: '15px', borderRadius: '50%', flexShrink: 0,
            border: `1.5px solid ${allDone ? '#3dd68c' : '#2a2a45'}`,
            background: allDone ? '#3dd68c' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '8px', color: '#08080f', fontWeight: 700,
          }}>
            {allDone ? '✓' : ''}
          </span>
          {sec.label}
        </span>
        <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '99px', background: '#14142a', border: '1px solid #1e1e35', color: '#50507a' }}>
          {done}/{total}
        </span>
      </button>
    );
  };

  const GroupLabel = ({ label }: { label: string }) => (
    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#50507a', padding: '4px 10px 7px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#50507a', display: 'inline-block' }} />
      {label}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Search */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e1e35' }}>
        <input
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search questions… ( / )"
          style={{
            width: '100%', background: '#14142a', border: '1px solid #1e1e35',
            borderRadius: '9px', padding: '8px 12px', fontSize: '13px',
            color: '#e8e8f5', fontFamily: 'Inter, sans-serif', outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => (e.target.style.borderColor = 'rgba(201,168,76,0.4)')}
          onBlur={e  => (e.target.style.borderColor = '#1e1e35')}
        />
      </div>

      {/* Progress */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e1e35' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#50507a', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <span>Progress</span>
          <span>{totalDone} / {totalQuestions} ({pct}%)</span>
        </div>
        <div style={{ height: '3px', background: '#1e1e35', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #c9a84c, #e8c96b)', borderRadius: '99px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Difficulty filter */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e1e35', display: 'flex', gap: '5px' }}>
        {DIFF_OPTS.map(opt => (
          <button key={opt.value} onClick={() => onDiffChange(opt.value)} style={{
            flex: 1, padding: '4px 0', borderRadius: '6px', fontSize: '11px', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'center',
            border: `1px solid ${diffFilter === opt.value ? opt.color + '40' : '#1e1e35'}`,
            background: diffFilter === opt.value ? `${opt.color}12` : 'transparent',
            color: diffFilter === opt.value ? opt.color : '#50507a',
            transition: 'all 0.15s',
          }}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        <GroupLabel label="Networking & Runtime" />
        {frontend.map(sec => <NavItem key={sec.id} sec={sec} />)}
        <div style={{ margin: '10px 0 6px', height: '1px', background: '#1e1e35' }} />
        <GroupLabel label="Data, APIs & Systems" />
        {backend.map(sec => <NavItem key={sec.id} sec={sec} />)}
      </div>
    </div>
  );
}
