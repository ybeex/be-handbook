'use client';

import { useState } from 'react';
import { Globe, Server, MapPin, Lock, ArrowRight, Play, ChevronDown, ChevronRight } from 'lucide-react';

const STEPS = [
  { label: 'DNS Lookup', detail: 'Browser resolves api.example.com\nDNS returns: 93.184.216.34\nCached for TTL seconds', from: 'Client', to: 'DNS Server', color: '#4F8EF7', FromIcon: Globe, ToIcon: MapPin },
  { label: 'TCP Handshake', detail: 'Client → SYN\nServer → SYN-ACK\nClient → ACK\n3-way handshake establishes connection', from: 'Client', to: 'Server', color: '#9B5DE5', FromIcon: Globe, ToIcon: Server },
  { label: 'TLS Handshake', detail: 'Client Hello (cipher suites)\nServer Hello + Certificate\nKey exchange (ECDH)\nSession keys derived — all future data encrypted', from: 'Client', to: 'Server', color: '#F97316', FromIcon: Globe, ToIcon: Lock },
  { label: 'HTTP Request', detail: 'GET /api/users HTTP/1.1\nHost: api.example.com\nAuthorization: Bearer eyJ...\nAccept: application/json', from: 'Client', to: 'Server', color: '#C9A84C', FromIcon: Globe, ToIcon: Server },
  { label: 'Server Processing', detail: 'Auth middleware verifies JWT\nRoute handler executes\nDatabase query runs\nResponse serialized to JSON', from: 'Server', to: 'Server', color: '#22C55E', FromIcon: Server, ToIcon: Server },
  { label: 'HTTP Response', detail: 'HTTP/1.1 200 OK\nContent-Type: application/json\nCache-Control: max-age=300\n[{"id":1,"name":"Alice"}, ...]', from: 'Server', to: 'Client', color: '#4F8EF7', FromIcon: Server, ToIcon: Globe },
];

export default function HttpVisualizer() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);

  const play = async () => {
    setPlaying(true);
    for (let i = 0; i < STEPS.length; i++) {
      setActiveStep(i);
      await new Promise(r => setTimeout(r, 1300));
    }
    setPlaying(false);
    setTimeout(() => setActiveStep(null), 800);
  };

  return (
    <div style={{ background: '#0D0D18', border: '1px solid #1E1E35', borderRadius: '16px', padding: '28px', fontFamily: 'Inter, sans-serif', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Globe size={16} color="#C9A84C" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#F0F0F8', margin: 0 }}>HTTP Request Lifecycle</h3>
          </div>
          <p style={{ fontSize: '13px', color: '#555570' }}>What happens when a browser makes an API call</p>
        </div>
        <button onClick={play} disabled={playing} style={{
          background: playing ? '#1E1E35' : 'linear-gradient(135deg, #9B7B2E, #C9A84C)',
          border: 'none', borderRadius: '8px', padding: '9px 18px',
          fontSize: '13px', fontWeight: 600, cursor: playing ? 'wait' : 'pointer',
          color: playing ? '#555570' : '#0A0A0F', fontFamily: 'Inter, sans-serif',
          display: 'flex', alignItems: 'center', gap: '7px'
        }}>
          <Play size={13} />
          {playing ? 'Simulating...' : 'Simulate Request'}
        </button>
      </div>

      {/* Actor nodes */}
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '24px', gap: '8px' }}>
        {[
          { label: 'Client', sublabel: 'Browser / App', Icon: Globe, color: '#4F8EF7' },
          { label: 'DNS Server', sublabel: 'Resolves domains', Icon: MapPin, color: '#9B5DE5' },
          { label: 'API Server', sublabel: 'Your backend', Icon: Server, color: '#22C55E' },
        ].map((actor, i) => {
          const A = actor.Icon;
          return (
            <div key={i} style={{
              flex: 1, textAlign: 'center', background: '#12121E',
              border: '1px solid #1E1E35', borderRadius: '12px', padding: '16px 8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                <A size={24} color={actor.color} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#F0F0F8' }}>{actor.label}</div>
              <div style={{ fontSize: '11px', color: '#555570', marginTop: '3px' }}>{actor.sublabel}</div>
            </div>
          );
        })}
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {STEPS.map((s, i) => {
          const isActive = activeStep === i;
          return (
            <div
              key={i}
              onClick={() => setActiveStep(isActive ? null : i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                background: isActive ? `${s.color}10` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isActive ? `${s.color}30` : '#1E1E35'}`,
                transition: 'all 0.25s ease'
              }}
            >
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                background: isActive ? s.color : '#1E1E35',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: isActive ? '#0A0A0F' : '#555570',
                transition: 'all 0.25s ease'
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: isActive ? s.color : '#F0F0F8' }}>
                  {s.label}
                </div>
                {isActive && (
                  <pre style={{ margin: '6px 0 0', fontSize: '12px', color: '#8888AA', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {s.detail}
                  </pre>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#555570', flexShrink: 0 }}>
                <s.FromIcon size={12} />
                <ArrowRight size={11} />
                <s.ToIcon size={12} />
              </div>
              {isActive ? <ChevronDown size={14} color="#555570" /> : <ChevronRight size={14} color="#555570" />}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: '12px', color: '#555570', marginTop: '16px', textAlign: 'center' }}>
        Click any step to expand — or press Simulate to animate the full request flow
      </p>
    </div>
  );
}
