'use client';

import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Play, RotateCcw, Terminal } from 'lucide-react';

const DEMO_CODE = `console.log('1: Synchronous');

setTimeout(() => {
  console.log('4: Timeout (macrotask)');
}, 0);

Promise.resolve().then(() => {
  console.log('3: Promise (microtask)');
});

console.log('2: Synchronous');

// Output order:
// 1 → 2 → 3 → 4`;

export default function EventLoopVisualizer() {
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [log, setLog] = useState<string[]>([]);
  const [phaseLabel, setPhaseLabel] = useState('');
  const [callStack, setCallStack] = useState<string[]>([]);
  const [microtaskQueue, setMicrotaskQueue] = useState<string[]>([]);
  const [macrotaskQueue, setMacrotaskQueue] = useState<string[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const delay = (ms: number) => new Promise<void>(r => { timers.current.push(setTimeout(r, ms)); });
  const addLog = (msg: string) => setLog(p => [...p, msg]);

  const simulate = async () => {
    clear();
    setPhase('running'); setLog([]); setCallStack([]); setMicrotaskQueue([]); setMacrotaskQueue([]);

    setPhaseLabel('Call Stack — synchronous execution');
    setCallStack(['main()']);
    await delay(500);
    setCallStack(['main()', 'console.log("1")']);
    await delay(700); addLog('1: Synchronous'); setCallStack(['main()']); await delay(400);

    setCallStack(['main()', 'setTimeout(cb, 0)']); setPhaseLabel('setTimeout → handed to Web APIs');
    await delay(700); setCallStack(['main()']); setMacrotaskQueue(['timeout cb']); await delay(300);

    setCallStack(['main()', 'Promise.resolve().then(cb)']); setPhaseLabel('Promise → microtask queued');
    await delay(700); setCallStack(['main()']); setMicrotaskQueue(['promise .then']); await delay(300);

    setCallStack(['main()', 'console.log("2")']); setPhaseLabel('Call Stack — synchronous execution');
    await delay(700); addLog('2: Synchronous'); setCallStack(['main()']); await delay(400);
    setCallStack([]); await delay(300);

    setPhaseLabel('Microtask Queue drains — ALL microtasks before any macrotask');
    setCallStack(['promise callback']); setMicrotaskQueue([]);
    await delay(800); addLog('3: Promise (microtask)'); setCallStack([]); await delay(400);

    setPhaseLabel('Macrotask Queue — next event loop tick');
    setCallStack(['timeout callback']); setMacrotaskQueue([]);
    await delay(800); addLog('4: Timeout (macrotask)'); setCallStack([]); await delay(300);

    setPhaseLabel('Event loop complete');
    setPhase('done');
  };

  const reset = () => { clear(); setPhase('idle'); setLog([]); setPhaseLabel(''); setCallStack([]); setMicrotaskQueue([]); setMacrotaskQueue([]); };
  useEffect(() => () => clear(), []);

  return (
    <div style={{ background: '#0D0D18', border: '1px solid #1E1E35', borderRadius: '16px', padding: '28px', fontFamily: 'Inter, sans-serif', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <RefreshCw size={16} color="#C9A84C" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#F0F0F8', margin: 0 }}>Node.js Event Loop Visualizer</h3>
          </div>
          <p style={{ fontSize: '13px', color: '#555570' }}>Watch call stack, microtasks, and macrotasks execute step by step</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {phase !== 'idle' && (
            <button onClick={reset} style={{ background: 'transparent', border: '1px solid #1E1E35', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', color: '#8888AA', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RotateCcw size={12} /> Reset
            </button>
          )}
          <button onClick={simulate} disabled={phase === 'running'} style={{ background: phase === 'running' ? '#1E1E35' : 'linear-gradient(135deg, #9B7B2E, #C9A84C)', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: phase === 'running' ? 'wait' : 'pointer', color: phase === 'running' ? '#555570' : '#0A0A0F', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Play size={13} /> {phase === 'running' ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Code panel */}
        <div style={{ background: '#0A0A0F', border: '1px solid #1E1E35', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', borderBottom: '1px solid #1E1E35', background: '#0F0F1A', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['#EF4444','#F97316','#22C55E'].map((c,i) => <div key={i} style={{ width:8,height:8,borderRadius:'50%',background:c,opacity:0.7 }} />)}
            </div>
            <span style={{ fontSize: '11px', color: '#C9A84C', fontFamily: 'JetBrains Mono, monospace', marginLeft: '6px' }}>demo.js</span>
          </div>
          <pre style={{ padding: '16px', margin: 0, fontSize: '12px', color: '#8888AA', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.7, overflow: 'auto' }}>{DEMO_CODE}</pre>
        </div>

        {/* Queue panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { label: 'Call Stack', items: callStack, color: '#4F8EF7' },
            { label: 'Microtask Queue', items: microtaskQueue, color: '#9B5DE5' },
            { label: 'Macrotask Queue', items: macrotaskQueue, color: '#F97316' },
          ].map(q => (
            <div key={q.label} style={{ background: '#0A0A0F', border: '1px solid #1E1E35', borderRadius: '10px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: q.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px' }}>{q.label}</div>
              <div style={{ minHeight: '28px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {q.items.length === 0
                  ? <div style={{ fontSize: '11px', color: '#2E2E4E', fontStyle: 'italic' }}>empty</div>
                  : q.items.map((item, i) => (
                      <div key={i} style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', background: `${q.color}12`, border: `1px solid ${q.color}25`, borderRadius: '4px', padding: '2px 8px', color: q.color }}>{item}</div>
                    ))
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phase indicator */}
      {phaseLabel && (
        <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px', color: '#C9A84C', fontWeight: 500 }}>
          {phaseLabel}
        </div>
      )}

      {/* Console */}
      <div style={{ background: '#060608', border: '1px solid #1E1E35', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #1E1E35', background: '#0A0A0F', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Terminal size={12} color="#555570" />
          <span style={{ fontSize: '11px', color: '#555570', fontFamily: 'JetBrains Mono, monospace' }}>console output</span>
        </div>
        <div style={{ padding: '12px 14px', minHeight: '72px' }}>
          {log.length === 0
            ? <span style={{ fontSize: '13px', color: '#2E2E4E', fontFamily: 'JetBrains Mono, monospace' }}>Click Run Code to execute...</span>
            : log.map((entry, i) => (
                <div key={i} style={{ fontSize: '13px', color: '#22C55E', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.9 }}>
                  <span style={{ color: '#555570' }}>&gt; </span>{entry}
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
}
