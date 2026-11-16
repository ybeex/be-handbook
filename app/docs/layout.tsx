'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Menu, Server, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0A0A0F' }}>

      {/* ── Desktop sidebar (hidden on mobile via media-query class) ── */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar   { display: flex !important; }
        }
        @media (min-width: 769px) {
          .desktop-sidebar { display: flex !important; }
          .mobile-topbar   { display: none !important; }
        }
      `}</style>

      <div className="desktop-sidebar" style={{ flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMobileSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
            }}
          />
          {/* Drawer */}
          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 101,
            width: '280px', maxWidth: '85vw',
            boxShadow: '4px 0 32px rgba(0,0,0,0.5)',
          }}>
            <Sidebar onClose={() => setMobileSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* ── Main content ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Mobile top bar */}
        <div
          className="mobile-topbar"
          style={{
            alignItems: 'center', gap: '12px',
            padding: '10px 16px', borderBottom: '1px solid #1E1E35',
            background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(16px)',
            position: 'sticky', top: 0, zIndex: 40,
          }}
        >
          <button
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open navigation"
            style={{
              background: '#12121E', border: '1px solid #1E1E35',
              borderRadius: '8px', padding: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Menu size={18} color="#8888AA" />
          </button>

          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{
              width: 24, height: 24, background: 'rgba(201,168,76,0.1)',
              border: '1px solid rgba(201,168,76,0.3)', borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Server size={12} color="#C9A84C" />
            </div>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: '#F0F0F8' }}>
              Backend<span style={{ color: '#C9A84C' }}>Craft</span>
            </span>
          </Link>
        </div>

        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
