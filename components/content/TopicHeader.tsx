'use client';

import Link from 'next/link';
import { Topic } from '@/types';
import Icon from '@/components/ui/Icon';
import { CheckCircle, Circle, Clock, ChevronRight, BookOpen, AlertCircle } from 'lucide-react';

const DIFFICULTY_CONFIG = {
  beginner:     { color: '#22C55E', label: 'Beginner',     bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)' },
  intermediate: { color: '#F97316', label: 'Intermediate', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)' },
  advanced:     { color: '#EF4444', label: 'Advanced',     bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)' },
};

interface TopicHeaderProps {
  topic: Topic;
  categoryTitle: string;
  categoryId: string;
  completed: boolean;
  onComplete: () => void;
}

export default function TopicHeader({ topic, categoryTitle, categoryId, completed, onComplete }: TopicHeaderProps) {
  const diff = DIFFICULTY_CONFIG[topic.difficulty];

  return (
    <div style={{ marginBottom: '40px', fontFamily: 'Inter, sans-serif' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px', fontSize: '13px', color: '#555570' }}>
        <Link href="/docs" style={{ color: '#555570', textDecoration: 'none' }}>Docs</Link>
        <ChevronRight size={12} color="#555570" />
        <Link href={`/docs/${categoryId}`} style={{ color: '#555570', textDecoration: 'none' }}>{categoryTitle}</Link>
        <ChevronRight size={12} color="#555570" />
        <span style={{ color: '#8888AA' }}>{topic.title}</span>
      </div>

      {/* Icon + badges row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
          background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon name={topic.icon} size={20} color="#C9A84C" />
        </div>

        <span style={{
          fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '999px',
          background: diff.bg, border: `1px solid ${diff.border}`, color: diff.color
        }}>
          {diff.label}
        </span>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px',
          padding: '4px 12px', borderRadius: '999px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid #1E1E35', color: '#8888AA'
        }}>
          <Clock size={11} />
          {topic.estimatedTime} min read
        </div>

        {topic.prerequisites.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px',
            padding: '4px 12px', borderRadius: '999px',
            background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', color: '#4F8EF7'
          }}>
            <BookOpen size={11} />
            {topic.prerequisites.length} prerequisite{topic.prerequisites.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px, 4vw, 44px)',
        fontWeight: 700, color: '#F0F0F8', lineHeight: 1.2, marginBottom: '12px'
      }}>
        {topic.title}
      </h1>
      <p style={{ fontSize: '18px', color: '#8888AA', lineHeight: 1.6, marginBottom: '24px' }}>
        {topic.description}
      </p>

      {/* Mark complete */}
      <button
        onClick={onComplete}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: completed ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${completed ? 'rgba(34,197,94,0.3)' : '#1E1E35'}`,
          borderRadius: '8px', padding: '8px 16px', fontSize: '13px',
          color: completed ? '#22C55E' : '#8888AA', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif', transition: 'all 0.2s ease'
        }}
      >
        {completed ? <CheckCircle size={14} /> : <Circle size={14} />}
        {completed ? 'Completed' : 'Mark as Complete'}
      </button>

      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #1E1E35, transparent)', marginTop: '32px' }} />
    </div>
  );
}
