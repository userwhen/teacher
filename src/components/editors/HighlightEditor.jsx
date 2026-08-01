import useStore from '../../store/useStore.js'
import { emptyItem } from '../../utils/schema.js'

export default function HighlightEditor() {
  const { draft, updateDraftItem, addDraftItem, removeDraftItem, updateDraftMeta } = useStore()
  const items = draft?.items || []
  const difficulty = draft?.meta?.difficulty || 'easy'

  function updateAnswer(idx, ansIdx, val) {
    const answers = [...(items[idx].answers || [''])]
    answers[ansIdx] = val
    updateDraftItem(idx, { answers })
  }

  function addAnswer(idx) { updateDraftItem(idx, { answers: [...(items[idx].answers || ['']), ''] }) }
  function removeAnswer(idx, ansIdx) {
    const answers = items[idx].answers.filter((_, i) => i !== ansIdx)
    updateDraftItem(idx, { answers: answers.length ? answers : [''] })
  }

  return (
    <div>
      {/* 難度選擇 */}
      <div className="card" style={{ background: 'var(--c-bg)', padding: '0.875rem', marginBottom: '0.75rem' }}>
        <p className="label" style={{ marginBottom: 8 }}>難度</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { key: 'easy', label: '簡單', desc: '點錯會有提示反應' },
            { key: 'hard', label: '困難', desc: '點錯不會有提示，靠自己判斷' },
          ].map(({ key, label, desc }) => (
            <div key={key} onClick={() => updateDraftMeta('difficulty', key)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', padding: '10px 14px',
              border: `1.5px solid ${difficulty === key ? 'var(--c-primary)' : 'var(--c-border)'}`,
              borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.12s',
              background: difficulty === key ? 'var(--c-primary-bg)' : 'var(--c-surface)',
            }}>
              <span style={{ fontWeight: 500, fontSize: 13, color: difficulty === key ? '#0C447C' : 'var(--c-text)' }}>{label}</span>
              <span style={{ fontSize: 11, color: 'var(--c-text-hint)', marginTop: 2 }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <p className="label" style={{ margin: 0 }}>題組（{items.length}）</p>
        <p style={{ fontSize: 12, color: 'var(--c-text-hint)' }}>學生在文字中點出指定詞語</p>
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="card" style={{ background: 'var(--c-bg)', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text-muted)' }}>題組 {idx + 1}</span>
            {items.length > 1 && (
              <button onClick={() => removeDraftItem(idx)} style={{ padding: '2px 8px', fontSize: 12, color: 'var(--c-danger)', borderColor: 'var(--c-danger)' }}>
                <i className="ti ti-trash" aria-hidden="true" /> 刪除
              </button>
            )}
          </div>
          <label className="label">文章段落</label>
          <textarea placeholder="輸入一段文字，學生要從中找出下方指定的詞語…" value={item.passage}
            onChange={e => updateDraftItem(idx, { passage: e.target.value })} rows={4} style={{ marginBottom: 12 }} />
          <label className="label">要找出的詞語</label>
          {(item.answers || ['']).map((ans, ansIdx) => (
            <div key={ansIdx} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input type="text" placeholder={`詞語 ${ansIdx + 1}`} value={ans}
                onChange={e => updateAnswer(idx, ansIdx, e.target.value)} style={{ flex: 1 }} />
              {(item.answers?.length || 1) > 1 && (
                <button onClick={() => removeAnswer(idx, ansIdx)}
                  style={{ width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-danger)', borderColor: 'var(--c-danger)', fontSize: 14 }}>
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          <button className="btn-ghost" onClick={() => addAnswer(idx)} style={{ fontSize: 13, padding: '5px 12px', marginTop: 4 }}>
            <i className="ti ti-plus" aria-hidden="true" /> 新增詞語
          </button>
        </div>
      ))}
      <button className="btn-ghost" onClick={() => addDraftItem(emptyItem('highlight'))} style={{ width: '100%', padding: '10px' }}>
        <i className="ti ti-plus" aria-hidden="true" /> 新增題組
      </button>
    </div>
  )
}
