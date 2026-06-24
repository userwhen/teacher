import { useState, useMemo } from 'react'

export default function HighlightPlayer({ activity }) {
  const items = activity.items || []
  const [current, setCurrent]     = useState(0)
  const [found, setFound]         = useState([])    // 已找到的詞語
  const [wrongFlash, setWrongFlash] = useState(false)
  const [finished, setFinished]   = useState(false)
  const [mistakes, setMistakes]   = useState(0)
  const [pagesDone, setPagesDone] = useState(0)

  const item    = items[current]
  const answers = useMemo(() => item.answers.filter(Boolean), [current])

  // 把段落切成可點擊的 token（詞語邊界）
  const tokens = useMemo(() => tokenize(item.passage, answers), [current])

  function handleClick(word) {
    if (found.includes(word)) return
    if (answers.includes(word)) {
      const next = [...found, word]
      setFound(next)
      if (next.length === answers.length) {
        // 這題完成
        setTimeout(() => {
          const nextPage = current + 1
          setPagesDone(p => p + 1)
          if (nextPage >= items.length) {
            setFinished(true)
          } else {
            setCurrent(nextPage)
            setFound([])
          }
        }, 600)
      }
    } else {
      // 點到不是答案的詞
      setMistakes(m => m + 1)
      setWrongFlash(true)
      setTimeout(() => setWrongFlash(false), 500)
    }
  }

  function handleRestart() {
    setCurrent(0)
    setFound([])
    setWrongFlash(false)
    setFinished(false)
    setMistakes(0)
    setPagesDone(0)
  }

  if (finished) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>
          {mistakes === 0 ? '🎉' : mistakes <= 3 ? '👍' : '💪'}
        </div>
        <p style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>全部找到了！</p>
        <p style={{ color: 'var(--c-text-muted)', marginBottom: '1.5rem' }}>
          {mistakes === 0 ? '零失誤，閱讀力超強！' : `點錯 ${mistakes} 次`}
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
        <span>段落 {current + 1} / {items.length}</span>
        <span>點錯 {mistakes} 次</span>
      </div>
      <div style={styles.progressBg}>
        <div style={{ ...styles.progressFill, width: `${(pagesDone / items.length) * 100}%` }} />
      </div>

      {/* 目標詞語 */}
      <div style={styles.targetBox}>
        <span style={{ fontSize: 12, color: 'var(--c-text-hint)', marginRight: 8 }}>找出：</span>
        {answers.map(ans => (
          <span key={ans} style={{
            ...styles.targetChip,
            ...(found.includes(ans) ? styles.targetFound : {}),
          }}>
            {found.includes(ans) && <i className="ti ti-check" style={{ fontSize: 11, marginRight: 3 }} aria-hidden="true" />}
            {ans}
          </span>
        ))}
      </div>

      {/* 段落文字 */}
      <div
        className="card"
        style={{
          fontSize: 17,
          lineHeight: 2.2,
          letterSpacing: 0.3,
          outline: wrongFlash ? '2px solid var(--c-danger)' : 'none',
          transition: 'outline 0.1s',
        }}
      >
        {tokens.map((tok, i) => {
          const isAnswer = answers.includes(tok.text)
          const isFound  = found.includes(tok.text)
          return (
            <span
              key={i}
              onClick={() => tok.clickable && handleClick(tok.text)}
              style={{
                cursor: tok.clickable ? 'pointer' : 'default',
                borderRadius: 4,
                padding: '1px 1px',
                transition: 'background 0.12s',
                background: isFound
                  ? '#FFE066'
                  : undefined,
                fontWeight: isFound ? 600 : undefined,
                userSelect: 'none',
              }}
            >
              {tok.text}
            </span>
          )
        })}
      </div>

      <p style={{ fontSize: 12, color: 'var(--c-text-hint)', marginTop: 8, textAlign: 'center' }}>
        點擊段落中的詞語來選取
      </p>
    </div>
  )
}

// 把段落切成 token，讓每個中文詞可以被獨立點擊
// 策略：先標記答案詞語的位置，其餘逐字切
function tokenize(passage, answers) {
  if (!answers.length) return [{ text: passage, clickable: false }]

  const sorted = [...answers].sort((a, b) => b.length - a.length)
  const regex  = new RegExp(`(${sorted.map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')
  const parts  = passage.split(regex)

  const tokens = []
  parts.forEach(part => {
    if (answers.includes(part)) {
      tokens.push({ text: part, clickable: true })
    } else {
      // 非答案部分：逐字元 token，讓使用者誤點有回饋
      ;[...part].forEach(ch => tokens.push({ text: ch, clickable: /[\u4e00-\u9fff\w]/.test(ch) }))
    }
  })
  return tokens
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
  targetBox: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    padding: '10px 12px',
    background: 'var(--c-bg)',
    borderRadius: 'var(--radius-md)',
    marginBottom: 10,
    border: '1px solid var(--c-border)',
  },
  targetChip: {
    padding: '4px 12px',
    borderRadius: 999,
    fontSize: 14,
    border: '1.5px solid var(--c-border)',
    background: 'var(--c-surface)',
    color: 'var(--c-text)',
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  targetFound: {
    borderColor: 'var(--c-success)',
    background: 'var(--c-success-bg)',
    color: '#27500A',
  },
}
