import useStore from '../../store/useStore.js'
import { emptyItem } from '../../utils/schema.js'

const DEFAULT_CATEGORIES = ['分類 A', '分類 B']

export default function SortEditor() {
  const { draft, updateDraftItem, addDraftItem, removeDraftItem, updateDraftMeta } = useStore()
  const items      = draft?.items || []
  const categories = draft?.meta?.categories || DEFAULT_CATEGORIES

  function setCategories(cats) {
    updateDraftMeta('categories', cats)
    items.forEach((item, idx) => { if (!cats.includes(item.category)) updateDraftItem(idx, { category: '' }) })
  }

  return (
    <div>
      <div className="card" style={{ background:'var(--c-bg)', marginBottom:'0.75rem' }}>
        <p className="label" style={{ marginBottom:8 }}>分類桶名稱</p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {categories.map((cat, ci) => (
            <div key={ci} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <input type="text" value={cat} onChange={e => { const n=[...categories]; n[ci]=e.target.value; updateDraftMeta('categories',n) }} style={{ width:110 }} />
              {categories.length > 2 && (
                <button onClick={() => setCategories(categories.filter((_,i)=>i!==ci))}
                  style={{ width:32, height:32, padding:0, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--c-danger)', borderColor:'var(--c-danger)', fontSize:14 }}>
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          <button className="btn-ghost" onClick={() => setCategories([...categories, `分類 ${String.fromCharCode(65+categories.length)}`])} style={{ padding:'6px 12px', fontSize:13 }}>
            <i className="ti ti-plus" aria-hidden="true" /> 新增分類
          </button>
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
        <p className="label" style={{ margin:0 }}>詞語（{items.length}）</p>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 0 4px 28px', fontSize:12, color:'var(--c-text-hint)', fontWeight:500 }}>
        <span style={{ flex:1 }}>詞語</span><span style={{ width:130 }}>所屬分類</span><span style={{ width:36 }} />
      </div>
      {items.map((item, idx) => (
        <div key={idx} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <span style={{ width:20, fontSize:12, color:'var(--c-text-hint)', textAlign:'right', flexShrink:0 }}>{idx+1}</span>
          <input type="text" placeholder="例：蒸發" value={item.text} onChange={e => updateDraftItem(idx, { text: e.target.value })} style={{ flex:1 }} />
          <select value={item.category} onChange={e => updateDraftItem(idx, { category: e.target.value })} style={{ width:130 }}>
            <option value="">選擇分類</option>
            {categories.map((cat,ci) => <option key={ci} value={cat}>{cat}</option>)}
          </select>
          {items.length > 1 && (
            <button onClick={() => removeDraftItem(idx)}
              style={{ width:32, height:32, padding:0, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--c-danger)', borderColor:'var(--c-danger)', fontSize:14 }}>
              <i className="ti ti-trash" aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
      <button className="btn-ghost" onClick={() => addDraftItem(emptyItem('sort'))} style={{ width:'100%', padding:'10px', marginTop:4 }}>
        <i className="ti ti-plus" aria-hidden="true" /> 新增詞語
      </button>
    </div>
  )
}
