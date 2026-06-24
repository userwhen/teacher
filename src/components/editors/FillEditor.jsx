import useStore from '../../store/useStore.js'
import { emptyItem } from '../../utils/schema.js'

export default function FillEditor() {
  const { draft, updateDraftItem, addDraftItem, removeDraftItem } = useStore()
  const items = draft?.items || []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <p className="label" style={{ margin: 0 }}>題目（{items.length}）</p>
        <p style={{ fontSize: 12, color: 'var(--c-text-hint)' }}>
          用 ___ 代表填空位置
        </p>
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

          <label className="label">句子（用 ___ 標記填空）</label>
          <input
            type="text"
            placeholder="例：植物進行光合作用需要 ___ 和水"
            value={item.sentence}
            onChange={e => updateDraftItem(idx, { sentence: e.target.value })}
            style={{ marginBottom: 10 }}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label className="label">正確答案</label>
              <input
                type="text"
                placeholder="例：陽光"
                value={item.answer}
                onChange={e => updateDraftItem(idx, { answer: e.target.value })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">提示（選填）</label>
              <input
                type="text"
                placeholder="例：太陽提供的能量"
                value={item.hint || ''}
                onChange={e => updateDraftItem(idx, { hint: e.target.value })}
              />
            </div>
          </div>

          {item.sentence && (
            <div style={styles.preview}>
              <span style={{ fontSize: 12, color: 'var(--c-text-hint)' }}>預覽：</span>
              {item.sentence.split('___').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span style={styles.blank}>
                      {item.answer || '___'}
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      <button
        className="btn-ghost"
        onClick={() => addDraftItem(emptyItem('fill'))}
        style={{ width: '100%', padding: '10px' }}
      >
        <i className="ti ti-plus" aria-hidden="true" /> 新增題目
      </button>

      <div style={styles.tip}>
        <i className="ti ti-bulb" style={{ fontSize: 14, verticalAlign: -2 }} aria-hidden="true" />
        {' '}每題只支援一個填空（___），答案比對不區分大小寫
      </div>
    </div>
  )
}

const styles = {
  qNum: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--c-text-muted)',
    letterSpacing: 0.5,
  },
  preview: {
    marginTop: 10,
    padding: '8px 10px',
    background: 'var(--c-surface)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 14,
    lineHeight: 1.6,
    border: '1px solid var(--c-border)',
  },
  blank: {
    display: 'inline-block',
    padding: '1px 10px',
    background: 'var(--c-success-bg)',
    color: 'var(--c-success)',
    borderRadius: 4,
    fontWeight: 500,
    margin: '0 2px',
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
