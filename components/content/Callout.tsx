'use client';

import { Info, AlertTriangle, CheckCircle, XCircle, Sparkles } from 'lucide-react';

interface CalloutProps {
  type?: 'info' | 'warning' | 'success' | 'danger' | 'gold';
  title?: string;
  children: React.ReactNode;
}

const STYLES = {
  info:    { bg: 'rgba(79,142,247,0.08)',  border: 'rgba(79,142,247,0.25)',  IconComp: Info,          color: '#4F8EF7' },
  warning: { bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.25)',  IconComp: AlertTriangle,  color: '#F97316' },
  success: { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)',   IconComp: CheckCircle,    color: '#22C55E' },
  danger:  { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   IconComp: XCircle,        color: '#EF4444' },
  gold:    { bg: 'rgba(201,168,76,0.08)',  border: 'rgba(201,168,76,0.25)',  IconComp: Sparkles,       color: '#C9A84C' },
};

export default function Callout({ type = 'info', title, children }: CalloutProps) {
  const s = STYLES[type];
  const IconComp = s.IconComp;
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: '12px',
      padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ flexShrink: 0, marginTop: '2px' }}>
        <IconComp size={16} color={s.color} />
      </div>
      <div>
        {title && (
          <p style={{ fontSize: '14px', fontWeight: 600, color: s.color, marginBottom: '6px' }}>
            {title}
          </p>
        )}
        <div style={{ fontSize: '14px', color: '#8888AA', lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  );
}
