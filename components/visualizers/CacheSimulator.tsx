'use client';

import { useState } from 'react';
import { Zap, Database, RotateCcw, TrendingUp } from 'lucide-react';

interface CacheEntry { key: string; value: string; hits: number; age: number; }

export default function CacheSimulator() {
  const [cacheSize, setCacheSize] = useState(4);
  const [cache, setCache] = useState<CacheEntry[]>([]);
  const [log, setLog] = useState<{ type: 'hit' | 'miss'; key: string; msg: string }[]>([]);
  const [inputKey, setInputKey] = useState('');
  const [strategy, setStrategy] = useState<'lru' | 'lfu' | 'fifo'>('lru');
  const [inputFocused, setInputFocused] = useState(false);

  const SAMPLE_KEYS = ['user:123', 'product:456', 'session:abc', 'config:main', 'user:456'];

  const get = (key: string) => {
    const existing = cache.find(e => e.key === key);
    if (existing) {
      setLog(prev => [{ type: 'hit', key, msg: `HIT — "${key}" served from cache (${existing.hits + 1} total hits)` }, ...prev.slice(0, 14)]);
      setCache(prev => prev.map(e => e.key === key ? { ...e, hits: e.hits + 1, age: 0 } : { ...e, age: e.age + 1 }));
      return;
    }
    const newEntry: CacheEntry = { key, value: `data_${Math.random().toString(36).slice(2, 8)}`, hits: 1, age: 0 };
    setLog(prev => [{ type: 'miss', key, msg: `MISS — "${key}" not in cache, fetched from DB` }, ...prev.slice(0, 14)]);
    setCache(prev => {
      const aged = prev.map(e => ({ ...e, age: e.age + 1 }));
      if (aged.length < cacheSize) return [...aged, newEntry];
      let evictIdx = 0;
      if (strategy === 'lru') evictIdx = aged.reduce((mi, e, i, arr) => e.age > arr[mi].age ? i : mi, 0);
      else if (strategy === 'lfu') evictIdx = aged.reduce((mi, e, i, arr) => e.hits < arr[mi].hits ? i : mi, 0);
      // fifo: evictIdx = 0
      const next = [...aged];
      next.splice(evictIdx, 1, newEntry);
      return next;
    });
  };

  const handleGet = () => { if (!inputKey.trim()) return; get(inputKey.trim()); setInputKey(''); };

  const reset = () => { setCache([]); setLog([]); setInputKey(''); };

  const totalOps = log.length;
  const hits = log.filter(l => l.type === 'hit').length;
  const hitRate = totalOps === 0 ? 0 : Math.round((hits / totalOps) * 100);

  return (
    <div style={{ background: '#0D0D18', border: '1px solid #1E1E35', borderRadius: '16px', padding: '28px', fontFamily: 'Inter, sans-serif', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Zap size={16} color="#C9A84C" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#F0F0F8', margin: 0 }}>Cache Simulator</h3>
          </div>
          <p style={{ fontSize: '13px', color: '#555570' }}>Simulate LRU, LFU, and FIFO eviction with live hit rate tracking</p>
        </div>
        <button onClick={reset} style={{ background: 'transparent', border: '1px solid #1E1E35', borderRadius: '7px', padding: '7px 12px', fontSize: '12px', color: '#8888AA', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          {(['lru', 'lfu', 'fifo'] as const).map(s => (
            <button key={s} onClick={() => { setStrategy(s); reset(); }} style={{
              padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
              border: `1px solid ${strategy === s ? 'rgba(201,168,76,0.4)' : '#1E1E35'}`,
              background: strategy === s ? 'rgba(201,168,76,0.1)' : 'transparent',
              color: strategy === s ? '#C9A84C' : '#8888AA', fontFamily: 'Inter, sans-serif',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>{s}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#555570' }}>Size:</span>
          {[2, 4, 6, 8].map(n => (
            <button key={n} onClick={() => { setCacheSize(n); reset(); }} style={{
              width: '28px', height: '28px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
              border: `1px solid ${cacheSize === n ? 'rgba(201,168,76,0.4)' : '#1E1E35'}`,
              background: cacheSize === n ? 'rgba(201,168,76,0.1)' : 'transparent',
              color: cacheSize === n ? '#C9A84C' : '#8888AA', fontFamily: 'Inter, sans-serif'
            }}>{n}</button>
          ))}
        </div>
      </div>

      {/* Cache slots */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {Array.from({ length: cacheSize }).map((_, i) => {
          const entry = cache[i];
          return (
            <div key={i} style={{
              flex: '1', minWidth: '110px',
              background: entry ? 'rgba(34,197,94,0.06)' : '#0A0A0F',
              border: `1px solid ${entry ? 'rgba(34,197,94,0.25)' : '#1E1E35'}`,
              borderRadius: '10px', padding: '12px', minHeight: '76px', transition: 'all 0.2s ease'
            }}>
              <div style={{ fontSize: '10px', color: '#555570', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Slot {i + 1}</div>
              {entry ? (
                <>
                  <div style={{ fontSize: '12px', color: '#22C55E', fontFamily: 'JetBrains Mono, monospace', marginBottom: '5px', wordBreak: 'break-all', fontWeight: 600 }}>{entry.key}</div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#555570' }}>
                    <span>hits: {entry.hits}</span>
                    <span>age: {entry.age}</span>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '11px', color: '#2E2E4E', fontStyle: 'italic' }}>empty</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          value={inputKey}
          onChange={e => setInputKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGet()}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          placeholder="Enter cache key (e.g. user:123)"
          style={{
            flex: 1, background: '#0A0A0F',
            border: `1px solid ${inputFocused ? 'rgba(201,168,76,0.4)' : '#1E1E35'}`,
            borderRadius: '8px', padding: '9px 14px', fontSize: '13px',
            color: '#F0F0F8', outline: 'none', fontFamily: 'JetBrains Mono, monospace',
            transition: 'border-color 0.2s ease'
          }}
        />
        <button onClick={handleGet} style={{
          background: 'linear-gradient(135deg, #9B7B2E, #C9A84C)', border: 'none',
          borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 700,
          color: '#0A0A0F', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          display: 'flex', alignItems: 'center', gap: '5px'
        }}>
          <Database size={13} /> GET
        </button>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#555570' }}>Try:</span>
        {SAMPLE_KEYS.map((k, i) => (
          <button key={i} onClick={() => get(k)} style={{
            fontSize: '11px', fontFamily: 'JetBrains Mono, monospace',
            background: 'rgba(255,255,255,0.03)', border: '1px solid #1E1E35',
            borderRadius: '4px', padding: '3px 8px', color: '#8888AA', cursor: 'pointer'
          }}>{k}</button>
        ))}
      </div>

      {/* Stats + Log */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ background: '#0A0A0F', border: '1px solid #1E1E35', borderRadius: '10px', padding: '16px', minWidth: '130px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <TrendingUp size={18} color={hitRate >= 70 ? '#22C55E' : hitRate >= 40 ? '#F97316' : '#EF4444'} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: hitRate >= 70 ? '#22C55E' : hitRate >= 40 ? '#F97316' : '#EF4444', fontFamily: 'Playfair Display, serif' }}>{hitRate}%</div>
          <div style={{ fontSize: '11px', color: '#555570', marginTop: '2px' }}>Hit Rate</div>
          <div style={{ fontSize: '11px', color: '#555570' }}>{hits}/{totalOps} ops</div>
        </div>
        <div style={{ flex: 1, background: '#0A0A0F', border: '1px solid #1E1E35', borderRadius: '10px', padding: '12px', maxHeight: '160px', overflow: 'auto', minWidth: '200px' }}>
          {log.length === 0
            ? <div style={{ fontSize: '12px', color: '#2E2E4E', fontFamily: 'JetBrains Mono, monospace' }}>No requests yet...</div>
            : log.map((entry, i) => (
                <div key={i} style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.9, color: entry.type === 'hit' ? '#22C55E' : '#EF4444' }}>
                  {entry.type === 'hit' ? '+' : '-'} {entry.msg}
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}
