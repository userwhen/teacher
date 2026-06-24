import { useState, useMemo, useRef } from 'react'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function TimelinePlayer({ activity }) {
  const items = activity.items || []
  // 正確順序：依 order 排
  const correct = useMemo(() =>
    [...items].sort((a, b) => a.order - b.order).map(it => it.text)
  , [])

  const [order, setOrder]       = useState(() => shuffle(correct))
  const [checked, setChecked]   = useState(false)
  const [finished, setFinished] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const dragIdx = useRef(null)

  // ── 拖曳處理 ──────────────────────────────────────────────
  function onDragStart(idx) { dragIdx.current = idx }

  function onDragOver(e, idx) {
    e.preventDefault()
    if (dragIdx.current === null || dragIdx.current === idx) return
    const next = [...order]
    const [moved] = next.splice(dragIdx.current, 1)
    next.splice(idx, 0, moved)
    dragIdx.current = idx
    setOrder(next)
    setChecked(false)
  }

  function onDragEnd() { dragIdx.current = null }

  // ── 觸控拖曳 ──────────────────────────────────────────────
  const touchStartY  = useRef(null)
  const touchItemIdx = useRef(null)

  function onTouchStart(e, idx) {
    touchStartY.current  = e.touches[0].clientY
    touchItemIdx.current = idx
  }

  function onTouchMove(e) {
    e.preventDefault()
    if (touchItemIdx.current === null) return
    const el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY)
    const target = el?.closest('[data-idx]')
    if (!target) return
    const toIdx = parseInt(target.dataset.idx)
    if (isNaN(toIdx) || toIdx === touchItemIdx.current) return
    const next = [...order]
    const [moved] = next.splice(touchItemIdx.current, 1)
    next.splice(toIdx, 0, moved)
    touchItemIdx.current = toIdx
    setOrder(next)
    setChecked(false)
  }

  function onTouchEnd() { touchItemIdx.current = null }

  // ── 檢查答案 ──────────────────────────────────────────────
  function handleCheck() {
    const isCorrect = order.every((text, i) => text === correct[i])
    setChecked(true)
    if (isCorrect) {
      setTimeout(() => setFinished(true), 600)
    } else {
      setMistakes(m => m + 1)
    }
  }

  function handleRestart() {
    setOrder(shuffle(correct))
    setChecked(false)
    setFinished(false)
    setMistakes(0)
  }

  if (finished) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>
          {mistakes === 0 ? '🎉' : mistakes <= 2 ? '👍' : '💪'}
        </div>
        <p style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>排序正確！</p>
        <p style={{ color: 'var(--c-text-muted)', marginBottom: '1.5rem' }}>
          {mistakes === 0 ? '一次就排對了！' : `試了 ${mistakes + 1} 次`}
        </p>
        {/* 顯示正確順序 */}
        <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          {correct.map((text, i) => (
            <div key={i} style={styles.finalRow}>
              <span style={styles.finalNum}>{i + 1}</span>
              <span style={{ fontSize: 14 }}>{text}</span>
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={handleRestart} style={{ padding: '10px 32px' }}>
          <i className="ti ti-refresh" aria-hidden="true" /> 再玩一次
        </button>
      </div>
    )
  }

  // 檢查每一項是否正確
  function isItemCorrect(text, i) {
    return checked && text === correct[i]
  }
  function isItemWrong(text, i) {
    return checked && text !== correct[i]
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 8 }}>
        <span>拖曳排出正確順序</span>
        <span>嘗試 {mistakes} 次</span>
      </div>

      {checked && order.every((t, i) => t === correct[i]) === false && (
        <div style={styles.wrongHint}>
          <i className="ti ti-alert-triangle" aria-hidden="true" /> 順序還不對，再調整看看！
        </div>
      )}

      <div style={{ userSelect: 'none' }}>
        {order.map((text, i) => (
          <div
            key={text}
            data-idx={i}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={e => onDragOver(e, i)}
            onDragEnd={onDragEnd}
            onTouchStart={e => onTouchStart(e, i)}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              ...styles.item,
              ...(isItemCorrect(text, i) ? styles.itemCorrect : {}),
              ...(isItemWrong(text, i)   ? styles.itemWrong   : {}),
            }}
          >
            <span style={styles.handle}>
              <i className="ti ti-grip-vertical" aria-hidden="true" />
            </span>
            <span style={styles.num}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: 15 }}>{text}</span>
            {isItemCorrect(text, i) && (
              <i className="ti ti-check" style={{ color: 'var(--c-success)', fontSize: 16 }} aria-hidden="true" />
            )}
            {isItemWrong(text, i) && (
              <i className="ti ti-x" style={{ color: 'var(--c-danger)', fontSize: 16 }} aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      <button
        className="btn-primary"
        onClick={handleCheck}
        style={{ width: '100%', padding: 12, marginTop: '1rem' }}
      >
        確認順序
      </button>
    </div>
  )
}

const styles = {
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    border: '1.5px solid var(--c-border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--c-surface)',
    marginBottom: 8,
    cursor: 'grab',
    transition: 'border-color 0.12s, background 0.12s',
  },
  itemCorrect: {
    borderColor: 'var(--c-success)',
    background: 'var(--c-success-bg)',
  },
  itemWrong: {
    borderColor: 'var(--c-danger)',
    background: 'var(--c-danger-bg)',
  },
  handle: {
    color: 'var(--c-text-hint)',
    fontSize: 16,
    flexShrink: 0,
  },
  num: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'var(--c-bg)',
    border: '1px solid var(--c-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--c-text-muted)',
    flexShrink: 0,
  },
  wrongHint: {
    padding: '8px 12px',
    background: 'var(--c-danger-bg)',
    color: '#791F1F',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  finalRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 0',
    borderBottom: '1px solid var(--c-border)',
  },
  finalNum: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: 'var(--c-primary-bg)',
    color: 'var(--c-primary)',
    fontSize: 12,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
}
