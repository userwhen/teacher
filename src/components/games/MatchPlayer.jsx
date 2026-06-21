import { useState, useMemo } from 'react'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function MatchPlayer({ activity }) {
  const items = activity.items || []

  // 左側順序固定，右側打亂
  const leftItems  = useMemo(() => items.map((it, i) => ({ ...it, idx: i })), [])
  const rightItems = useMemo(() => shuffle(items.map((it, i) => ({ ...it, idx: i }))), [])

  const [selLeft, setSelLeft]   = useState(null)  // 選中的左側 idx
  const [selRight, setSelRight] = useState(null)  // 選中的右側 idx
  const [correct, setCorrect]   = useState([])    // 已配對正確的 idx[]
  const [wrong, setWrong]       = useState([])    // 本次錯誤閃爍 idx[]
  const [finished, setFinished] = useState(false)
  const [mistakes, setMistakes] = useState(0)

  function pickLeft(idx) {
    if (correct.includes(idx)) return
    setSelLeft(idx === selLeft ? null : idx)
    setSelRight(null)
    setWrong([])
  }

  function pickRight(idx) {
    if (correct.includes(idx)) return
    if (selLeft === null) return

    if (idx === selLeft) {
      // 答對
      const next = [...correct, idx]
      setCorrect(next)
      setSelLeft(null)
      setSelRight(null)
      setWrong([])
      if (next.length === items.length) {
        setTimeout(() => setFinished(true), 400)
      }
    } else {
      // 答錯：閃爍後清除
      setMistakes(m => m + 1)
      setWrong([selLeft, idx])
      setTimeout(() => {
        setWrong([])
        setSelLeft(null)
        setSelRight(null)
      }, 700)
    }
  }

  function handleRestart() {
    setSelLeft(null)
    setSelRight(null)
    setCorrect([])
    setWrong([])
    setFinished(false)
    setMistakes(0)
  }

  if (finished) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>
          {mistakes === 0 ? '🎉' : mistakes <= 2 ? '👍' : '💪'}
        </div>
        <p style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>
          {mistakes === 0 ? '完美！一次全對！' : `全部配對完成！`}
        </p>
        <p style={{ color: 'var(--c-text-muted)', marginBottom: '1.5rem' }}>
          {mistakes === 0 ? '零失誤，表現超棒' : `配錯 ${mistakes} 次`}
        </p>
        <button className="btn-primary" onClick={handleRestart} style={{ padding: '10px 32px' }}>
          <i className="ti ti-refresh" aria-hidden="true" /> 再玩一次
        </button>
      </div>
    )
  }

  function leftStyle(idx) {
    const isCorrect = correct.includes(idx)
    const isWrong   = wrong.includes(idx)
    const isSel     = selLeft === idx
    if (isCorrect) return { ...styles.chip, ...styles.chipCorrect }
    if (isWrong)   return { ...styles.chip, ...styles.chipWrong }
    if (isSel)     return { ...styles.chip, ...styles.chipSel }
    return styles.chip
  }

  function rightStyle(idx) {
    const isCorrect = correct.includes(idx)
    const isWrong   = wrong.includes(idx)
    const isSel     = selRight === idx
    if (isCorrect) return { ...styles.chip, ...styles.chipCorrect }
    if (isWrong)   return { ...styles.chip, ...styles.chipWrong }
    if (isSel)     return { ...styles.chip, ...styles.chipSel }
    return { ...styles.chip, cursor: selLeft !== null && !correct.includes(idx) ? 'pointer' : 'default' }
  }

  return (
    <div>
      {/* 進度 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 8 }}>
        <span>已配對 {correct.length} / {items.length}</span>
        <span>配錯 {mistakes} 次</span>
      </div>
      <div style={styles.progressBg}>
        <div style={{ ...styles.progressFill, width: `${(correct.length / items.length) * 100}%` }} />
      </div>

      <p style={{ fontSize: 13, color: 'var(--c-text-hint)', margin: '12px 0 10px', textAlign: 'center' }}>
        先點左側，再點右側配對
      </p>

      {/* 配對區 */}
      <div style={styles.grid}>
        {/* 左欄 */}
        <div style={styles.col}>
          {leftItems.map(item => (
            <div
              key={item.idx}
              style={leftStyle(item.idx)}
              onClick={() => pickLeft(item.idx)}
            >
              {correct.includes(item.idx) && (
                <i className="ti ti-check" style={{ color: 'var(--c-success)', marginRight: 4, fontSize: 13 }} aria-hidden="true" />
              )}
              {item.left}
            </div>
          ))}
        </div>

        {/* 右欄 */}
        <div style={styles.col}>
          {rightItems.map(item => (
            <div
              key={item.idx}
              style={rightStyle(item.idx)}
              onClick={() => pickRight(item.idx)}
            >
              {correct.includes(item.idx) && (
                <i className="ti ti-check" style={{ color: 'var(--c-success)', marginRight: 4, fontSize: 13 }} aria-hidden="true" />
              )}
              {item.right}
            </div>
          ))}
        </div>
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
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    background: 'var(--c-success)',
    borderRadius: 999,
    transition: 'width 0.3s ease',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  chip: {
    padding: '10px 12px',
    border: '1.5px solid var(--c-border)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--c-surface)',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.12s',
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    userSelect: 'none',
    lineHeight: 1.4,
  },
  chipSel: {
    borderColor: 'var(--c-primary)',
    background: 'var(--c-primary-bg)',
    color: '#0C447C',
  },
  chipCorrect: {
    borderColor: 'var(--c-success)',
    background: 'var(--c-success-bg)',
    color: '#27500A',
    cursor: 'default',
  },
  chipWrong: {
    borderColor: 'var(--c-danger)',
    background: 'var(--c-danger-bg)',
    color: '#791F1F',
    cursor: 'default',
  },
}
