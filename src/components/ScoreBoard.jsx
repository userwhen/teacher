import { formatTime } from '../utils/scores.js'

// Props:
//   records: [{ score, total, pct, timeUsed, timestamp }]
//   currentIdx: 本次成績在 records 的 index（通常是 0）

export default function ScoreBoard({ records, currentIdx = 0 }) {
  if (!records || records.length === 0) return null

  const current = records[currentIdx]

  return (
    <div style={{ marginTop: '1rem' }}>
      {/* 歷史紀錄 */}
      {records.length > 1 && (
        <div>
          <p className="label" style={{ marginBottom: 8 }}>歷史紀錄</p>
          <div style={styles.table}>
            <div style={styles.headerRow}>
              <span style={styles.col1}>次數</span>
              <span style={styles.col2}>得分</span>
              <span style={styles.col3}>正確率</span>
              <span style={styles.col4}>時間</span>
            </div>
            {records.map((r, i) => (
              <div key={i} style={{
                ...styles.row,
                background: i === currentIdx ? 'var(--c-primary-bg)' : 'var(--c-surface)',
                fontWeight: i === currentIdx ? 600 : 400,
              }}>
                <span style={styles.col1}>
                  {i === currentIdx
                    ? <span style={{ color:'var(--c-primary)' }}>本次</span>
                    : `第 ${records.length - i} 次`}
                </span>
                <span style={styles.col2}>{r.score} / {r.total}</span>
                <span style={{ ...styles.col3, color: r.pct >= 80 ? 'var(--c-success)' : r.pct >= 60 ? 'var(--c-warning)' : 'var(--c-danger)' }}>
                  {r.pct}%
                </span>
                <span style={styles.col4}>
                  {r.timeUsed != null ? formatTime(r.timeUsed) : '—'}
                </span>
              </div>
            ))}
          </div>

          {/* 與上次比較 */}
          {records.length >= 2 && currentIdx === 0 && (
            <CompareBar current={records[0]} previous={records[1]} />
          )}
        </div>
      )}
    </div>
  )
}

function CompareBar({ current, previous }) {
  const diff = current.pct - previous.pct
  if (diff === 0) return (
    <div style={styles.compare}>
      <i className="ti ti-minus" aria-hidden="true" /> 與上次相同
    </div>
  )
  return (
    <div style={{ ...styles.compare, color: diff > 0 ? '#27500A' : '#791F1F', background: diff > 0 ? 'var(--c-success-bg)' : 'var(--c-danger-bg)' }}>
      <i className={`ti ti-trending-${diff > 0 ? 'up' : 'down'}`} aria-hidden="true" />
      {' '}比上次{diff > 0 ? '進步' : '退步'} {Math.abs(diff)}%
    </div>
  )
}

const styles = {
  table: {
    border: '1px solid var(--c-border)',
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    fontSize: 13,
  },
  headerRow: {
    display: 'flex',
    background: 'var(--c-bg)',
    padding: '6px 12px',
    color: 'var(--c-text-muted)',
    fontWeight: 500,
    fontSize: 12,
    borderBottom: '1px solid var(--c-border)',
  },
  row: {
    display: 'flex',
    padding: '8px 12px',
    borderBottom: '1px solid var(--c-border)',
    alignItems: 'center',
    transition: 'background 0.1s',
  },
  col1: { width: 60, flexShrink: 0 },
  col2: { flex: 1 },
  col3: { flex: 1 },
  col4: { width: 60, flexShrink: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  compare: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    fontWeight: 500,
    marginTop: 8,
    color: 'var(--c-text-muted)',
    background: 'var(--c-bg)',
  },
}
