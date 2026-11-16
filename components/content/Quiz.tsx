'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, RotateCcw, FlaskConical, Trophy, BookOpen, RefreshCw } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizProps {
  questions: QuizQuestion[];
  title?: string;
}

export default function Quiz({ questions, title = 'Knowledge Check' }: QuizProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);

  const q = questions[currentQ];
  const isAnswered = selectedAnswer !== null;

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedAnswer(idx);
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setSelectedAnswer(answers[currentQ + 1]);
    } else {
      setShowResults(true);
    }
  };

  const handlePrev = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
      setSelectedAnswer(answers[currentQ - 1]);
    }
  };

  const handleReset = () => {
    setCurrentQ(0);
    setSelectedAnswer(null);
    setAnswers(new Array(questions.length).fill(null));
    setShowResults(false);
  };

  const score = answers.filter((a, i) => a === questions[i].correctIndex).length;

  if (showResults) {
    const pct = Math.round((score / questions.length) * 100);
    const color = pct >= 80 ? '#22C55E' : pct >= 60 ? '#F97316' : '#EF4444';
    const ResultIcon = pct >= 80 ? Trophy : pct >= 60 ? BookOpen : RefreshCw;
    const resultMsg = pct >= 80
      ? 'Excellent — you have mastered this topic.'
      : pct >= 60
      ? 'Good work. Review the topics you missed.'
      : 'Keep studying and try again.';

    return (
      <div style={{ background: '#12121E', border: '1px solid #1E1E35', borderRadius: '16px', padding: '32px', fontFamily: 'Inter, sans-serif' }}>
        <h3 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', color: '#F0F0F8', marginBottom: '24px' }}>
          Quiz Results
        </h3>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <ResultIcon size={40} color={color} />
          </div>
          <div style={{ fontSize: '64px', fontWeight: 700, color, marginBottom: '6px', fontFamily: 'Playfair Display, serif' }}>
            {pct}%
          </div>
          <p style={{ color: '#8888AA', fontSize: '15px' }}>{score} of {questions.length} correct</p>
          <p style={{ color, fontSize: '14px', marginTop: '6px' }}>{resultMsg}</p>
        </div>

        {/* Per-question review */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {questions.map((q, i) => {
            const correct = answers[i] === q.correctIndex;
            return (
              <div key={i} style={{
                padding: '12px 16px', borderRadius: '10px',
                background: correct ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${correct ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                display: 'flex', gap: '10px', alignItems: 'flex-start'
              }}>
                {correct
                  ? <CheckCircle size={16} color="#22C55E" style={{ flexShrink: 0, marginTop: '2px' }} />
                  : <XCircle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                }
                <div>
                  <p style={{ fontSize: '13px', color: '#F0F0F8', marginBottom: '3px' }}>{q.question}</p>
                  {!correct && (
                    <p style={{ fontSize: '12px', color: '#22C55E' }}>
                      Correct: {q.options[q.correctIndex]}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={handleReset} style={{
          background: 'linear-gradient(135deg, #9B7B2E, #C9A84C)',
          color: '#0A0A0F', border: 'none', borderRadius: '10px',
          padding: '11px 24px', fontSize: '14px', fontWeight: 600,
          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          display: 'flex', alignItems: 'center', gap: '7px'
        }}>
          <RotateCcw size={14} /> Retake Quiz
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: '#12121E', border: '1px solid #1E1E35', borderRadius: '16px', padding: '28px', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FlaskConical size={16} color="#C9A84C" />
          <h3 style={{ fontSize: '17px', color: '#F0F0F8', fontFamily: 'Playfair Display, serif', margin: 0 }}>
            {title}
          </h3>
        </div>
        <span style={{ fontSize: '13px', color: '#555570' }}>{currentQ + 1} / {questions.length}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', background: '#1E1E35', borderRadius: '999px', marginBottom: '22px' }}>
        <div style={{
          height: '100%', borderRadius: '999px',
          background: 'linear-gradient(90deg, #9B7B2E, #C9A84C)',
          width: `${((currentQ + 1) / questions.length) * 100}%`,
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Question */}
      <p style={{ fontSize: '15px', color: '#F0F0F8', marginBottom: '20px', lineHeight: 1.6, fontWeight: 500 }}>
        {q.question}
      </p>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '20px' }}>
        {q.options.map((opt, idx) => {
          let borderColor = '#1E1E35';
          let bg = '#0A0A0F';
          let color = '#8888AA';
          let iconEl: React.ReactNode = null;

          if (isAnswered) {
            if (idx === q.correctIndex) {
              borderColor = 'rgba(34,197,94,0.45)'; bg = 'rgba(34,197,94,0.08)'; color = '#22C55E';
              iconEl = <CheckCircle size={14} color="#22C55E" style={{ flexShrink: 0 }} />;
            } else if (idx === selectedAnswer) {
              borderColor = 'rgba(239,68,68,0.45)'; bg = 'rgba(239,68,68,0.08)'; color = '#EF4444';
              iconEl = <XCircle size={14} color="#EF4444" style={{ flexShrink: 0 }} />;
            }
          }

          return (
            <button key={idx} onClick={() => handleSelect(idx)} style={{
              background: bg, border: `1px solid ${borderColor}`, borderRadius: '10px',
              padding: '12px 15px', cursor: isAnswered ? 'default' : 'pointer',
              color, fontSize: '14px', textAlign: 'left', transition: 'all 0.2s ease',
              fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
              display: 'flex', gap: '10px', alignItems: 'flex-start'
            }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.05)', border: '1px solid #1E1E35',
                fontSize: '11px', fontWeight: 700, color: '#555570'
              }}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span style={{ flex: 1, paddingTop: '2px' }}>{opt}</span>
              {iconEl}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {isAnswered && (
        <div style={{
          background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: '10px', padding: '14px 16px', marginBottom: '18px'
        }}>
          <p style={{ fontSize: '13px', color: '#8888AA', lineHeight: 1.7 }}>
            <strong style={{ color: '#C9A84C' }}>Explanation: </strong>
            {q.explanation}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handlePrev} disabled={currentQ === 0} style={{
          background: '#0A0A0F', border: '1px solid #1E1E35', borderRadius: '8px',
          padding: '9px 18px', fontSize: '13px',
          color: currentQ === 0 ? '#2E2E4E' : '#8888AA',
          cursor: currentQ === 0 ? 'not-allowed' : 'pointer',
          fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '5px'
        }}>
          <ChevronLeft size={14} /> Prev
        </button>
        <button onClick={handleNext} disabled={!isAnswered} style={{
          background: isAnswered ? 'linear-gradient(135deg, #9B7B2E, #C9A84C)' : '#1E1E35',
          border: 'none', borderRadius: '8px', padding: '9px 18px',
          fontSize: '13px', fontWeight: 600,
          color: isAnswered ? '#0A0A0F' : '#2E2E4E',
          cursor: isAnswered ? 'pointer' : 'not-allowed',
          fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '5px'
        }}>
          {currentQ === questions.length - 1 ? 'See Results' : 'Next'}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
