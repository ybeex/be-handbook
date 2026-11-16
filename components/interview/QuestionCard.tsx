'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Minus, CheckCircle } from 'lucide-react';
import { highlightCodeBlocks } from '@/lib/highlight';
import type { Question, Difficulty } from '@/data/interviewQuestions';

const DIFF_COLORS: Record<Difficulty, { color: string; bg: string }> = {
  easy:   { color: '#3dd68c', bg: 'rgba(61,214,140,0.1)' },
  medium: { color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  hard:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
};

interface QuestionCardProps {
  question: Question;
  index: number;
  done: boolean;
  onToggleDone: () => void;
}

export default function QuestionCard({ question, index, done, onToggleDone }: QuestionCardProps) {
  const [open, setOpen] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);
  const diff = DIFF_COLORS[question.difficulty];

  useEffect(() => {
    if (open && answerRef.current) highlightCodeBlocks(answerRef.current);
  }, [open, question.answer]);

  return (
    <div
      style={{
        background: done ? 'rgba(61,214,140,0.04)' : '#0f0f1a',
        border: `1px solid ${done ? 'rgba(61,214,140,0.22)' : open ? '#2a2a45' : '#1e1e35'}`,
        borderRadius: '14px',
        marginBottom: '12px',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Question header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: '14px',
          padding: '18px 22px', cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#50507a', minWidth: '24px', paddingTop: '2px', flexShrink: 0 }}>
          {String(index).padStart(2, '0')}
        </span>

        <span
          style={{ flex: 1, fontSize: '15px', fontWeight: 500, color: '#e8e8f5', lineHeight: 1.5 }}
          dangerouslySetInnerHTML={{ __html: question.question }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 9px', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.06em', color: diff.color, background: diff.bg }}>
            {question.difficulty}
          </span>
          <div style={{
            width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
            background: open ? 'rgba(201,168,76,0.12)' : '#14142a',
            border: `1px solid ${open ? 'rgba(201,168,76,0.3)' : '#1e1e35'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: open ? '#c9a84c' : '#50507a',
            transition: 'all 0.2s',
            transform: open ? 'rotate(45deg)' : 'none',
          }}>
            <Plus size={13} />
          </div>
        </div>
      </div>

      {/* Answer */}
      {open && (
        <div style={{ borderTop: '1px solid #1e1e35' }}>
          <div style={{ padding: '24px' }}>
            <div
              ref={answerRef}
              className="interview-answer"
              dangerouslySetInnerHTML={{ __html: question.answer }}
            />
            <button
              onClick={onToggleDone}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                marginTop: '20px', background: done ? 'rgba(61,214,140,0.1)' : 'transparent',
                border: `1px solid ${done ? 'rgba(61,214,140,0.35)' : '#2a2a45'}`,
                borderRadius: '8px', padding: '7px 15px', fontSize: '12.5px',
                color: done ? '#3dd68c' : '#50507a',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
              }}
            >
              <CheckCircle size={13} />
              {done ? 'Marked as done' : 'Mark as done'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
