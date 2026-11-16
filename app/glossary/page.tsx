'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { GLOSSARY } from '@/data/curriculum';
import { Search, BookOpen, ChevronRight, ArrowLeft } from 'lucide-react';

export default function GlossaryPage() {
  const [search, setSearch] = useState('');
  const [focusedSearch, setFocusedSearch] = useState(false);
  const [stuck, setStuck] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // The bar sticks once its natural top reaches the 56px nav. Only then do we
  // reveal the bottom divider (so it isn't visible before any scrolling).
  useEffect(() => {
    const onScroll = () => {
      const el = searchBarRef.current;
      if (!el) return;
      setStuck(el.getBoundingClientRect().top <= 56.5);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const filtered = Object.entries(GLOSSARY).filter(([term, def]) =>
    !search || term.toLowerCase().includes(search.toLowerCase()) || def.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, [string, string][]>>((acc, entry) => {
    const letter = entry[0][0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(entry);
    return acc;
  }, {});

  const sortedLetters = Object.keys(grouped).sort();

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: 'Inter, sans-serif' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #1E1E35', padding: '0 24px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: '#F0F0F8' }}>
              Backend<span style={{ color: '#C9A84C' }}>Craft</span>
            </span>
          </Link>
          <ChevronRight size={12} color="#555570" />
          <span style={{ fontSize: '14px', color: '#8888AA' }}>Glossary</span>
        </div>
        <Link href="/docs" style={{
          fontSize: '13px', color: '#8888AA', textDecoration: 'none',
          background: '#12121E', border: '1px solid #1E1E35', borderRadius: '7px', padding: '6px 14px',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <ArrowLeft size={12} /> Back to Docs
        </Link>
      </nav>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <BookOpen size={22} color="#C9A84C" />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '40px', color: '#F0F0F8', lineHeight: 1 }}>
                Glossary
              </h1>
              <p style={{ fontSize: '14px', color: '#555570', marginTop: '4px' }}>
                {Object.keys(GLOSSARY).length} backend engineering terms, clearly defined
              </p>
            </div>
          </div>
        </div>

        {/* Sticky search bar — stays pinned below the nav on scroll (web + mobile) */}
        <div ref={searchBarRef} style={{
          position: 'sticky', top: '56px', zIndex: 40,
          background: '#0A0A0F', borderBottom: `1px solid ${stuck ? '#1E1E35' : 'transparent'}`,
          margin: '0 -24px', padding: '10px 24px 14px', transition: 'border-color 0.2s ease'
        }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#555570" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setFocusedSearch(true)}
              onBlur={() => setFocusedSearch(false)}
              placeholder="Search terms and definitions..."
              style={{
                width: '100%', background: '#12121E',
                border: `1px solid ${focusedSearch ? 'rgba(201,168,76,0.4)' : '#1E1E35'}`,
                borderRadius: '10px', padding: '12px 16px 12px 42px', fontSize: '15px',
                color: '#F0F0F8', outline: 'none', fontFamily: 'Inter, sans-serif',
                boxSizing: 'border-box', transition: 'border-color 0.2s ease'
              }}
            />
          </div>
        </div>

        {/* Letter index */}
        {!search && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '32px' }}>
            {sortedLetters.map(letter => (
              <a key={letter} href={`#letter-${letter}`} style={{
                width: '32px', height: '32px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', borderRadius: '6px', fontSize: '13px', fontWeight: 700,
                background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
                color: '#C9A84C', textDecoration: 'none'
              }}>{letter}</a>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#555570' }}>
            No terms found for "{search}"
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {sortedLetters.map(letter => (
              <div key={letter} id={`letter-${letter}`} style={{ scrollMarginTop: '130px' }}>
                <div style={{
                  fontSize: '11px', fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase',
                  letterSpacing: '0.12em', marginBottom: '10px', paddingBottom: '8px',
                  borderBottom: '1px solid rgba(201,168,76,0.15)'
                }}>
                  {letter}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {grouped[letter].map(([term, def]) => (
                    <div key={term} style={{
                      background: '#12121E', border: '1px solid #1E1E35', borderRadius: '10px',
                      padding: '16px 20px', transition: 'border-color 0.2s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#1E1E35'}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#F0F0F8', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace' }}>
                        {term}
                      </div>
                      <div style={{ fontSize: '14px', color: '#8888AA', lineHeight: 1.6 }}>
                        {def}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
