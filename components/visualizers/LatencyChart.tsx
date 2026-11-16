'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Zap } from 'lucide-react';

const DATA = [
  { name: 'L1 Cache',         ns: 0.5,       label: '0.5ns',   color: '#22C55E', category: 'CPU' },
  { name: 'L2 Cache',         ns: 7,          label: '7ns',     color: '#22C55E', category: 'CPU' },
  { name: 'L3 Cache',         ns: 20,         label: '20ns',    color: '#4F8EF7', category: 'CPU' },
  { name: 'RAM Read',         ns: 100,        label: '100ns',   color: '#4F8EF7', category: 'Memory' },
  { name: 'Redis (same DC)',  ns: 500000,     label: '0.5ms',   color: '#22C55E', category: 'Network' },
  { name: 'SSD Random Read',  ns: 150000,     label: '150µs',   color: '#C9A84C', category: 'Storage' },
  { name: 'DB Query (index)', ns: 1000000,    label: '1ms',     color: '#C9A84C', category: 'Network' },
  { name: 'Same DC Network',  ns: 500000,     label: '0.5ms',   color: '#4F8EF7', category: 'Network' },
  { name: 'HDD Seek',         ns: 10000000,   label: '10ms',    color: '#F97316', category: 'Storage' },
  { name: 'Cross-Continent',  ns: 150000000,  label: '150ms',   color: '#EF4444', category: 'Network' },
];

const LOG_DATA = DATA.map(d => ({ ...d, logNs: Math.log10(Math.max(d.ns, 0.1)) }));

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.[0]) {
    const d = payload[0].payload;
    return (
      <div style={{ background: '#12121E', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '10px', padding: '12px 16px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0F0F8', marginBottom: '4px' }}>{d.name}</div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: d.color, fontFamily: 'JetBrains Mono, monospace' }}>{d.label}</div>
        <div style={{ fontSize: '12px', color: '#555570', marginTop: '4px' }}>{d.category}</div>
      </div>
    );
  }
  return null;
};

export default function LatencyChart() {
  return (
    <div style={{ background: '#0D0D18', border: '1px solid #1E1E35', borderRadius: '16px', padding: '28px', fontFamily: 'Inter, sans-serif', marginBottom: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Zap size={16} color="#C9A84C" />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#F0F0F8', margin: 0 }}>Latency Numbers Every Engineer Must Know</h3>
        </div>
        <p style={{ fontSize: '13px', color: '#555570' }}>
          Log scale — each step is roughly 10x the previous. Hover bars for exact values.
        </p>
      </div>

      <div style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={LOG_DATA} layout="vertical" margin={{ left: 130, right: 70, top: 0, bottom: 0 }}>
            <XAxis type="number" hide domain={[0, 9]} />
            <YAxis
              type="category" dataKey="name" width={125}
              tick={{ fill: '#8888AA', fontSize: 12, fontFamily: 'Inter, sans-serif' }}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,168,76,0.04)' }} />
            <Bar dataKey="logNs" radius={[0, 4, 4, 0]}>
              {LOG_DATA.map((d, i) => (
                <Cell key={i} fill={d.color} opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '10px', marginTop: '20px' }}>
        {[
          { color: '#22C55E', label: 'Nanoseconds', examples: 'CPU caches, Redis in-process' },
          { color: '#4F8EF7', label: 'Microseconds', examples: 'RAM reads, SSD, same-DC network' },
          { color: '#F97316', label: 'Low milliseconds', examples: 'Indexed DB queries, HDD' },
          { color: '#EF4444', label: 'High milliseconds', examples: 'Cross-continent, unindexed DB' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', background: '#12121E', border: '1px solid #1E1E35', borderRadius: '8px', padding: '10px 12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, marginTop: '4px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#F0F0F8' }}>{item.label}</div>
              <div style={{ fontSize: '11px', color: '#555570', lineHeight: 1.4 }}>{item.examples}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
