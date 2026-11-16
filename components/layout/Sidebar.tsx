'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CATEGORIES } from '@/data/curriculum';
import Icon from '@/components/ui/Icon';
import {
  Server, ChevronDown, ChevronRight, Search, PlayCircle,
  FlaskConical, BookOpen, LayoutDashboard, Home
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

const DIFFICULTY_COLORS = {
  beginner: '#22C55E',
  intermediate: '#F97316',
  advanced: '#EF4444',
};

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(CATEGORIES.map(c => c.id))
  );
  const [search, setSearch] = useState('');

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    topics: cat.topics.filter(t =>
      !search || t.title.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => !search || cat.topics.length > 0);

  return (
    <div style={{
      width: '260px', minWidth: '260px', height: '100vh',
      background: '#0A0A0F', borderRight: '1px solid #1E1E35',
      display: 'flex', flexDirection: 'column', position: 'sticky', top: 0,
      fontFamily: 'Inter, sans-serif', overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid #1E1E35' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div style={{
            width: 28, height: 28, background: 'rgba(201,168,76,0.12)',
            border: '1px solid rgba(201,168,76,0.3)', borderRadius: '7px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Server size={13} color="#C9A84C" />
          </div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: '#F0F0F8', fontWeight: 600 }}>
            Backend<span style={{ color: '#C9A84C' }}>Craft</span>
          </span>
        </Link>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={13} color="#555570" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search topics..."
            style={{
              width: '100%', background: '#12121E', border: '1px solid #1E1E35',
              borderRadius: '8px', padding: '7px 10px 7px 30px', fontSize: '13px',
              color: '#F0F0F8', outline: 'none', fontFamily: 'Inter, sans-serif',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        {filteredCategories.map(category => (
          <div key={category.id} style={{ marginBottom: '2px' }}>
            <button
              onClick={() => toggleCategory(category.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '7px 10px', borderRadius: '8px', border: 'none',
                background: 'transparent', cursor: 'pointer', color: '#8888AA',
                fontSize: '11px', fontWeight: 700, textAlign: 'left',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              <Icon name={category.icon} size={13} color={category.color} />
              <span style={{ flex: 1, color: '#F0F0F8' }}>{category.title}</span>
              {expandedCategories.has(category.id)
                ? <ChevronDown size={11} color="#555570" />
                : <ChevronRight size={11} color="#555570" />
              }
            </button>

            {expandedCategories.has(category.id) && (
              <div style={{ paddingLeft: '4px' }}>
                {category.topics.map(topic => {
                  const isActive = pathname.includes(`/${topic.slug}`);
                  return (
                    <Link
                      key={topic.id}
                      href={`/docs/${category.id}/${topic.slug}`}
                      onClick={onClose}
                      style={{ textDecoration: 'none' }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '6px 10px', borderRadius: '7px', marginLeft: '4px',
                        background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
                        borderLeft: isActive ? '2px solid #C9A84C' : '2px solid transparent',
                        cursor: 'pointer', transition: 'all 0.15s ease',
                      }}>
                        <Icon name={topic.icon} size={12} color={isActive ? '#C9A84C' : '#555570'} />
                        <span style={{ fontSize: '13px', color: isActive ? '#C9A84C' : '#8888AA', flex: 1, lineHeight: 1.3 }}>
                          {topic.title}
                        </span>
                        <div style={{
                          width: '5px', height: '5px', borderRadius: '50%',
                          background: DIFFICULTY_COLORS[topic.difficulty], flexShrink: 0, opacity: 0.7
                        }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Extra nav items */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #1E1E35', paddingTop: '14px' }}>
          {[
            { href: '/playground', icon: PlayCircle, label: 'Interactive Playground' },
            { href: '/interview', icon: BookOpen, label: 'Interview Prep' },
            { href: '/system-design', icon: LayoutDashboard, label: 'System Design Explorer' },
            { href: '/quiz', icon: FlaskConical, label: 'Quiz Mode' },
            { href: '/glossary', icon: BookOpen, label: 'Glossary' },
          ].map(item => {
            const ItemIcon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '7px 10px', borderRadius: '8px',
                  color: isActive ? '#C9A84C' : '#8888AA',
                  fontSize: '13px', cursor: 'pointer',
                  background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
                }}>
                  <ItemIcon size={13} color={isActive ? '#C9A84C' : '#555570'} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Difficulty legend */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1E1E35' }}>
        <div style={{ fontSize: '10px', color: '#555570', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px', fontWeight: 600 }}>
          Difficulty
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {(['beginner', 'intermediate', 'advanced'] as const).map(d => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: DIFFICULTY_COLORS[d] }} />
              <span style={{ fontSize: '11px', color: '#555570', textTransform: 'capitalize' }}>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
