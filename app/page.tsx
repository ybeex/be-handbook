'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/data/curriculum';
import Icon from '@/components/ui/Icon';
import {
  Server, Globe, Database, Shield, Zap, BarChart2,
  ArrowRight, BookOpen, PlayCircle, ChevronRight, Scale
} from 'lucide-react';

const FEATURED_LESSONS = [
  { category: 'api-design', slug: 'openapi', title: 'OpenAPI & API Contracts', desc: 'Design-first contracts that keep clients and servers in sync.' },
  { category: 'api-design', slug: 'idempotency', title: 'Idempotency & Safe Retries', desc: 'Make retries safe with idempotency keys and exactly-once effects.' },
  { category: 'api-design', slug: 'api-versioning', title: 'API Versioning & Evolution', desc: 'Evolve an API without breaking the clients already in production.' },
  { category: 'testing', slug: 'contract-testing', title: 'Contract Testing', desc: 'Verify producers and consumers agree without end-to-end flakiness.' },
  { category: 'testing', slug: 'property-based-testing', title: 'Property-Based & Fuzz Testing', desc: 'Let generators falsify your invariants and shrink the counterexample.' },
  { category: 'testing', slug: 'e2e-testing', title: 'End-to-End Testing', desc: 'Playwright and Cypress against real journeys, without the flakes.' },
];

const FEATURES = [
  { icon: BookOpen, title: 'Progressive Learning', desc: 'Start from zero and advance systematically with prerequisite tracking and difficulty tiers.' },
  { icon: PlayCircle, title: 'Interactive Simulations', desc: 'Visualize event loops, TCP handshakes, caching, and load balancing in real-time.' },
  { icon: BarChart2, title: 'Architecture Explorer', desc: 'Compare monoliths vs microservices with interactive, zoomable architecture diagrams.' },
  { icon: Database, title: 'Quizzes & Labs', desc: 'Interview-level questions with instant feedback and detailed explanations.' },
  { icon: Globe, title: 'Real-World Analogies', desc: 'Every concept explained with mental models before technical depth.' },
  { icon: Zap, title: 'Production Reality', desc: 'Learn how Netflix, Stripe, and Google actually solve these problems at scale.' },
];

