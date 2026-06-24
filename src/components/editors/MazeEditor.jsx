import useStore from '../../store/useStore.js'
import { emptyItem } from '../../utils/schema.js'

export default function MazeEditor() {
  const { draft, updateDraftItem, addDraftItem, removeDraftItem } = useStore()
  const items = draft?.items || []

  function handleField(idx, field, value) {
    updateDraftItem(idx, { [field]: value })
  }

  function handleOption(idx, optIdx, value) {
    const options = [...items[idx].options]
    options[optIdx] = value
    updateDraftItem(idx, { options })
  }

  function handleAnswer(idx, optIdx) {
    updateDraftItem(idx, { answerIndex: optIdx })
  }

  return (
    <div>
      <div style={styles.tip}>
        <i className="ti ti-info-circle" style={{ fontSize: 14, verticalAlign: -2 }} aria-hidden="true" />
        {' '}答對題目角色往前走，答錯被追兵追上。建議 5–10 題。
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <p className="label" style={{ margin: 0 }}>題目（{items.length}）</p>
        <p style={{ fontSize: 12, color: 'var(--c-text-hint)' }}>點字母設為正確答案</p>
      </div>

      {items.map((item, idx) => (
        <div key={idx} className="card" style={{ background: 'var(--c-bg)', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={styles.qNum}>題目 {idx + 1}</span>
            {items.length > 1 && (
              <button
                onClick={() => removeDraftItem(idx)}
                style={{ padding: '2px 8px', fontSize: 12, color: 'var(--c-danger)', borderColor: 'var(--c-danger)' }}
              >
                <i className="ti ti-trash" aria-hidden="true" /> 刪除
              </button>
            )}
          </div>

          <input
            type="text"
            placeholder="輸入問題…"
            value={item.question}
            onChange={e => handleField(idx, 'question', e.target.value)}
            style={{ marginBottom: 10 }}
          />

          {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
            <div key={optIdx} style={styles.optRow}>
              <button
                onClick={() => handleAnswer(idx, optIdx)}
                style={{
                  ...styles.optDot,
                  background: item.answerIndex === optIdx ? 'var(--c-success)' : 'var(--c-surface)',
                  color: item.answerIndex === optIdx ? '#fff' : 'var(--c-text-muted)',
                  borderColor: item.answerIndex === optIdx ? 'var(--c-success)' : 'var(--c-border-strong)',
                }}
              >
                {letter}
              </button>
              <input
                type="text"
                placeholder={`選項 ${letter}`}
                value={item.options[optIdx]}
                onChange={e => handleOption(idx, optIdx, e.target.value)}
              />
            </div>
          ))}
        </div>
      ))}

      <button
        className="btn-ghost"
        onClick={() => addDraftItem(emptyItem('maze'))}
        style={{ width: '100%', padding: '10px' }}
      >
        <i className="ti ti-plus" aria-hidden="true" /> 新增題目
      </button>
    </div>
  )
}

const styles = {
  tip: {
    marginBottom: 12,
    fontSize: 12,
    color: 'var(--c-text-hint)',
    padding: '8px 12px',
    background: 'var(--c-bg)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--c-border)',
  },
  qNum: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--c-text-muted)',
    letterSpacing: 0.5,
  },
  optRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 7,
  },
  optDot: {
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
    cursor: 'pointer',
    padding: 0,
  },
}
