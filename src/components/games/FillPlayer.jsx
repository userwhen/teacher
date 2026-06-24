import { useState, useRef } from 'react'

export default function FillPlayer({ activity }) {
  const items = activity.items || []
  const [current, setCurrent]   = useState(0)
  const [input, setInput]       = useState('')
  const [status, setStatus]     = useState(null) // null | 'correct' | 'wrong'
  const [score, setScore]       = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [finished, setFinished] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef(null)

  const item = items[current]
  const parts = item.sentence.split('___')

  function handleCheck() {
    if (!input.trim()) return
    const correct = input.trim().toLowerCase() === item.answer.trim().toLowerCase()
    setStatus(correct ? 'correct' : 'wrong')
    if (correct) setScore(s => s + 1)
    else setMistakes(m => m + 1)
  }

  function handleNext() {
    if (current + 1 >= items.length) {
      setFinished(true)
    } else {
      setCurrent(c => c + 1)
      setInput('')
      setStatus(null)
      setShowHint(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function handleRestart() {
    setCurrent(0)
    setInput('')
    setStatus(null)
    setScore(0)
    setMistakes(0)
    setFinished(false)
    setShowHint(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      if (status === null) handleCheck()
      else handleNext()
    }
  }

  if (finished) {
    const pct = Math.round((score / items.length) * 100)
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>
          {pct === 100 ? '🎉' : pct >= 60 ? '👍' : '💪'}
        </div>
        <p style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>
          答對 {score} / {items.length} 題
        </p>
        <p style={{ color: 'var(--c-text-muted)', marginBottom: '1.5rem' }}>正確率 {pct}%</p>
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
        <span>題目 {current + 1} / {items.length}</span>
        <span>✓ {score} 題</span>
      </div>
      <div style={styles.progressBg}>
        <div style={{ ...styles.progressFill, width: `${(current / items.length) * 100}%` }} />
      </div>

      {/* 句子 + 填空 */}
      <div className="card" style={{ fontSize: 18, lineHeight: 2, marginBottom: '0.75rem' }}>
        {parts[0]}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => { if (status === null) setInput(e.target.value) }}
          onKeyDown={handleKeyDown}
          placeholder="填入答案"
          autoFocus
          style={{
            ...styles.inlineInput,
            borderColor: status === 'correct'
              ? 'var(--c-success)'
              : status === 'wrong'
                ? 'var(--c-danger)'
                : 'var(--c-primary)',
            background: status === 'correct'
              ? 'var(--c-success-bg)'
              : status === 'wrong'
                ? 'var(--c-danger-bg)'
                : 'var(--c-primary-bg)',
            color: status === 'correct'
              ? '#27500A'
              : status === 'wrong'
                ? '#791F1F'
                : 'var(--c-text)',
          }}
        />
        {parts[1]}
      </div>

      {/* 提示 */}
      {item.hint && (
        <div style={{ marginBottom: 8 }}>
          {showHint
            ? <div style={styles.hint}><i className="ti ti-bulb" aria-hidden="true" /> {item.hint}</div>
            : <button onClick={() => setShowHint(true)} style={{ fontSize: 13, padding: '4px 10px' }}>
                <i className="ti ti-bulb" aria-hidden="true" /> 顯示提示
              </button>
          }
        </div>
      )}

      {/* 回饋 */}
      {status && (
        <div style={{
          ...styles.feedback,
          background: status === 'correct' ? 'var(--c-success-bg)' : 'var(--c-danger-bg)',
          color: status === 'correct' ? '#27500A' : '#791F1F',
        }}>
          <i className={`ti ti-${status === 'correct' ? 'circle-check' : 'circle-x'}`} aria-hidden="true" />
          {' '}{status === 'correct' ? '答對了！' : `答案是「${item.answer}」`}
        </div>
      )}

      {/* 按鈕 */}
      <div style={{ marginTop: '1rem' }}>
        {!status ? (
          <button
            className="btn-primary"
            onClick={handleCheck}
            disabled={!input.trim()}
            style={{ width: '100%', padding: 12 }}
          >
            確認答案
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={handleNext}
            style={{ width: '100%', padding: 12 }}
          >
            {current + 1 >= items.length ? '查看結果' : '下一題'}
            {' '}<i className="ti ti-arrow-right" aria-hidden="true" />
          </button>
        )}
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
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    background: 'var(--c-primary)',
    borderRadius: 999,
    transition: 'width 0.3s ease',
  },
  inlineInput: {
    display: 'inline-block',
    width: 140,
    padding: '4px 10px',
    border: '2px solid',
    borderRadius: 'var(--radius-sm)',
    fontSize: 17,
    fontWeight: 500,
    margin: '0 6px',
    textAlign: 'center',
    outline: 'none',
    transition: 'all 0.15s',
  },
  hint: {
    padding: '7px 12px',
    background: 'var(--c-warning-bg)',
    color: 'var(--c-warning)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  feedback: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: 14,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
}
