import useStore from '../../store/useStore.js'
import { emptyItem } from '../../utils/schema.js'

export default function HighlightEditor() {
  const { draft, updateDraftItem, addDraftItem, removeDraftItem } = useStore()
  const items = draft?.items || []

  function updateAnswer(idx, ansIdx, val) {
    const answers = [...(items[idx].answers || [''])]
    answers[ansIdx] = val
    updateDraftItem(idx, { answers })
  }

  function addAnswer(idx) {
    const answers = [...(items[idx].answers || ['']), '']
    updateDraftItem(idx, { answers })
  }

  function removeAnswer(idx, ansIdx) {
    const answers = items[idx].answers.filter((_, i) => i !== ansIdx)
    updateDraftItem(idx, { answers: answers.length ? answers : [''] })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <p className="label" style={{ margin: 0 }}>題組（{items.length}）</p>
        <p style={{ fontSize: 12, color: 'var(--c-text-hint)' }}>
          學生在文字中點出指定詞語
        </p>
      </div>

      {items.map((item, idx) => (
        <div key={idx} className="card" style={{ background: 'var(--c-bg)', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={styles.qNum}>題組 {idx + 1}</span>
            {items.length > 1 && (
              <button
                onClick={() => removeDraftItem(idx)}
                style={{ padding: '2px 8px', fontSize: 12, color: 'var(--c-danger)', borderColor: 'var(--c-danger)' }}
              >
                <i className="ti ti-trash" aria-hidden="true" /> 刪除
              </button>
            )}
          </div>

          <label className="label">文章段落</label>
          <textarea
            placeholder="輸入一段文字，學生要從中找出下方指定的詞語…"
            value={item.passage}
            onChange={e => updateDraftItem(idx, { passage: e.target.value })}
            rows={4}
            style={{ marginBottom: 12 }}
          />

          <label className="label">要找出的詞語</label>
          {(item.answers || ['']).map((ans, ansIdx) => (
            <div key={ansIdx} style={styles.ansRow}>
              <input
                type="text"
                placeholder={`詞語 ${ansIdx + 1}`}
                value={ans}
                onChange={e => updateAnswer(idx, ansIdx, e.target.value)}
                style={{ flex: 1 }}
              />
              {(item.answers?.length || 1) > 1 && (
                <button
                  onClick={() => removeAnswer(idx, ansIdx)}
                  style={{ ...styles.iconBtn, color: 'var(--c-danger)', borderColor: 'var(--c-danger)' }}
                >
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          <button
            className="btn-ghost"
            onClick={() => addAnswer(idx)}
            style={{ fontSize: 13, padding: '5px 12px', marginTop: 4 }}
          >
            <i className="ti ti-plus" aria-hidden="true" /> 新增詞語
          </button>

          {/* 預覽：確認詞語在段落裡 */}
          {item.passage && item.answers?.some(a => a) && (
            <div style={styles.preview}>
              <span style={{ fontSize: 11, color: 'var(--c-text-hint)', display: 'block', marginBottom: 4 }}>預覽</span>
              <HighlightPreview passage={item.passage} answers={item.answers.filter(Boolean)} />
            </div>
          )}
        </div>
      ))}

      <button
        className="btn-ghost"
        onClick={() => addDraftItem(emptyItem('highlight'))}
        style={{ width: '100%', padding: '10px' }}
      >
        <i className="ti ti-plus" aria-hidden="true" /> 新增題組
      </button>

      <div style={styles.tip}>
        <i className="ti ti-bulb" style={{ fontSize: 14, verticalAlign: -2 }} aria-hidden="true" />
        {' '}詞語必須完整出現在段落中，注意標點符號
      </div>
    </div>
  )
}

function HighlightPreview({ passage, answers }) {
  // 把段落裡的目標詞語標色
  const regex = new RegExp(`(${answers.map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')
  const parts = passage.split(regex)
  return (
    <p style={{ fontSize: 14, lineHeight: 1.8 }}>
      {parts.map((part, i) =>
        answers.includes(part)
          ? <mark key={i} style={{ background: '#FFE066', borderRadius: 3, padding: '1px 2px' }}>{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </p>
  )
}

const styles = {
  qNum: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--c-text-muted)',
    letterSpacing: 0.5,
  },
  ansRow: {
    display: 'flex',
    gap: 6,
    marginBottom: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: 14,
  },
  preview: {
    marginTop: 12,
    padding: '8px 10px',
    background: 'var(--c-surface)',
    border: '1px solid var(--c-border)',
    borderRadius: 'var(--radius-sm)',
  },
  tip: {
    marginTop: 10,
    fontSize: 12,
    color: 'var(--c-text-hint)',
    padding: '6px 10px',
    background: 'var(--c-bg)',
    borderRadius: 'var(--radius-sm)',
  },
}
