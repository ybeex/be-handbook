'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Menu, X, Trophy, Target, Zap, BookOpen } from 'lucide-react';
import {
  QUESTIONS, SECTIONS,
  type Section, type Difficulty,
} from '@/data/interviewQuestions';
import QuestionCard from '@/components/interview/QuestionCard';
import InterviewSidebar from '@/components/interview/InterviewSidebar';

const STORAGE_KEY = 'bhb_interview_done';

function loadDone(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')); }
  catch { return new Set(); }
}
function saveDone(done: Set<string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...done])); } catch {}
}

export default function InterviewPage() {
  const [activeSection, setActiveSection] = useState<Section>('foundations');
  const [diffFilter, setDiffFilter] = useState<Difficulty | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [done, setDone] = useState<Set<string>>(new Set());
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setDone(loadDone()); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus();
      }
      if (e.key === 'Escape') setMobileSidebar(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const toggleDone = useCallback((id: string) => {
    setDone(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveDone(next);
      return next;
    });
  }, []);

  const visibleQuestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return QUESTIONS.filter(question => {
      if (q) return question.question.toLowerCase().includes(q) || question.answer.toLowerCase().includes(q);
      if (question.section !== activeSection) return false;
      if (diffFilter !== 'all' && question.difficulty !== diffFilter) return false;
      return true;
    });
  }, [activeSection, diffFilter, searchQuery]);

  const doneCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SECTIONS.forEach(s => { counts[s.id] = QUESTIONS.filter(q => q.section === s.id && done.has(q.id)).length; });
    return counts as Record<Section, number>;
  }, [done]);

  const totalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SECTIONS.forEach(s => { counts[s.id] = QUESTIONS.filter(q => q.section === s.id).length; });
    return counts as Record<Section, number>;
  }, []);

  const handleSectionChange = (sec: Section) => {
    setActiveSection(sec);
    setSearchQuery('');
    setMobileSidebar(false);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalDone = done.size;
  const totalQuestions = QUESTIONS.length;
  const currentSectionLabel = searchQuery
    ? `Search: "${searchQuery}"`
    : SECTIONS.find(s => s.id === activeSection)?.label ?? '';

  return (
    <>
      <style>{`
        .interview-answer p { color: #9090b8; line-height: 1.75; margin-bottom: 13px; font-size: 14.5px; }
        .interview-answer p:last-child { margin-bottom: 0; }
        .interview-answer strong { color: #e8e8f5; }
        .interview-answer :not(pre) > code {
          font-family: 'JetBrains Mono', monospace; font-size: 12px;
          background: #14142a; color: #e8c96b; padding: 2px 6px; border-radius: 4px;
        }
        .interview-answer pre {
          background: #08080f; border: 1px solid #1e1e35; border-radius: 10px;
          padding: 15px 18px; overflow-x: auto; margin: 14px 0;
          font-family: 'JetBrains Mono', monospace; font-size: 12.5px; line-height: 1.7;
        }
        .interview-answer pre code { background: none; padding: 0; font-size: 12.5px; }
        .interview-answer .tip {
          display: flex; gap: 11px; background: rgba(201,168,76,0.08);
          border: 1px solid rgba(201,168,76,0.25); border-radius: 9px;
          padding: 13px 16px; margin: 14px 0; font-size: 13.5px; color: #9090b8; line-height: 1.65;
        }
        .interview-answer .tip-ico { flex-shrink: 0; font-size: 15px; margin-top: 1px; }
        .interview-answer .warn {
          display: flex; gap: 11px; background: rgba(248,113,113,0.07);
          border: 1px solid rgba(248,113,113,0.2); border-radius: 9px;
          padding: 13px 16px; margin: 14px 0; font-size: 13.5px; color: #9090b8;
        }
        .interview-answer .warn-ico { color: #f87171; flex-shrink: 0; font-size: 16px; }
        .interview-answer .kp { list-style: none; display: flex; flex-direction: column; gap: 7px; margin: 13px 0; }
        .interview-answer .kp li { display: flex; gap: 9px; align-items: flex-start; font-size: 14px; color: #9090b8; line-height: 1.6; }
        .interview-answer .kp li::before { content: '→'; color: #c9a84c; flex-shrink: 0; font-family: 'JetBrains Mono', monospace; }
        .interview-answer .cmp { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px; }
        .interview-answer .cmp th { background: #14142a; padding: 9px 13px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #50507a; border-bottom: 1px solid #1e1e35; }
        .interview-answer .cmp td { padding: 9px 13px; border-bottom: 1px solid #1e1e35; color: #9090b8; vertical-align: top; line-height: 1.55; }
        .interview-answer .cmp tr:last-child td { border-bottom: none; }
        .interview-answer .cmp td:first-child { color: #e8e8f5; font-weight: 500; }
        @media (max-width: 768px) {
          .interview-answer .cmp { font-size: 11px; }
          .interview-answer .cmp th, .interview-answer .cmp td { padding: 7px 9px; }
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
        }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: '#08080f', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>

        {/* Desktop sidebar */}
        <div className="desktop-sidebar" style={{ width: '272px', minWidth: '272px', borderRight: '1px solid #1e1e35', background: '#0f0f1a', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid #1e1e35', flexShrink: 0 }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '2px', color: '#e8e8f5' }}>
              Interview<span style={{ color: '#c9a84c' }}>Prep</span>
            </div>
            <div style={{ fontSize: '11px', color: '#50507a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Backend Engineering · {totalQuestions} Q
            </div>
          </div>
          <InterviewSidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            doneCounts={doneCounts}
            totalCounts={totalCounts}
            diffFilter={diffFilter}
            onDiffChange={setDiffFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalDone={totalDone}
            totalQuestions={totalQuestions}
          />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileSidebar && (
          <>
            <div onClick={() => setMobileSidebar(false)} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} />
            <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 101, width: '280px', maxWidth: '88vw', background: '#0f0f1a', borderRight: '1px solid #1e1e35', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid #1e1e35', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', fontWeight: 800, color: '#e8e8f5' }}>
                  Interview<span style={{ color: '#c9a84c' }}>Prep</span>
                </div>
                <button onClick={() => setMobileSidebar(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#50507a' }}>
                  <X size={18} />
                </button>
              </div>
              <InterviewSidebar
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
                doneCounts={doneCounts}
                totalCounts={totalCounts}
                diffFilter={diffFilter}
                onDiffChange={setDiffFilter}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                totalDone={totalDone}
                totalQuestions={totalQuestions}
              />
            </div>
          </>
        )}

        {/* Main content */}
        <div ref={contentRef} style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>

          {/* Mobile top bar */}
          <div className="mobile-topbar" style={{ display: 'none', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid #1e1e35', background: 'rgba(8,8,15,0.9)', backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 40 }}>
            <button onClick={() => setMobileSidebar(true)} style={{ background: '#14142a', border: '1px solid #1e1e35', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Menu size={16} color="#9090b8" />
            </button>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '15px', fontWeight: 800, color: '#e8e8f5' }}>
              Interview<span style={{ color: '#c9a84c' }}>Prep</span>
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#50507a' }}>{totalDone}/{totalQuestions}</span>
          </div>

          <div style={{ maxWidth: '860px', margin: '0 auto', padding: 'clamp(24px,4vw,48px) clamp(16px,4vw,40px) 100px' }}>

            {/* Hero — shown only on first section */}
            {!searchQuery && activeSection === SECTIONS[0].id && (
              <div style={{ marginBottom: '48px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '99px', padding: '5px 16px', fontSize: '12px', color: '#c9a84c', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '24px' }}>
                  ⚡ {totalQuestions} deep backend questions with full answers
                </div>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(30px,5vw,52px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.08, marginBottom: '16px', color: '#e8e8f5' }}>
                  Backend Engineering<br /><span style={{ color: '#c9a84c' }}>Interview Prep</span>
                </h1>
                <p style={{ fontSize: '16px', color: '#9090b8', lineHeight: 1.7, maxWidth: '520px', marginBottom: '32px' }}>
                  Deep-dive questions on HTTP, Node.js, databases, APIs, auth, architecture, scaling, DevOps, security, and system design — from easy to hard with full answers.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                  {[
                    { icon: BookOpen, label: 'Questions',  value: `${totalQuestions}`,  color: '#c9a84c' },
                    { icon: Target,   label: 'Topics',     value: '10',   color: '#60a5fa' },
                    { icon: Trophy,   label: 'Completed',  value: `${totalDone}`, color: '#3dd68c' },
                    { icon: Zap,      label: 'Hard',       value: `${QUESTIONS.filter(q => q.difficulty === 'hard').length}`, color: '#f87171' },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: '#0f0f1a', border: '1px solid #1e1e35', borderRadius: '12px', padding: '16px 18px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${stat.color}15`, border: `1px solid ${stat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <stat.icon size={15} color={stat.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: stat.color, fontFamily: 'Playfair Display, serif', lineHeight: 1 }}>{stat.value}</div>
                        <div style={{ fontSize: '11px', color: '#50507a', marginTop: '2px' }}>{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section heading */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: '#e8e8f5', marginBottom: '6px' }}>
                {currentSectionLabel}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', color: '#50507a' }}>
                  {visibleQuestions.length} question{visibleQuestions.length !== 1 ? 's' : ''}
                  {diffFilter !== 'all' && !searchQuery ? ` · ${diffFilter}` : ''}
                </span>
                {!searchQuery && (
                  <span style={{ fontSize: '14px', color: '#3dd68c' }}>
                    {doneCounts[activeSection] ?? 0}/{totalCounts[activeSection] ?? 0} done
                  </span>
                )}
              </div>
            </div>

            {/* Question cards */}
            {visibleQuestions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#50507a' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                <div style={{ fontSize: '16px', marginBottom: '8px', color: '#9090b8' }}>No questions found</div>
                <div style={{ fontSize: '14px' }}>Try adjusting the difficulty filter or search query</div>
              </div>
            ) : (
              visibleQuestions.map((q, i) => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  index={i + 1}
                  done={done.has(q.id)}
                  onToggleDone={() => toggleDone(q.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Floating progress pill */}
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#0f0f1a', border: '1px solid #1e1e35', borderRadius: '12px', padding: '10px 18px', fontSize: '13px', color: '#9090b8', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 50, backdropFilter: 'blur(16px)' }}>
          <Trophy size={14} color="#c9a84c" />
          <span><strong style={{ color: '#c9a84c', fontFamily: 'Playfair Display, serif', fontSize: '15px' }}>{totalDone}</strong> / {totalQuestions} done</span>
        </div>
      </div>
    </>
  );
}
