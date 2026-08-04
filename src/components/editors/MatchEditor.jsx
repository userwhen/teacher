import useStore from '../../store/useStore.js'
import { emptyItem } from '../../utils/schema.js'
import CsvTools from '../CsvTools.jsx'
import { matchCsv } from '../../utils/csvConfigs.js'

export default function MatchEditor() {
  const { draft, setDraft, updateDraftItem, addDraftItem, removeDraftItem, updateDraftMeta } = useStore()
  const items      = draft?.items || []
  const difficulty = draft?.meta?.difficulty || 'easy'

  return (
    <div>
      <div className="card" style={{ background:'var(--c-bg)', padding:'0.875rem', marginBottom:'0.75rem' }}>
        <p className="label" style={{ marginBottom:8 }}>難度</p>
        <div style={{ display:'flex', gap:8 }}>
          {[
            { key:'easy', label:'簡單', desc:'連錯立即彈開，不透露正確答案' },
            { key:'hard', label:'困難', desc:'可任意連線，結算後顯示正確答案' },
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

      <CsvTools {...matchCsv} items={items} onImport={newItems => setDraft({ ...draft, items: newItems })} />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
        <p className="label" style={{ margin:0 }}>配對組（{items.length}）</p>
        <p style={{ fontSize:12, color:'var(--c-text-hint)' }}>左側配右側，學生連線配對</p>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 0 4px 28px', fontSize:12, color:'var(--c-text-hint)', fontWeight:500 }}>
        <span style={{ flex:1 }}>左側（題目）</span>
        <span style={{ flex:1 }}>右側（答案）</span>
        <span style={{ width:40 }} />
      </div>
      {items.map((item, idx) => (
        <div key={idx} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <span style={{ width:20, fontSize:12, color:'var(--c-text-hint)', textAlign:'right', flexShrink:0 }}>{idx+1}</span>
          <input type="text" placeholder="例：光合作用" value={item.left}
            onChange={e => updateDraftItem(idx, { left: e.target.value })} style={{ flex:1 }} />
          <span style={{ color:'var(--c-text-hint)', flexShrink:0, fontSize:14 }}>→</span>
          <input type="text" placeholder="例：植物製造養分的過程" value={item.right}
            onChange={e => updateDraftItem(idx, { right: e.target.value })} style={{ flex:1 }} />
          {items.length > 1 && (
            <button onClick={() => removeDraftItem(idx)}
              style={{ width:32, height:32, padding:0, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'var(--c-danger)', borderColor:'var(--c-danger)', fontSize:14 }}>
              <i className="ti ti-trash" aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
      <button className="btn-ghost" onClick={() => addDraftItem(emptyItem('match'))} style={{ width:'100%', padding:'10px', marginTop:4 }}>
        <i className="ti ti-plus" aria-hidden="true" /> 新增配對組
      </button>
      <div style={{ marginTop:10, fontSize:12, color:'var(--c-text-hint)', padding:'6px 10px', background:'var(--c-bg)', borderRadius:'var(--radius-sm)' }}>
        <i className="ti ti-bulb" style={{ fontSize:14, verticalAlign:-2 }} aria-hidden="true" /> 建議 4–8 組，太多畫面會擁擠
      </div>
    </div>
  )
}
