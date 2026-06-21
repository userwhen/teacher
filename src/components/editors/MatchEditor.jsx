import useStore from '../../store/useStore.js'
import { emptyItem } from '../../utils/schema.js'

export default function MatchEditor() {
  const { draft, updateDraftItem, addDraftItem, removeDraftItem } = useStore()
  const items = draft?.items || []

  function handleField(idx, field, value) {
    updateDraftItem(idx, { [field]: value })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <p className="label" style={{ margin: 0 }}>配對組（{items.length}）</p>
        <p style={{ fontSize: 12, color: 'var(--c-text-hint)' }}>
          左邊配右邊，學生用連線配對
        </p>
      </div>

      <div style={styles.headerRow}>
        <span style={styles.colLabel}>左側（題目）</span>
        <span style={styles.colLabel}>右側（答案）</span>
        <span style={{ width: 52 }} />
      </div>

      {items.map((item, idx) => (
        <div key={idx} style={styles.row}>
          <span style={styles.rowNum}>{idx + 1}</span>
          <input
            type="text"
            placeholder="例：光合作用"
            value={item.left}
            onChange={e => handleField(idx, 'left', e.target.value)}
            style={{ flex: 1 }}
          />
          <span style={styles.arrow}>→</span>
          <input
            type="text"
            placeholder="例：植物製造養分的過程"
            value={item.right}
            onChange={e => handleField(idx, 'right', e.target.value)}
            style={{ flex: 1 }}
          />
          {items.length > 1 && (
            <button
              onClick={() => removeDraftItem(idx)}
              style={styles.delBtn}
              title="刪除這組"
            >
              <i className="ti ti-trash" aria-hidden="true" />
            </button>
          )}
        </div>
      ))}

      <button
        className="btn-ghost"
        onClick={() => addDraftItem(emptyItem('match'))}
        style={{ width: '100%', padding: '10px', marginTop: 4 }}
      >
        <i className="ti ti-plus" aria-hidden="true" /> 新增配對組
      </button>

      <div style={styles.tip}>
        <i className="ti ti-bulb" style={{ fontSize: 14, verticalAlign: -2 }} aria-hidden="true" />
        {' '}建議 4–8 組，太多會讓畫面擁擠
      </div>
    </div>
  )
}

const styles = {
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 0 4px 28px',
    fontSize: 12,
    color: 'var(--c-text-hint)',
    fontWeight: 500,
  },
  colLabel: { flex: 1 },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rowNum: {
    width: 20,
    fontSize: 12,
    color: 'var(--c-text-hint)',
    textAlign: 'right',
    flexShrink: 0,
  },
  arrow: {
    color: 'var(--c-text-hint)',
    flexShrink: 0,
    fontSize: 14,
  },
  delBtn: {
    width: 32,
    height: 32,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'var(--c-danger)',
    borderColor: 'var(--c-danger)',
    fontSize: 14,
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
