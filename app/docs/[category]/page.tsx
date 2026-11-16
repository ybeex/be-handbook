'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CATEGORIES } from '@/data/curriculum';
import Icon from '@/components/ui/Icon';
import { Clock, ChevronRight, ArrowRight } from 'lucide-react';

const DIFFICULTY_COLORS = { beginner: '#22C55E', intermediate: '#F97316', advanced: '#EF4444' };

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params?.category as string;
  const category = CATEGORIES.find(c => c.id === categoryId);

  if (!category) {
    return (
      <div style={{ padding: '80px 32px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <h2 style={{ color: '#F0F0F8', fontFamily: 'Playfair Display, serif', fontSize: '28px', marginBottom: '12px' }}>Category not found</h2>
        <Link href="/docs" style={{ color: '#C9A84C', textDecoration: 'none' }}>Back to Curriculum</Link>
      </div>
    );
  }

  const totalTime = category.topics.reduce((acc, t) => acc + t.estimatedTime, 0);
  const hours = Math.floor(totalTime / 60);
  const mins = totalTime % 60;

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 32px', fontFamily: 'Inter, sans-serif' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '24px', fontSize: '13px', color: '#555570' }}>
        <Link href="/docs" style={{ color: '#555570', textDecoration: 'none' }}>Docs</Link>
        <ChevronRight size={12} color="#555570" />
        <span style={{ color: '#8888AA' }}>{category.title}</span>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '40px' }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px', flexShrink: 0,
          background: `${category.color}15`, border: `1px solid ${category.color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon name={category.icon} size={24} color={category.color} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '36px', color: '#F0F0F8', marginBottom: '8px' }}>
            {category.title}
          </h1>
          <p style={{ fontSize: '16px', color: '#8888AA', marginBottom: '12px', lineHeight: 1.6 }}>
            {category.description}
          </p>
          <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: '#555570' }}>{category.topics.length} topics</span>
            <span style={{ fontSize: '13px', color: '#555570' }}>
              {hours > 0 ? `${hours}h ` : ''}{mins > 0 ? `${mins}m` : ''} total
            </span>
          </div>
        </div>
      </div>

      <Link href={`/docs/${category.id}/${category.topics[0]?.slug}`} style={{ textDecoration: 'none' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'linear-gradient(135deg, #9B7B2E, #C9A84C)',
          color: '#0A0A0F', padding: '11px 24px', borderRadius: '10px',
          fontSize: '14px', fontWeight: 700, marginBottom: '40px', cursor: 'pointer'
        }}>
          Start Chapter <ArrowRight size={14} />
        </div>
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {category.topics.map((topic, i) => (
          <Link key={topic.id} href={`/docs/${category.id}/${topic.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#12121E', border: '1px solid #1E1E35', borderRadius: '14px',
              padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '18px',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.3)';
              (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '#1E1E35';
              (e.currentTarget as HTMLElement).style.transform = 'none';
            }}
            >
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.04)', border: '1px solid #1E1E35',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: '#555570'
              }}>
                {i + 1}
              </div>
              <div style={{ width: '30px', height: '30px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={topic.icon} size={16} color="#555570" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 500, color: '#F0F0F8', marginBottom: '3px' }}>{topic.title}</div>
                <div style={{ fontSize: '13px', color: '#555570' }}>{topic.description}</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: DIFFICULTY_COLORS[topic.difficulty] }} />
                  <span style={{ fontSize: '12px', color: DIFFICULTY_COLORS[topic.difficulty], textTransform: 'capitalize' }}>{topic.difficulty}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#555570' }}>
                  <Clock size={11} />
                  {topic.estimatedTime}m
                </div>
                <ArrowRight size={14} color="#555570" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
