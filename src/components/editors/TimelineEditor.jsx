import useStore from '../../store/useStore.js'

export default function TimelineEditor() {
  const { draft, updateDraftItem, addDraftItem, removeDraftItem } = useStore()
  const items = draft?.items || []

  function moveUp(idx) {
    if (idx === 0) return
    updateDraftItem(idx,   { ...items[idx],   order: idx })
    updateDraftItem(idx-1, { ...items[idx-1], order: idx+1 })
  }
  function moveDown(idx) {
    if (idx === items.length-1) return
    updateDraftItem(idx,   { ...items[idx],   order: idx+2 })
    updateDraftItem(idx+1, { ...items[idx+1], order: idx+1 })
  }

  return (
    <div>
      <div style={{ marginBottom:10, fontSize:12, color:'var(--c-text-hint)', padding:'6px 10px', background:'var(--c-bg)', borderRadius:'var(--radius-sm)', border:'1px solid var(--c-border)' }}>
        <i className="ti ti-info-circle" style={{ fontSize:14, verticalAlign:-2 }} aria-hidden="true" /> 由上至下為正確順序，學生端會打亂後讓學生排回來
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
        <p className="label" style={{ margin:0 }}>事件（{items.length}）</p>
      </div>
      {items.map((item, idx) => (
        <div key={idx} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--c-primary-bg)', color:'var(--c-primary)', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{idx+1}</div>
          <input type="text" placeholder={`例：第 ${idx+1} 個事件`} value={item.text}
            onChange={e => updateDraftItem(idx, { text: e.target.value, order: idx+1 })} style={{ flex:1 }} />
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            <button onClick={() => moveUp(idx)} disabled={idx===0} style={{ width:24, height:22, padding:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>
              <i className="ti ti-chevron-up" aria-hidden="true" />
            </button>
            <button onClick={() => moveDown(idx)} disabled={idx===items.length-1} style={{ width:24, height:22, padding:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>
              <i className="ti ti-chevron-down" aria-hidden="true" />
            </button>
          </div>
          {items.length > 2 && (
            <button onClick={() => removeDraftItem(idx)}
              style={{ width:32, height:32, padding:0, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--c-danger)', borderColor:'var(--c-danger)', fontSize:14 }}>
              <i className="ti ti-trash" aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
      <button className="btn-ghost" onClick={() => addDraftItem({ text:'', order: items.length+1 })} style={{ width:'100%', padding:'10px', marginTop:4 }}>
        <i className="ti ti-plus" aria-hidden="true" /> 新增事件
      </button>
    </div>
  )
}
