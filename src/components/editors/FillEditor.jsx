import useStore from '../../store/useStore.js'
import { emptyItem } from '../../utils/schema.js'

export default function FillEditor() {
  const { draft, updateDraftItem, addDraftItem, removeDraftItem, updateDraftMeta } = useStore()
  const items = draft?.items || []
  const difficulty = draft?.meta?.difficulty || 'easy'

  return (
    <div>
      {/* 難度選擇 */}
      <div className="card" style={{ background:'var(--c-bg)', padding:'0.875rem', marginBottom:'0.75rem' }}>
        <p className="label" style={{ marginBottom:8 }}>難度</p>
        <div style={{ display:'flex', gap:8 }}>
          {[
            { key:'easy', label:'簡單', desc:'答錯會提示對錯' },
            { key:'hard', label:'困難', desc:'答錯不會提示，直接下一題' },
          ].map(({ key, label, desc }) => (
            <div key={key} onClick={() => updateDraftMeta('difficulty', key)} style={{
              flex:1, display:'flex', flexDirection:'column', padding:'10px 14px',
              border:`1.5px solid ${difficulty===key ? 'var(--c-primary)' : 'var(--c-border)'}`,
              borderRadius:'var(--radius-md)', cursor:'pointer', transition:'all 0.12s',
              background: difficulty===key ? 'var(--c-primary-bg)' : 'var(--c-surface)',
            }}>
              <span style={{ fontWeight:500, fontSize:13, color: difficulty===key ? '#0C447C' : 'var(--c-text)' }}>{label}</span>
              <span style={{ fontSize:11, color:'var(--c-text-hint)', marginTop:2 }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
        <p className="label" style={{ margin:0 }}>題目（{items.length}）</p>
        <p style={{ fontSize:12, color:'var(--c-text-hint)' }}>用 ___ 代表填空位置</p>
      </div>
      {items.map((item, idx) => (
        <div key={idx} className="card" style={{ background:'var(--c-bg)', padding:'1rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--c-text-muted)' }}>題目 {idx+1}</span>
            {items.length > 1 && (
              <button onClick={() => removeDraftItem(idx)} style={{ padding:'2px 8px', fontSize:12, color:'var(--c-danger)', borderColor:'var(--c-danger)' }}>
                <i className="ti ti-trash" aria-hidden="true" /> 刪除
              </button>
            )}
          </div>
          <label className="label">句子（用 ___ 標記填空）</label>
          <input type="text" placeholder="例：植物進行光合作用需要 ___ 和水" value={item.sentence}
            onChange={e => updateDraftItem(idx, { sentence: e.target.value })} style={{ marginBottom:10 }} />
          <div style={{ display:'flex', gap:10 }}>
            <div style={{ flex:1 }}>
              <label className="label">正確答案</label>
              <input type="text" placeholder="例：陽光" value={item.answer}
                onChange={e => updateDraftItem(idx, { answer: e.target.value })} />
            </div>
            <div style={{ flex:1 }}>
              <label className="label">提示（選填）</label>
              <input type="text" placeholder="例：太陽提供的能量" value={item.hint||''}
                onChange={e => updateDraftItem(idx, { hint: e.target.value })} />
            </div>
          </div>
          {item.sentence && (
            <div style={{ marginTop:10, padding:'8px 10px', background:'var(--c-surface)', border:'1px solid var(--c-border)', borderRadius:'var(--radius-sm)', fontSize:14, lineHeight:1.6 }}>
              <span style={{ fontSize:12, color:'var(--c-text-hint)' }}>預覽：</span>
              {item.sentence.split('___').map((part,i,arr) => (
                <span key={i}>{part}{i<arr.length-1 && <span style={{ display:'inline-block', padding:'1px 10px', background:'var(--c-success-bg)', color:'var(--c-success)', borderRadius:4, fontWeight:500, margin:'0 2px' }}>{item.answer||'___'}</span>}</span>
              ))}
            </div>
          )}
        </div>
      ))}
      <button className="btn-ghost" onClick={() => addDraftItem(emptyItem('fill'))} style={{ width:'100%', padding:'10px' }}>
        <i className="ti ti-plus" aria-hidden="true" /> 新增題目
      </button>
    </div>
  )
}
