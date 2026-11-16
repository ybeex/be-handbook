'use client';

interface ComparisonRow {
  aspect: string;
  [key: string]: string;
}

interface ComparisonTableProps {
  headers: string[];
  rows: ComparisonRow[];
  highlight?: string;
}

export default function ComparisonTable({ headers, rows, highlight }: ComparisonTableProps) {
  return (
    <div style={{
      borderRadius: '12px', overflow: 'hidden', border: '1px solid #1E1E35',
      marginBottom: '24px', fontFamily: 'Inter, sans-serif'
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr>
            <th style={{
              background: '#0F0F1A', padding: '12px 16px', textAlign: 'left',
              color: '#555570', fontSize: '12px', textTransform: 'uppercase',
              letterSpacing: '0.06em', fontWeight: 600, borderBottom: '1px solid #1E1E35'
            }}>
              Aspect
            </th>
            {headers.map(h => (
              <th key={h} style={{
                background: h === highlight ? 'rgba(201,168,76,0.08)' : '#0F0F1A',
                padding: '12px 16px', textAlign: 'left',
                color: h === highlight ? '#C9A84C' : '#F0F0F8',
                fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em',
                fontWeight: 600, borderBottom: '1px solid #1E1E35',
                borderLeft: h === highlight ? '1px solid rgba(201,168,76,0.2)' : 'none'
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td style={{
                padding: '12px 16px', color: '#F0F0F8', fontWeight: 500,
                borderBottom: i < rows.length - 1 ? '1px solid #1E1E35' : 'none',
                background: '#12121E'
              }}>
                {row.aspect}
              </td>
              {headers.map(h => (
                <td key={h} style={{
                  padding: '12px 16px', color: '#8888AA', lineHeight: 1.5,
                  borderBottom: i < rows.length - 1 ? '1px solid #1E1E35' : 'none',
                  background: h === highlight ? 'rgba(201,168,76,0.04)' : '#12121E',
                  borderLeft: h === highlight ? '1px solid rgba(201,168,76,0.1)' : 'none'
                }}>
                  {row[h]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
