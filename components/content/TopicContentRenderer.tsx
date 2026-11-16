'use client';

import { TopicContent, Section } from '@/data/contentTypes';
import CodeBlock from './CodeBlock';
import Callout from './Callout';
import Quiz from './Quiz';
import ComparisonTable from './ComparisonTable';
import dynamic from 'next/dynamic';
import { CheckCircle, ArrowRight, Lightbulb } from 'lucide-react';

const HttpVisualizer = dynamic(() => import('@/components/visualizers/HttpVisualizer'), { ssr: false });
const EventLoopVisualizer = dynamic(() => import('@/components/visualizers/EventLoopVisualizer'), { ssr: false });
const JwtVisualizer = dynamic(() => import('@/components/visualizers/JwtVisualizer'), { ssr: false });
const LoadBalancerVisualizer = dynamic(() => import('@/components/visualizers/LoadBalancerVisualizer'), { ssr: false });
const CacheSimulator = dynamic(() => import('@/components/visualizers/CacheSimulator'), { ssr: false });
const LatencyChart = dynamic(() => import('@/components/visualizers/LatencyChart'), { ssr: false });

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: '#F0F0F8' }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.85em',
          background: 'rgba(201,168,76,0.1)', color: '#E8C96B',
          padding: '2px 6px', borderRadius: '4px'
        }}>{part.slice(1, -1)}</code>
      );
    }
    return part;
  });
}

function renderSection(section: Section, idx: number) {
  switch (section.type) {
    case 'text':
      return (
        <div key={idx} style={{ marginBottom: '32px' }}>
          {section.heading && (
            <h2 style={{
              fontFamily: 'Playfair Display, serif', fontSize: '26px',
              fontWeight: 600, color: '#F0F0F8', marginBottom: '14px',
              paddingTop: idx > 0 ? '8px' : '0'
            }}>
              {section.heading}
            </h2>
          )}
          <div style={{ color: '#8888AA', lineHeight: 1.8, fontSize: '15px' }}>
            {(section.content || '').split('\n\n').map((para, pi) => (
              <p key={pi} style={{ marginBottom: '16px' }}>
                {renderInlineMarkdown(para)}
              </p>
            ))}
          </div>
        </div>
      );

    case 'analogy':
      return (
        <div key={idx} style={{
          background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: '14px', padding: '24px', marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Lightbulb size={16} color="#C9A84C" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#C9A84C', margin: 0 }}>
              {section.heading || 'Analogy'}
            </h3>
          </div>
          <div style={{ color: '#8888AA', lineHeight: 1.8, fontSize: '15px' }}>
            {(section.content || '').split('\n\n').map((para, pi) => (
              <p key={pi} style={{ marginBottom: '12px' }}>
                {renderInlineMarkdown(para)}
              </p>
            ))}
          </div>
        </div>
      );

    case 'code':
      return (
        <div key={idx} style={{ marginBottom: '32px' }}>
          {section.heading && (
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#F0F0F8', marginBottom: '14px' }}>
              {section.heading}
            </h3>
          )}
          <CodeBlock
            code={section.code || ''}
            language={section.language || 'typescript'}
            label={section.label}
            showLineNumbers
          />
        </div>
      );

    case 'callout':
      return (
        <div key={idx} style={{ marginBottom: '24px' }}>
          <Callout type={section.calloutType || 'info'} title={section.heading}>
            <span style={{ color: '#8888AA', lineHeight: 1.7, fontSize: '14px' }}>
              {renderInlineMarkdown(section.content || '')}
            </span>
          </Callout>
        </div>
      );

    case 'comparison':
      return (
        <div key={idx} style={{ marginBottom: '32px' }}>
          {section.heading && (
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#F0F0F8', marginBottom: '14px' }}>
              {section.heading}
            </h3>
          )}
          <ComparisonTable
            headers={section.headers || []}
            rows={(section.rows || []) as any}
          />
        </div>
      );

    case 'steps':
      return (
        <div key={idx} style={{ marginBottom: '32px' }}>
          {section.heading && (
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#F0F0F8', marginBottom: '18px' }}>
              {section.heading}
            </h3>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(section.steps || []).map((step, si) => (
              <div key={si} style={{
                display: 'flex', gap: '16px', alignItems: 'flex-start',
                background: '#12121E', border: '1px solid #1E1E35',
                borderRadius: '12px', padding: '16px 20px'
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700, color: '#C9A84C', fontFamily: 'Inter, sans-serif'
                }}>
                  {si + 1}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#F0F0F8', marginBottom: '4px' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '14px', color: '#8888AA', lineHeight: 1.6 }}>
                    {renderInlineMarkdown(step.detail)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'checklist':
      return (
        <div key={idx} style={{ marginBottom: '32px' }}>
          {section.heading && (
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#F0F0F8', marginBottom: '14px' }}>
              {section.heading}
            </h3>
          )}
          <div style={{
            background: '#12121E', border: '1px solid #1E1E35',
            borderRadius: '12px', padding: '20px 24px'
          }}>
            {(section.items || []).map((item, ii) => (
              <div key={ii} style={{
                display: 'flex', gap: '10px', alignItems: 'flex-start',
                paddingBottom: ii < (section.items?.length ?? 0) - 1 ? '10px' : '0',
                borderBottom: ii < (section.items?.length ?? 0) - 1 ? '1px solid #1A1A2E' : 'none',
                marginBottom: ii < (section.items?.length ?? 0) - 1 ? '10px' : '0',
              }}>
                <CheckCircle size={14} color="#22C55E" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span style={{ fontSize: '14px', color: '#8888AA', lineHeight: 1.6 }}>
                  {renderInlineMarkdown(item)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}

interface TopicContentRendererProps {
  content: TopicContent;
}

export default function TopicContentRenderer({ content }: TopicContentRendererProps) {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {content.hasVisualizer === 'http' && <HttpVisualizer />}
      {content.hasVisualizer === 'eventloop' && <EventLoopVisualizer />}
      {content.hasVisualizer === 'jwt' && <JwtVisualizer />}
      {content.hasVisualizer === 'loadbalancer' && <LoadBalancerVisualizer />}
      {content.hasVisualizer === 'cache' && <CacheSimulator />}
      {content.hasVisualizer === 'latency' && <LatencyChart />}

      {content.sections.map((section, idx) => renderSection(section, idx))}

      {content.quiz && content.quiz.length > 0 && (
        <div style={{ marginTop: '48px' }}>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #1E1E35, transparent)', marginBottom: '40px' }} />
          <Quiz questions={content.quiz} title={`${content.title} — Knowledge Check`} />
        </div>
      )}
    </div>
  );
}
