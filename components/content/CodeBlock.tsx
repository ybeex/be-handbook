'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { highlightCode, resolveLanguage } from '@/lib/highlight';

interface CodeBlockProps {
  code: string;
  language?: string;
  label?: string;
  showLineNumbers?: boolean;
}

export default function CodeBlock({ code, language = 'typescript', label, showLineNumbers = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const trimmed = code.trim();
  const resolved = resolveLanguage(language);
  const html = highlightCode(trimmed, resolved);
  const lineCount = trimmed.split('\n').length;

  return (
    <div style={{
      background: '#0D0D18', border: '1px solid #1E1E35', borderRadius: '12px',
      overflow: 'hidden', marginBottom: '24px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '9px 16px', borderBottom: '1px solid #1E1E35', background: '#0F0F1A',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
            {(['#EF4444', '#F97316', '#22C55E'] as const).map((c, i) => (
              <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.7 }} />
            ))}
          </div>
          {label && (
            <span style={{ fontSize: '12px', color: '#555570', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {label}
            </span>
          )}
          <span style={{
            fontSize: '10px', color: '#C9A84C', background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.2)', borderRadius: '4px', padding: '2px 7px',
            textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
          }}>
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid #1E1E35',
            borderRadius: '6px', padding: '4px 10px', fontSize: '11px',
            color: copied ? '#22C55E' : '#8888AA', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '5px',
            flexShrink: 0, transition: 'color 0.2s',
          }}
        >
          {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>

      {/* Code body */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{
          display: 'flex', padding: '18px 0',
          fontSize: '13px', lineHeight: '1.75', fontFamily: 'JetBrains Mono, monospace',
        }}>
          {showLineNumbers && (
            <div
              className="code-gutter"
              aria-hidden="true"
              style={{
                width: '44px', minWidth: '44px', textAlign: 'right',
                paddingRight: '18px', color: '#2E2E4E',
                userSelect: 'none', fontSize: '12px', flexShrink: 0,
              }}
            >
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
          )}
          <pre style={{ margin: 0, padding: 0, flex: 1, minWidth: 0 }}>
            <code
              className={`hljs language-${resolved}`}
              style={{ background: 'transparent', padding: 0, fontFamily: 'inherit' }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </pre>
        </div>
      </div>
    </div>
  );
}