export default function HomePage() {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const totalTopics = CATEGORIES.reduce((acc, c) => acc + c.topics.length, 0);
  const systemDesigns = CATEGORIES.find((c) => c.id === 'system-design')?.topics.length ?? 0;
  const stats = [
    { label: 'Topics Covered', value: `${totalTopics}` },
    { label: 'Learning Categories', value: `${CATEGORIES.length}` },
    { label: 'Interactive Demos', value: '25+' },
    { label: 'System Designs', value: `${systemDesigns}` },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0F', fontFamily: 'Inter, sans-serif' }}>

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.88)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #1E1E35', padding: '0 32px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32, background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.35)', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Server size={15} color="#C9A84C" />
          </div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '18px', color: '#F0F0F8', fontWeight: 600 }}>
            Backend<span style={{ color: '#C9A84C' }}>Craft</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }} className="nav-links">
          <style>{`@media(max-width:600px){.nav-links a:not(:last-child){display:none!important}}`}</style>
          <Link href="/docs" style={{ color: '#8888AA', fontSize: '14px', textDecoration: 'none' }}>Curriculum</Link>
          <Link href="/playground" style={{ color: '#8888AA', fontSize: '14px', textDecoration: 'none' }}>Playground</Link>
          <Link href="/interview" style={{ color: '#8888AA', fontSize: '14px', textDecoration: 'none' }}>Interview Prep</Link>
          <Link href="/system-design" style={{ color: '#8888AA', fontSize: '14px', textDecoration: 'none' }}>System Design</Link>
          <Link href="/docs" style={{
            background: 'linear-gradient(135deg, #9B7B2E, #C9A84C)',
            color: '#0A0A0F', padding: '8px 20px', borderRadius: '8px',
            fontSize: '14px', fontWeight: 600, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            Start Learning <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        paddingTop: '150px', paddingBottom: '100px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
        backgroundImage: 'linear-gradient(rgba(201,168,76,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.025) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '900px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', maxWidth: '900px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: '999px', padding: '6px 16px', fontSize: '13px',
            color: '#C9A84C', marginBottom: '32px', fontWeight: 500
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A84C' }} />
            From Absolute Zero to Production-Ready
          </div>

          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(44px, 7vw, 82px)',
            fontWeight: 700, lineHeight: 1.08, marginBottom: '24px',
            color: '#F0F0F8', letterSpacing: '-0.02em'
          }}>
            The Backend Engineering
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #9B7B2E 0%, #C9A84C 40%, #E8C96B 60%, #C9A84C 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>
              Masterclass
            </span>
          </h1>

          <p style={{
            fontSize: '20px', color: '#8888AA', lineHeight: 1.7,
            maxWidth: '620px', margin: '0 auto 48px', fontWeight: 300
          }}>
            A premium interactive handbook covering everything from HTTP basics to distributed systems.
            Visual explanations, real analogies, and production-grade knowledge.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '64px' }}>
            <Link href="/docs" style={{
              background: 'linear-gradient(135deg, #9B7B2E, #C9A84C, #E8C96B)',
              color: '#0A0A0F', padding: '15px 36px', borderRadius: '12px',
              fontSize: '16px', fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 30px rgba(201,168,76,0.35)',
              display: 'inline-flex', alignItems: 'center', gap: '8px'
            }}>
              Start Learning Free <ArrowRight size={16} />
            </Link>
            <Link href="/docs" style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid #1E1E35',
              color: '#F0F0F8', padding: '15px 36px', borderRadius: '12px',
              fontSize: '16px', fontWeight: 500, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '8px'
            }}>
              View Curriculum <ChevronRight size={16} />
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '48px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {stats.map(stat => (
              <div key={stat.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '34px', fontWeight: 700, color: '#C9A84C', fontFamily: 'Playfair Display, serif' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '13px', color: '#555570', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture preview */}
      <section style={{ padding: '20px 24px 60px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{
          background: '#0D0D18', border: '1px solid #1E1E35', borderRadius: '20px',
          padding: '32px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', gap: '6px' }}>
            {['#EF4444', '#F97316', '#22C55E'].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
            ))}
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
              {[
                { icon: Globe, label: 'CLIENT', detail: 'Browser / App', color: '#4F8EF7' },
                { icon: Scale, label: 'LOAD BALANCER', detail: 'Nginx / HAProxy', color: '#C9A84C' },
                { icon: Server, label: 'API SERVER', detail: 'Node.js / Express', color: '#9B5DE5' },
                { icon: Database, label: 'DATABASE', detail: 'PostgreSQL', color: '#F97316' },
                { icon: Zap, label: 'CACHE', detail: 'Redis', color: '#22C55E' },
              ].map((node, i) => {
                const NodeIcon = node.icon;
                return (
                  <div key={i} style={{
                    background: `${node.color}10`, border: `1px solid ${node.color}25`,
                    borderRadius: '12px', padding: '18px', textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                      <NodeIcon size={24} color={node.color} />
                    </div>
                    <div style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: node.color, fontWeight: 700, marginBottom: '4px', letterSpacing: '0.06em' }}>
                      {node.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#555570' }}>{node.detail}</div>
                  </div>
                );
              })}
            </div>
            <p style={{ textAlign: 'center', fontSize: '13px', color: '#555570', marginTop: '20px' }}>
              You will learn how every piece of this stack works, from first principles to production scale
            </p>
          </div>
        </div>
      </section>

      {/* Curriculum Grid */}
      <section style={{ padding: '40px 24px 80px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '40px', color: '#F0F0F8', marginBottom: '12px' }}>
            Complete Curriculum
          </h2>
          <p style={{ color: '#8888AA', fontSize: '17px' }}>
            {totalTopics} topics organized from beginner to advanced
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/docs/${category.id}/${category.topics[0]?.slug}`}
              style={{ textDecoration: 'none' }}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div style={{
                background: '#12121E',
                border: `1px solid ${hoveredCategory === category.id ? 'rgba(201,168,76,0.3)' : '#1E1E35'}`,
                borderRadius: '16px', padding: '28px', cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: hoveredCategory === category.id ? 'translateY(-2px)' : 'none',
                boxShadow: hoveredCategory === category.id ? '0 8px 32px rgba(201,168,76,0.1)' : 'none',
                height: '100%', boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '12px', flexShrink: 0,
                    background: `${category.color}15`, border: `1px solid ${category.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Icon name={category.icon} size={20} color={category.color} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#F0F0F8', marginBottom: '4px' }}>
                      {category.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#8888AA', lineHeight: 1.5 }}>
                      {category.description}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                  {category.topics.slice(0, 4).map(t => (
                    <span key={t.id} style={{
                      fontSize: '11px', color: '#555570',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid #1E1E35',
                      borderRadius: '4px', padding: '2px 8px'
                    }}>
                      {t.title}
                    </span>
                  ))}
                  {category.topics.length > 4 && (
                    <span style={{ fontSize: '11px', color: '#555570', padding: '2px 8px' }}>
                      +{category.topics.length - 4} more
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#555570' }}>
                    {category.topics.length} topics
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: category.color, fontWeight: 500 }}>
                    Explore <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Lessons — API contracts & testing */}
      <section style={{ padding: '0 24px 80px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '32px', color: '#F0F0F8', marginBottom: '10px' }}>
            API Contracts &amp; Testing
          </h2>
          <p style={{ color: '#8888AA', fontSize: '16px' }}>
            Ship integrations you can trust — design-first contracts and the tests that catch regressions early
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {FEATURED_LESSONS.map((lesson) => (
            <Link
              key={`${lesson.category}/${lesson.slug}`}
              href={`/docs/${lesson.category}/${lesson.slug}`}
              style={{
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px',
                background: '#12121E', border: '1px solid #1E1E35', borderRadius: '14px',
                padding: '18px 20px'
              }}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <BookOpen size={17} color="#C9A84C" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8', marginBottom: '3px' }}>
                  {lesson.title}
                </div>
                <div style={{ fontSize: '12.5px', color: '#8888AA', lineHeight: 1.4 }}>
                  {lesson.desc}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid #1E1E35' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '40px', color: '#F0F0F8', marginBottom: '12px' }}>
              Not Just Another Docs Site
            </h2>
            <p style={{ color: '#8888AA', fontSize: '17px' }}>
              Every concept taught with depth, intuition, and production context
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {FEATURES.map((f, i) => {
              const FeatureIcon = f.icon;
              return (
                <div key={i} style={{ background: '#12121E', border: '1px solid #1E1E35', borderRadius: '16px', padding: '28px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
                  }}>
                    <FeatureIcon size={20} color="#C9A84C" />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#F0F0F8', marginBottom: '8px' }}>{f.title}</h3>
                  <p style={{ fontSize: '14px', color: '#8888AA', lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 24px', textAlign: 'center' }}>
        <div style={{
          maxWidth: '700px', margin: '0 auto',
          background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)',
          borderRadius: '24px', padding: '60px 40px'
        }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '40px', color: '#F0F0F8', marginBottom: '16px' }}>
            Ready to Master Backend?
          </h2>
          <p style={{ color: '#8888AA', fontSize: '17px', marginBottom: '36px', lineHeight: 1.7 }}>
            Start from the absolute beginning or jump to any topic. Progress tracking,
            quizzes, and interactive demos make concepts stick permanently.
          </p>
          <Link href="/docs" style={{
            background: 'linear-gradient(135deg, #9B7B2E, #C9A84C, #E8C96B)',
            color: '#0A0A0F', padding: '16px 48px', borderRadius: '12px',
            fontSize: '16px', fontWeight: 700, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 24px rgba(201,168,76,0.3)'
          }}>
            Begin the Journey <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1E1E35', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{
            width: 24, height: 24, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Server size={12} color="#C9A84C" />
          </div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: '#F0F0F8' }}>
            Backend<span style={{ color: '#C9A84C' }}>Craft</span>
          </span>
        </div>
        <p style={{ color: '#555570', fontSize: '13px' }}>
          A Premium Interactive Backend Engineering Academy
        </p>
      </footer>
    </div>
  );
}
