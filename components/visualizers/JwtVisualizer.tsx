'use client';

import { useState } from 'react';
import { KeyRound, Shield, FileJson, AlertTriangle } from 'lucide-react';

const SAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsIm5hbWUiOiJBbGljZSBTbWl0aCIsImVtYWlsIjoiYWxpY2VAZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMzYwMH0.SIGNATURE_HERE';

function b64Decode(str: string): string {
  try {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    return JSON.stringify(JSON.parse(atob(padded)), null, 2);
  } catch {
    return 'Invalid base64';
  }
}

const SECTIONS = [
  { key: 'header',    label: 'Header',    color: '#4F8EF7', Icon: FileJson,  note: 'Algorithm and token type. Always base64url encoded, never encrypted.' },
  { key: 'payload',   label: 'Payload',   color: '#C9A84C', Icon: Shield,    note: 'Claims (user data). Base64url encoded — readable by anyone. Never put secrets here.' },
  { key: 'signature', label: 'Signature', color: '#EF4444', Icon: KeyRound,  note: 'HMAC of header.payload signed with the server secret. Verifies integrity — cannot be forged without the secret.' },
];

export default function JwtVisualizer() {
  const [jwt, setJwt] = useState(SAMPLE_JWT);
  const [focused, setFocused] = useState(false);

  const parts = jwt.trim().split('.');
  const hasThree = parts.length === 3;

  const header    = hasThree ? b64Decode(parts[0]) : '';
  const payload   = hasThree ? b64Decode(parts[1]) : '';
  const sig       = hasThree ? parts[2] : '';

  const decodedContent = [header, payload, `${sig.slice(0, 40)}...\n\n// Verified server-side using:\n// HMAC-SHA256(base64url(header) + '.' + base64url(payload), SECRET)`];

  return (
    <div style={{ background: '#0D0D18', border: '1px solid #1E1E35', borderRadius: '16px', padding: '28px', fontFamily: 'Inter, sans-serif', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <KeyRound size={16} color="#C9A84C" />
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#F0F0F8', margin: 0 }}>JWT Decoder</h3>
      </div>
      <p style={{ fontSize: '13px', color: '#555570', marginBottom: '20px' }}>
        Paste any JWT to decode its structure. The payload is only base64 encoded — not encrypted.
      </p>

      {/* Input */}
      <textarea
        value={jwt}
        onChange={e => setJwt(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={3}
        placeholder="Paste a JWT token here..."
        style={{
          width: '100%', background: '#060608',
          border: `1px solid ${focused ? 'rgba(201,168,76,0.4)' : '#1E1E35'}`,
          borderRadius: '10px', padding: '14px 16px', fontSize: '12px',
          color: '#8888AA', fontFamily: 'JetBrains Mono, monospace', outline: 'none',
          resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box', marginBottom: '20px',
          transition: 'border-color 0.2s ease'
        }}
      />

      {hasThree ? (
        <>
          {/* Token visualization */}
          <div style={{ display: 'flex', gap: '2px', marginBottom: '20px', flexWrap: 'wrap', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', lineHeight: 1.6, wordBreak: 'break-all', padding: '14px', background: '#060608', border: '1px solid #1E1E35', borderRadius: '10px' }}>
            {parts.map((part, i) => (
              <span key={i}>
                <span style={{ color: SECTIONS[i]?.color ?? '#8888AA' }}>{part}</span>
                {i < parts.length - 1 && <span style={{ color: '#555570' }}>.</span>}
              </span>
            ))}
          </div>

          {/* Decoded sections */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '16px' }}>
            {SECTIONS.map((s, i) => {
              const SIcon = s.Icon;
              return (
                <div key={s.key} style={{ background: '#0A0A0F', border: `1px solid ${s.color}20`, borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: `${s.color}0A`, borderBottom: `1px solid ${s.color}18`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <SIcon size={13} color={s.color} />
                    <span style={{ fontSize: '11px', color: s.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{s.label}</span>
                  </div>
                  <pre style={{ padding: '12px 14px', margin: 0, fontSize: '12px', color: i === 2 ? '#EF4444' : '#C3E88D', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.7, overflow: 'auto', maxHeight: '180px' }}>
                    {decodedContent[i]}
                  </pre>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {SECTIONS.map(s => (
              <div key={s.key} style={{ background: `${s.color}08`, border: `1px solid ${s.color}18`, borderRadius: '8px', padding: '10px 12px' }}>
                <div style={{ fontSize: '11px', color: s.color, fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                <div style={{ fontSize: '12px', color: '#555570', lineHeight: 1.5 }}>{s.note}</div>
              </div>
            ))}
          </div>
        </>
      ) : jwt.trim().length > 10 ? (
        <div style={{ padding: '18px 20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <AlertTriangle size={16} color="#EF4444" />
          <span style={{ color: '#EF4444', fontSize: '14px' }}>Invalid JWT — must have exactly 3 base64url segments separated by dots</span>
        </div>
      ) : null}
    </div>
  );
}
