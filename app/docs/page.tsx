'use client';

import Link from 'next/link';
import { CATEGORIES } from '@/data/curriculum';
import Icon from '@/components/ui/Icon';
import { Clock, ArrowRight, BookOpen, PlayCircle, FlaskConical, BarChart2 } from 'lucide-react';

const DIFFICULTY_COLORS = {
  beginner: '#22C55E',
  intermediate: '#F97316',
  advanced: '#EF4444',
};

export default function DocsPage() {
  const totalTopics = CATEGORIES.reduce((acc, c) => acc + c.topics.length, 0);
  const totalTime = CATEGORIES.reduce((acc, c) => acc + c.topics.reduce((ta, t) => ta + t.estimatedTime, 0), 0);
  const hours = Math.floor(totalTime / 60);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: 'clamp(20px, 4vw, 48px) clamp(16px, 4vw, 32px)', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: '999px', padding: '5px 14px', fontSize: '12px',
          color: '#C9A84C', marginBottom: '20px', fontWeight: 500
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#C9A84C' }} />
          Curriculum Overview
        </div>

        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', color: '#F0F0F8', fontWeight: 700, marginBottom: '16px', lineHeight: 1.1 }}>
          Backend Engineering
          <br />
          <span style={{ background: 'linear-gradient(135deg, #9B7B2E, #C9A84C, #E8C96B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Handbook
          </span>
        </h1>

        <p style={{ fontSize: '18px', color: '#8888AA', lineHeight: 1.7, maxWidth: '600px', marginBottom: '32px' }}>
          A complete learning path from absolute beginner to strong intermediate and advanced.
          Every concept comes with visual explanations, analogies, code examples, and quizzes.
        </p>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[
            { icon: BookOpen, label: `${totalTopics} Topics` },
            { icon: Clock, label: `~${hours}h of content` },
            { icon: PlayCircle, label: '25+ Interactive demos' },
            { icon: FlaskConical, label: 'Quiz mode included' },
          ].map((s, i) => {
            const S = s.icon;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#8888AA', fontSize: '14px' }}>
                <S size={14} color="#C9A84C" />
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Difficulty legend */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', padding: '14px 20px', background: '#12121E', border: '1px solid #1E1E35', borderRadius: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: '#555570', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Difficulty:</span>
        {(['beginner', 'intermediate', 'advanced'] as const).map(d => (
          <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: DIFFICULTY_COLORS[d] }} />
            <span style={{ fontSize: '13px', color: '#8888AA', textTransform: 'capitalize' }}>{d}</span>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {CATEGORIES.map(category => (
          <div key={category.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                background: `${category.color}15`, border: `1px solid ${category.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Icon name={category.icon} size={17} color={category.color} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#F0F0F8', fontFamily: 'Playfair Display, serif' }}>
                  {category.title}
                </h2>
                <p style={{ fontSize: '13px', color: '#555570' }}>{category.description}</p>
              </div>
              <span style={{ fontSize: '12px', color: '#555570', background: '#12121E', border: '1px solid #1E1E35', borderRadius: '999px', padding: '4px 12px', flexShrink: 0 }}>
                {category.topics.length} topics
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
              {category.topics.map((topic) => (
                <Link key={topic.id} href={`/docs/${category.id}/${topic.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: '#12121E', border: '1px solid #1E1E35', borderRadius: '12px',
                    padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: '12px',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.3)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#1E1E35';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid #1E1E35',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon name={topic.icon} size={14} color="#555570" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#F0F0F8', marginBottom: '3px' }}>{topic.title}</div>
                      <p style={{ fontSize: '12px', color: '#555570', lineHeight: 1.4 }}>{topic.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '7px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: DIFFICULTY_COLORS[topic.difficulty] }} />
                          <span style={{ fontSize: '11px', color: DIFFICULTY_COLORS[topic.difficulty], textTransform: 'capitalize' }}>{topic.difficulty}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#555570' }}>
                          <Clock size={10} />
                          {topic.estimatedTime}m
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={14} color="#555570" style={{ flexShrink: 0, marginTop: '3px' }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{ marginTop: '64px', padding: '40px', background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: '16px', textAlign: 'center' }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', color: '#F0F0F8', marginBottom: '12px' }}>
          Start from the beginning
        </h3>
        <p style={{ color: '#8888AA', fontSize: '15px', marginBottom: '24px' }}>
          Recommended if you are new to backend engineering
        </p>
        <Link href="/docs/foundations/what-is-backend" style={{
          background: 'linear-gradient(135deg, #9B7B2E, #C9A84C)',
          color: '#0A0A0F', padding: '12px 32px', borderRadius: '10px',
          fontSize: '14px', fontWeight: 700, textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: '8px'
        }}>
          Chapter 1: What is Backend? <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
