'use client';

import { useState, useEffect, useRef } from 'react';
import { Scale, Server, Globe, Play, Square, RotateCcw } from 'lucide-react';

type Algorithm = 'round-robin' | 'least-connections' | 'random';

interface ServerNode { id: number; label: string; connections: number; requests: number; healthy: boolean; }

const INITIAL_SERVERS: ServerNode[] = [
  { id: 1, label: 'Server 1', connections: 0, requests: 0, healthy: true },
  { id: 2, label: 'Server 2', connections: 0, requests: 0, healthy: true },
  { id: 3, label: 'Server 3', connections: 0, requests: 0, healthy: true },
];

export default function LoadBalancerVisualizer() {
  const [algo, setAlgo] = useState<Algorithm>('round-robin');
  const [servers, setServers] = useState<ServerNode[]>(INITIAL_SERVERS);
  const [rrIndex, setRrIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [activeServer, setActiveServer] = useState<number | null>(null);
  const [totalRequests, setTotalRequests] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rrRef = useRef(0);
  const serversRef = useRef(servers);
  serversRef.current = servers;

  const getNextServerId = (currentServers: ServerNode[]): number => {
    const healthy = currentServers.filter(s => s.healthy);
    if (healthy.length === 0) return -1;
    switch (algo) {
      case 'round-robin': {
        let tries = 0;
        while (tries < currentServers.length) {
          const s = currentServers[rrRef.current % currentServers.length];
          rrRef.current++;
          if (s.healthy) return s.id;
          tries++;
        }
        return -1;
      }
      case 'least-connections':
        return healthy.reduce((a, b) => a.connections <= b.connections ? a : b).id;
      case 'random':
        return healthy[Math.floor(Math.random() * healthy.length)].id;
    }
  };

  const sendRequest = () => {
    const serverId = getNextServerId(serversRef.current);
    if (serverId === -1) return;
    setActiveServer(serverId);
    setTotalRequests(p => p + 1);
    setServers(prev => prev.map(s =>
      s.id === serverId ? { ...s, connections: s.connections + 1, requests: s.requests + 1 } : s
    ));
    setTimeout(() => {
      setActiveServer(null);
      setServers(prev => prev.map(s =>
        s.id === serverId ? { ...s, connections: Math.max(0, s.connections - 1) } : s
      ));
    }, 900);
  };

  const toggleRun = () => {
    if (isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRunning(false);
    } else {
      setIsRunning(true);
      intervalRef.current = setInterval(sendRequest, 550);
    }
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setServers(INITIAL_SERVERS.map(s => ({ ...s })));
    setActiveServer(null);
    setTotalRequests(0);
    rrRef.current = 0;
    setRrIndex(0);
  };

  const toggleHealth = (id: number) => {
    setServers(prev => prev.map(s => s.id === id ? { ...s, healthy: !s.healthy } : s));
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const maxRequests = Math.max(...servers.map(s => s.requests), 1);

  return (
    <div style={{ background: '#0D0D18', border: '1px solid #1E1E35', borderRadius: '16px', padding: '28px', fontFamily: 'Inter, sans-serif', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Scale size={16} color="#C9A84C" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#F0F0F8', margin: 0 }}>Load Balancer Simulator</h3>
          </div>
          <p style={{ fontSize: '13px', color: '#555570' }}>Click servers to toggle health. Watch how each algorithm distributes traffic.</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(['round-robin', 'least-connections', 'random'] as Algorithm[]).map(a => (
            <button key={a} onClick={() => { if (!isRunning) { setAlgo(a); reset(); }}} style={{
              padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
              border: `1px solid ${algo === a ? 'rgba(201,168,76,0.4)' : '#1E1E35'}`,
              background: algo === a ? 'rgba(201,168,76,0.1)' : 'transparent',
              color: algo === a ? '#C9A84C' : '#8888AA', fontFamily: 'Inter, sans-serif',
              textTransform: 'capitalize', transition: 'all 0.15s ease'
            }}>{a}</button>
          ))}
        </div>
      </div>

      {/* Architecture */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        {/* Client */}
        <div style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.25)', borderRadius: '10px', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={16} color="#4F8EF7" />
          <span style={{ fontSize: '13px', color: '#4F8EF7', fontWeight: 500 }}>Clients</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <div style={{ width: '2px', height: '16px', background: isRunning ? '#C9A84C' : '#1E1E35', transition: 'background 0.3s' }} />
          <svg width="8" height="6" viewBox="0 0 8 6" style={{ display: 'block' }}>
            <polygon points="0,0 8,0 4,6" fill={isRunning ? '#C9A84C' : '#1E1E35'} />
          </svg>
        </div>

        {/* Load Balancer */}
        <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '10px', padding: '11px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scale size={16} color="#C9A84C" />
          <span style={{ fontSize: '13px', color: '#C9A84C', fontWeight: 600 }}>Load Balancer</span>
          <span style={{ fontSize: '11px', color: '#9B7B2E', background: 'rgba(201,168,76,0.1)', borderRadius: '4px', padding: '2px 7px', textTransform: 'capitalize' }}>{algo}</span>
        </div>

        <svg width="8" height="6" viewBox="0 0 8 6" style={{ display: 'block', margin: '0 auto' }}>
          <polygon points="0,0 8,0 4,6" fill="#1E1E35" />
        </svg>

        {/* Servers */}
        <div style={{ display: 'flex', gap: '14px', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
          {servers.map(server => (
            <div
              key={server.id}
              onClick={() => toggleHealth(server.id)}
              style={{
                flex: '1', minWidth: '130px', maxWidth: '200px',
                background: server.id === activeServer ? 'rgba(34,197,94,0.08)' : server.healthy ? '#0F0F1A' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${server.id === activeServer ? 'rgba(34,197,94,0.4)' : server.healthy ? '#1E1E35' : 'rgba(239,68,68,0.3)'}`,
                borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                <Server size={22} color={server.id === activeServer ? '#22C55E' : server.healthy ? '#8888AA' : '#EF4444'} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#F0F0F8', marginBottom: '2px' }}>{server.label}</div>
              <div style={{ fontSize: '11px', color: server.healthy ? '#22C55E' : '#EF4444', marginBottom: '10px' }}>
                {server.healthy ? 'Healthy' : 'Down — click to restore'}
              </div>
              <div style={{ height: '3px', background: '#1E1E35', borderRadius: '999px', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ height: '100%', borderRadius: '999px', background: server.healthy ? '#22C55E' : '#EF4444', width: `${(server.requests / maxRequests) * 100}%`, transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#555570' }}>
                {server.requests} reqs · {server.connections} active
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ background: '#12121E', border: '1px solid #1E1E35', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', color: '#8888AA' }}>
          Total requests: <strong style={{ color: '#F0F0F8' }}>{totalRequests}</strong>
        </div>
        <div style={{ background: '#12121E', border: '1px solid #1E1E35', borderRadius: '8px', padding: '10px 16px', fontSize: '13px', color: '#8888AA' }}>
          Healthy servers: <strong style={{ color: '#22C55E' }}>{servers.filter(s => s.healthy).length}/{servers.length}</strong>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={toggleRun} style={{
          background: isRunning ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg, #9B7B2E, #C9A84C)',
          border: isRunning ? '1px solid rgba(239,68,68,0.3)' : 'none',
          borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 600,
          color: isRunning ? '#EF4444' : '#0A0A0F', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          display: 'flex', alignItems: 'center', gap: '7px'
        }}>
          {isRunning ? <><Square size={12} /> Stop Traffic</> : <><Play size={12} /> Start Traffic</>}
        </button>
        <button onClick={sendRequest} style={{
          background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.25)',
          borderRadius: '8px', padding: '9px 16px', fontSize: '13px', color: '#4F8EF7',
          cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <Globe size={12} /> Single Request
        </button>
        <button onClick={reset} style={{
          background: 'transparent', border: '1px solid #1E1E35', borderRadius: '8px',
          padding: '9px 14px', fontSize: '13px', color: '#8888AA', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <RotateCcw size={12} /> Reset
        </button>
      </div>
    </div>
  );
}
