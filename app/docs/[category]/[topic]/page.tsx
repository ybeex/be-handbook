'use client';

import { useParams } from 'next/navigation';
import { CATEGORIES } from '@/data/curriculum';
import { getTopicContent } from '@/data/topicContent';
import TopicHeader from '@/components/content/TopicHeader';
import TopicContentRenderer from '@/components/content/TopicContentRenderer';
import Link from 'next/link';
import { useState } from 'react';
import Icon from '@/components/ui/Icon';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

export default function TopicPage() {
  const params = useParams();
  const categoryId = params?.category as string;
  const topicSlug = params?.topic as string;
  const [completed, setCompleted] = useState(false);

  const category = CATEGORIES.find(c => c.id === categoryId);
  const topicIdx = category?.topics.findIndex(t => t.slug === topicSlug) ?? -1;
  const topic = category?.topics[topicIdx];
  const prevTopic = topicIdx > 0 ? category?.topics[topicIdx - 1] : undefined;
  const nextTopic = topicIdx < (category?.topics.length ?? 0) - 1 ? category?.topics[topicIdx + 1] : undefined;

  const categoryIdx = CATEGORIES.findIndex(c => c.id === categoryId);
  const nextCategory = categoryIdx < CATEGORIES.length - 1 ? CATEGORIES[categoryIdx + 1] : undefined;

  if (!topic || !category) {
    return (
      <div style={{ padding: '80px 32px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', color: '#F0F0F8', marginBottom: '12px' }}>
          Topic Not Found
        </h2>
        <p style={{ color: '#8888AA', marginBottom: '24px' }}>This topic does not exist in the curriculum.</p>
        <Link href="/docs" style={{
          background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
          color: '#C9A84C', padding: '10px 24px', borderRadius: '8px',
          textDecoration: 'none', fontSize: '14px'
        }}>
          Back to Curriculum
        </Link>
      </div>
    );
  }

  const content = getTopicContent(topicSlug);

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: 'clamp(20px, 4vw, 48px) clamp(16px, 4vw, 32px) 80px', fontFamily: 'Inter, sans-serif' }}>
      <TopicHeader
        topic={topic}
        categoryTitle={category.title}
        categoryId={category.id}
        completed={completed}
        onComplete={() => setCompleted(!completed)}
      />

      {content ? (
        <TopicContentRenderer content={content} />
      ) : (
        <FallbackTopicContent topic={topic} category={category} categoryId={categoryId} />
      )}

      {/* Bottom navigation */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', gap: '16px',
        marginTop: '64px', paddingTop: '32px',
        borderTop: '1px solid #1E1E35', flexWrap: 'wrap'
      }}>
        {prevTopic ? (
          <Link href={`/docs/${categoryId}/${prevTopic.slug}`} style={{ textDecoration: 'none', flex: 1 }}>
            <div style={{
              background: '#12121E', border: '1px solid #1E1E35', borderRadius: '12px',
              padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.3)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#1E1E35'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#555570', marginBottom: '5px' }}>
                <ChevronLeft size={12} /> Previous
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#F0F0F8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name={prevTopic.icon} size={13} color="#555570" />
                {prevTopic.title}
              </div>
            </div>
          </Link>
        ) : <div style={{ flex: 1 }} />}

        {nextTopic ? (
          <Link href={`/docs/${categoryId}/${nextTopic.slug}`} style={{ textDecoration: 'none', flex: 1 }}>
            <div style={{
              background: '#12121E', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '12px',
              padding: '16px 20px', cursor: 'pointer', textAlign: 'right', transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.4)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.2)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#555570', marginBottom: '5px', justifyContent: 'flex-end' }}>
                Next <ChevronRight size={12} />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#C9A84C', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                {nextTopic.title}
                <Icon name={nextTopic.icon} size={13} color="#C9A84C" />
              </div>
            </div>
          </Link>
        ) : nextCategory ? (
          <Link href={`/docs/${nextCategory.id}/${nextCategory.topics[0]?.slug}`} style={{ textDecoration: 'none', flex: 1 }}>
            <div style={{
              background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)',
              borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', textAlign: 'right'
            }}>
              <div style={{ fontSize: '12px', color: '#555570', marginBottom: '4px' }}>Next Chapter</div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: '#C9A84C', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                {nextCategory.title}
                <Icon name={nextCategory.icon} size={13} color="#C9A84C" />
              </div>
            </div>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function FallbackTopicContent({ topic, category, categoryId }: { topic: any; category: any; categoryId: string }) {
  // This renders structured placeholder content - never "coming soon"
  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '26px', color: '#F0F0F8', marginBottom: '14px' }}>
          Overview
        </h2>
        <p style={{ color: '#8888AA', lineHeight: 1.8, fontSize: '15px' }}>
          {topic.description}. This topic is part of the {category.title} track and builds on
          {topic.prerequisites.length > 0 ? ` ${topic.prerequisites.length} prerequisite concept(s)` : ' foundational knowledge'}.
          Master this to progress toward production-grade backend engineering.
        </p>
      </div>

      <div style={{ background: '#12121E', border: '1px solid #1E1E35', borderRadius: '14px', padding: '28px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#F0F0F8', marginBottom: '20px' }}>
          What You Will Learn
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            `Core concepts and first-principles understanding of ${topic.title}`,
            'Real-world analogies that make the concept intuitive',
            'Production-grade code examples with best practices',
            'Common mistakes beginners make and how to avoid them',
            'Performance implications and optimization strategies',
            'Security considerations specific to this area',
            `How companies like Netflix, Stripe, and Google apply ${topic.title} at scale`,
            'Interview-level questions and how to answer them',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <ArrowRight size={14} color="#C9A84C" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ color: '#8888AA', fontSize: '14px', lineHeight: 1.6 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
        {category.topics.filter((t: any) => t.slug !== topic.slug).slice(0, 4).map((t: any) => (
          <Link key={t.id} href={`/docs/${categoryId}/${t.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#12121E', border: '1px solid #1E1E35', borderRadius: '10px',
              padding: '16px', cursor: 'pointer', transition: 'border-color 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.3)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#1E1E35'}
            >
              <Icon name={t.icon} size={18} color="#555570" />
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#F0F0F8', marginTop: '10px', marginBottom: '4px' }}>{t.title}</div>
              <div style={{ fontSize: '12px', color: '#555570' }}>{t.estimatedTime}m</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
