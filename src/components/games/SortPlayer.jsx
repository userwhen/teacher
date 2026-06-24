import { useState, useMemo } from 'react'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function SortPlayer({ activity }) {
  const items      = activity.items || []
  const categories = activity.meta?.categories || []

  // 打亂順序的詞語池
  const pool = useMemo(() => shuffle(items.map((it, i) => ({ ...it, id: i }))), [])

  // buckets: { [catName]: id[] }
  const initBuckets = Object.fromEntries(categories.map(c => [c, []]))
  const [buckets, setBuckets]   = useState(initBuckets)
  const [remaining, setRemaining] = useState(pool.map(it => it.id))
  const [selected, setSelected]  = useState(null)  // 選中的 item id
  const [wrong, setWrong]        = useState([])     // 閃爍錯誤
  const [finished, setFinished]  = useState(false)
  const [mistakes, setMistakes]  = useState(0)

  const totalPlaced = Object.values(buckets).flat().length

  function pickItem(id) {
    setSelected(selected === id ? null : id)
    setWrong([])
  }

  function dropIntoBucket(cat) {
    if (selected === null) return
    const item = pool.find(it => it.id === selected)
    if (!item) return

    if (item.category === cat) {
      // 正確
      setBuckets(prev => ({ ...prev, [cat]: [...prev[cat], selected] }))
      setRemaining(prev => prev.filter(id => id !== selected))
      setSelected(null)
      if (totalPlaced + 1 === items.length) {
        setTimeout(() => setFinished(true), 400)
      }
    } else {
      // 錯誤
      setMistakes(m => m + 1)
      setWrong([selected])
      setTimeout(() => { setWrong([]); setSelected(null) }, 700)
    }
  }

  function handleRestart() {
    setBuckets(Object.fromEntries(categories.map(c => [c, []])))
    setRemaining(pool.map(it => it.id))
    setSelected(null)
    setWrong([])
    setFinished(false)
    setMistakes(0)
  }

  if (finished) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>
          {mistakes === 0 ? '🎉' : mistakes <= 3 ? '👍' : '💪'}
        </div>
        <p style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>分類完成！</p>
        <p style={{ color: 'var(--c-text-muted)', marginBottom: '1.5rem' }}>
          {mistakes === 0 ? '零失誤，太厲害了！' : `分錯 ${mistakes} 次`}
        </p>
        <button className="btn-primary" onClick={handleRestart} style={{ padding: '10px 32px' }}>
          <i className="ti ti-refresh" aria-hidden="true" /> 再玩一次
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* 進度 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 6 }}>
        <span>已放入 {totalPlaced} / {items.length}</span>
        <span>分錯 {mistakes} 次</span>
      </div>
      <div style={styles.progressBg}>
        <div style={{ ...styles.progressFill, width: `${(totalPlaced / items.length) * 100}%` }} />
      </div>

      {/* 詞語池 */}
      <div style={styles.pool}>
        {remaining.map(id => {
          const it = pool.find(p => p.id === id)
          const isWrong = wrong.includes(id)
          const isSel   = selected === id
          return (
            <div
              key={id}
              onClick={() => pickItem(id)}
              style={{
                ...styles.chip,
                ...(isSel   ? styles.chipSel   : {}),
                ...(isWrong ? styles.chipWrong : {}),
              }}
            >
              {it.text}
            </div>
          )
        })}
        {remaining.length === 0 && (
          <p style={{ color: 'var(--c-text-hint)', fontSize: 13 }}>所有詞語已放入分類</p>
        )}
      </div>

      <p style={{ fontSize: 13, color: 'var(--c-text-hint)', textAlign: 'center', margin: '8px 0 12px' }}>
        {selected !== null
          ? `「${pool.find(p => p.id === selected)?.text}」→ 點下方分類放入`
          : '點選詞語，再點分類桶放入'}
      </p>

      {/* 分類桶 */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(categories.length, 3)}, 1fr)`, gap: 10 }}>
        {categories.map(cat => (
          <div
            key={cat}
            onClick={() => dropIntoBucket(cat)}
            style={{
              ...styles.bucket,
              ...(selected !== null ? styles.bucketActive : {}),
            }}
          >
            <p style={styles.bucketLabel}>{cat}</p>
            <div style={styles.bucketItems}>
              {buckets[cat].map(id => {
                const it = pool.find(p => p.id === id)
                return (
                  <span key={id} style={styles.placed}>{it?.text}</span>
                )
              })}
            </div>
            <p style={styles.bucketCount}>{buckets[cat].length} 個</p>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  progressBg: {
    height: 6,
    background: 'var(--c-border)',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    background: 'var(--c-primary)',
    borderRadius: 999,
    transition: 'width 0.3s ease',
  },
  pool: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 52,
    padding: '10px',
    background: 'var(--c-bg)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 4,
    border: '1px solid var(--c-border)',
  },
  chip: {
    padding: '7px 14px',
    border: '1.5px solid var(--c-border)',
    borderRadius: 999,
    background: 'var(--c-surface)',
    fontSize: 14,
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'all 0.12s',
  },
  chipSel: {
    borderColor: 'var(--c-primary)',
    background: 'var(--c-primary-bg)',
    color: '#0C447C',
    fontWeight: 500,
  },
  chipWrong: {
    borderColor: 'var(--c-danger)',
    background: 'var(--c-danger-bg)',
    color: '#791F1F',
  },
  bucket: {
    border: '1.5px dashed var(--c-border)',
    borderRadius: 'var(--radius-md)',
    padding: '10px',
    minHeight: 100,
    cursor: 'default',
    transition: 'border-color 0.12s, background 0.12s',
    background: 'var(--c-surface)',
  },
  bucketActive: {
    borderColor: 'var(--c-primary)',
    background: 'var(--c-primary-bg)',
    cursor: 'pointer',
  },
  bucketLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--c-text-muted)',
    marginBottom: 8,
    textAlign: 'center',
  },
  bucketItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
    minHeight: 36,
  },
  placed: {
    padding: '4px 10px',
    background: 'var(--c-success-bg)',
    color: '#27500A',
    borderRadius: 999,
    fontSize: 13,
    border: '1px solid var(--c-success)',
  },
  bucketCount: {
    fontSize: 11,
    color: 'var(--c-text-hint)',
    textAlign: 'right',
    marginTop: 6,
  },
}
