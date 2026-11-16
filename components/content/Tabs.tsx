'use client';

import { useState } from 'react';

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
}

export default function Tabs({ tabs }: TabsProps) {
  const [active, setActive] = useState(0);
  return (
    <div style={{ marginBottom: '24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
              border: `1px solid ${active === i ? 'rgba(201,168,76,0.35)' : 'transparent'}`,
              background: active === i ? 'rgba(201,168,76,0.1)' : 'transparent',
              color: active === i ? '#C9A84C' : '#8888AA',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[active].content}</div>
    </div>
  );
}
