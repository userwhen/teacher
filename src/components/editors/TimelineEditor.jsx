import useStore from '../../store/useStore.js'
import { emptyItem } from '../../utils/schema.js'

export default function TimelineEditor() {
  const { draft, updateDraftItem, addDraftItem, removeDraftItem } = useStore()
  const items = draft?.items || []

  // 自動把 order 設為目前的 index+1
  function handleAdd() {
    addDraftItem({ text: '', order: items.length + 1 })
  }

  function moveUp(idx) {
    if (idx === 0) return
    const a = { ...items[idx], order: idx }
    const b = { ...items[idx - 1], order: idx + 1 }
    updateDraftItem(idx, a)
    updateDraftItem(idx - 1, b)
  }

  function moveDown(idx) {
    if (idx === items.length - 1) return
    const a = { ...items[idx], order: idx + 2 }
    const b = { ...items[idx + 1], order: idx + 1 }
    updateDraftItem(idx, a)
    updateDraftItem(idx + 1, b)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <p className="label" style={{ margin: 0 }}>事件（{items.length}）</p>
        <p style={{ fontSize: 12, color: 'var(--c-text-hint)' }}>
          由上至下為正確順序
        </p>
      </div>

      <div style={styles.tip} >
        <i className="ti ti-info-circle" style={{ fontSize: 14, verticalAlign: -2 }} aria-hidden="true" />
        {' '}在這裡按正確順序輸入，學生端會打亂後讓學生排回來
      </div>

      {items.map((item, idx) => (
        <div key={idx} style={styles.row}>
          <div style={styles.orderBadge}>{idx + 1}</div>
          <input
            type="text"
            placeholder={`例：第 ${idx + 1} 個事件`}
            value={item.text}
            onChange={e => updateDraftItem(idx, { text: e.target.value, order: idx + 1 })}
            style={{ flex: 1 }}
          />
          <div style={styles.arrows}>
            <button
              onClick={() => moveUp(idx)}
              disabled={idx === 0}
              style={styles.arrowBtn}
              title="上移"
            >
              <i className="ti ti-chevron-up" aria-hidden="true" />
            </button>
            <button
              onClick={() => moveDown(idx)}
              disabled={idx === items.length - 1}
              style={styles.arrowBtn}
              title="下移"
            >
              <i className="ti ti-chevron-down" aria-hidden="true" />
            </button>
          </div>
          {items.length > 2 && (
            <button
              onClick={() => removeDraftItem(idx)}
              style={{ ...styles.iconBtn, color: 'var(--c-danger)', borderColor: 'var(--c-danger)' }}
            >
              <i className="ti ti-trash" aria-hidden="true" />
            </button>
          )}
        </div>
      ))}

      <button
        className="btn-ghost"
        onClick={handleAdd}
        style={{ width: '100%', padding: '10px', marginTop: 4 }}
      >
        <i className="ti ti-plus" aria-hidden="true" /> 新增事件
      </button>
    </div>
  )
}

const styles = {
  tip: {
    marginBottom: 10,
    fontSize: 12,
    color: 'var(--c-text-hint)',
    padding: '6px 10px',
    background: 'var(--c-bg)',
    borderRadius: 'var(--radius-sm)',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  orderBadge: {
    width: 26,
    height: 26,
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
  arrows: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  arrowBtn: {
    width: 24,
    height: 22,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
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
}
