import { useState } from 'react'

export default function QuizPlayer({ activity }) {
  const items = activity.items || []
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)   // 選了哪個選項
  const [confirmed, setConfirmed] = useState(false) // 是否已確認答案
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [wrongCount, setWrongCount] = useState(0)

  const item = items[current]
  const isCorrect = confirmed && selected === item.answerIndex
  const isWrong = confirmed && selected !== item.answerIndex

  function handleSelect(optIdx) {
    if (confirmed) return
    setSelected(optIdx)
  }

  function handleConfirm() {
    if (selected === null) return
    setConfirmed(true)
    if (selected === item.answerIndex) {
      setScore(s => s + 1)
    } else {
      setWrongCount(w => w + 1)
    }
  }

  function handleNext() {
    if (current + 1 >= items.length) {
      setFinished(true)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setConfirmed(false)
    }
  }

  function handleRestart() {
    setCurrent(0)
    setSelected(null)
    setConfirmed(false)
    setScore(0)
    setWrongCount(0)
    setFinished(false)
  }

  // 完成畫面
  if (finished) {
    const pct = Math.round((score / items.length) * 100)
    const perfect = score === items.length
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>
          {perfect ? '🎉' : score >= items.length * 0.6 ? '👍' : '💪'}
        </div>
        <p style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>
          {perfect ? '全對！太棒了！' : `答對 ${score} / ${items.length} 題`}
        </p>
        <p style={{ color: 'var(--c-text-muted)', marginBottom: '1.5rem' }}>
          正確率 {pct}%
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, ...styles.statCard, background: 'var(--c-success-bg)' }}>
            <span style={{ fontSize: 24, fontWeight: 500, color: 'var(--c-success)' }}>{score}</span>
            <span style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>答對</span>
          </div>
          <div style={{ flex: 1, ...styles.statCard, background: 'var(--c-danger-bg)' }}>
            <span style={{ fontSize: 24, fontWeight: 500, color: 'var(--c-danger)' }}>{wrongCount}</span>
            <span style={{ fontSize: 12, color: 'var(--c-text-muted)', marginTop: 2 }}>答錯</span>
          </div>
        </div>
        <button className="btn-primary" onClick={handleRestart} style={{ width: '100%', marginTop: '1.25rem', padding: 12 }}>
          <i className="ti ti-refresh" aria-hidden="true" /> 再玩一次
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* 進度條 */}
      <div style={styles.progressWrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 6 }}>
          <span>題目 {current + 1} / {items.length}</span>
          <span>✓ {score} 題</span>
        </div>
        <div style={styles.progressBg}>
          <div style={{ ...styles.progressFill, width: `${((current) / items.length) * 100}%` }} />
        </div>
      </div>

      {/* 題目卡 */}
      <div className="card" style={{ marginBottom: '0.75rem' }}>
        <p style={styles.question}>{item.question}</p>
      </div>

      {/* 選項 */}
      {item.options.map((opt, optIdx) => {
        let bg = 'var(--c-surface)'
        let border = 'var(--c-border)'
        let color = 'var(--c-text)'

        if (confirmed) {
          if (optIdx === item.answerIndex) {
            bg = 'var(--c-success-bg)'
            border = 'var(--c-success)'
            color = '#27500A'
          } else if (optIdx === selected && selected !== item.answerIndex) {
            bg = 'var(--c-danger-bg)'
            border = 'var(--c-danger)'
            color = '#791F1F'
          }
        } else if (selected === optIdx) {
          bg = 'var(--c-primary-bg)'
          border = 'var(--c-primary)'
          color = '#0C447C'
        }

        return (
          <div
            key={optIdx}
            onClick={() => handleSelect(optIdx)}
            style={{
              ...styles.option,
              background: bg,
              borderColor: border,
              color,
              cursor: confirmed ? 'default' : 'pointer',
            }}
          >
            <span style={{ ...styles.optLetter, borderColor: border, color }}>
              {['A','B','C','D'][optIdx]}
            </span>
            <span>{opt}</span>
            {confirmed && optIdx === item.answerIndex && (
              <i className="ti ti-check" style={{ marginLeft: 'auto', color: 'var(--c-success)' }} aria-hidden="true" />
            )}
            {confirmed && optIdx === selected && selected !== item.answerIndex && (
              <i className="ti ti-x" style={{ marginLeft: 'auto', color: 'var(--c-danger)' }} aria-hidden="true" />
            )}
          </div>
        )
      })}

      {/* 回饋訊息 */}
      {confirmed && (
        <div style={{
          ...styles.feedback,
          background: isCorrect ? 'var(--c-success-bg)' : 'var(--c-danger-bg)',
          color: isCorrect ? '#27500A' : '#791F1F',
        }}>
          <i className={`ti ti-${isCorrect ? 'circle-check' : 'circle-x'}`} aria-hidden="true" />
          {' '}{isCorrect ? '答對了！' : `答錯了，正確答案是「${item.options[item.answerIndex]}」`}
        </div>
      )}

      {/* 按鈕 */}
      <div style={{ marginTop: '1rem' }}>
        {!confirmed ? (
          <button
            className="btn-primary"
            onClick={handleConfirm}
            disabled={selected === null}
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
            {current + 1 >= items.length ? '查看結果' : '下一題'}{' '}
            <i className="ti ti-arrow-right" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

const styles = {
  progressWrap: { marginBottom: '1rem' },
  progressBg: {
    height: 6,
    background: 'var(--c-border)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--c-primary)',
    borderRadius: 999,
    transition: 'width 0.3s ease',
  },
  question: {
    fontSize: 17,
    fontWeight: 500,
    lineHeight: 1.5,
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    border: '1.5px solid',
    borderRadius: 'var(--radius-md)',
    marginBottom: 8,
    transition: 'all 0.12s',
    fontSize: 15,
    userSelect: 'none',
  },
  optLetter: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    border: '1.5px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  feedback: {
    padding: '10px 14px',
    borderRadius: 'var(--radius-md)',
    fontSize: 14,
    fontWeight: 500,
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1rem',
    borderRadius: 'var(--radius-md)',
  },
}
