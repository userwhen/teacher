import useStore from '../../store/useStore.js'
import { emptyItem } from '../../utils/schema.js'

export default function QuizEditor() {
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

  function addItem() {
    addDraftItem(emptyItem('quiz'))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <p className="label" style={{ margin: 0 }}>題目（{items.length}）</p>
        <p style={{ fontSize: 12, color: 'var(--c-text-hint)' }}>
          <i className="ti ti-info-circle" style={{ fontSize: 13, verticalAlign: -1 }} aria-hidden="true" />
          {' '}點字母圓圈設為正確答案
        </p>
      </div>

      {items.map((item, idx) => (
        <div key={idx} className="card" style={styles.qBlock}>
          <div style={styles.qHeader}>
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
                title="設為正確答案"
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
        onClick={addItem}
        style={{ width: '100%', padding: '10px' }}
      >
        <i className="ti ti-plus" aria-hidden="true" /> 新增題目
      </button>
    </div>
  )
}

const styles = {
  qBlock: {
    background: 'var(--c-bg)',
    padding: '1rem',
  },
  qHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qNum: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--c-text-muted)',
    textTransform: 'uppercase',
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
