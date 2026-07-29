import useStore from '../../store/useStore.js'

const MAX_OPTIONS = 6
const MIN_OPTIONS = 2

export default function MazeEditor() {
  const { draft, updateDraftItem, addDraftItem, removeDraftItem, updateDraftMeta } = useStore()
  const items      = draft?.items || []
  const meta       = draft?.meta  || {}
  const difficulty = meta.difficulty || 'normal'
  const enemies    = meta.enemies    ?? 1
  const hearts     = meta.hearts     ?? 3

  function setMeta(key, val) { updateDraftMeta(key, val) }

  function addOption(idx) {
    const item = items[idx]
    if ((item.options?.length || 0) >= MAX_OPTIONS) return
    const opts = [...(item.options || []), '']
    updateDraftItem(idx, { options: opts })
  }

  function removeOption(idx, optIdx) {
    const item = items[idx]
    const opts = item.options.filter((_, i) => i !== optIdx)
    let ans = item.answerIndex
    if (optIdx === ans) ans = 0
    else if (optIdx < ans) ans = ans - 1
    updateDraftItem(idx, { options: opts, answerIndex: Math.min(ans, opts.length - 1) })
  }

  function updateOption(idx, optIdx, val) {
    const opts = [...items[idx].options]
    opts[optIdx] = val
    updateDraftItem(idx, { options: opts })
  }

  function addItem() {
    addDraftItem({ question: '', options: ['', '', '', ''], answerIndex: 0 })
  }

  return (
    <div>
      {/* 遊戲設定 */}
      <div className="card" style={{ background:'var(--c-bg)', padding:'1rem', marginBottom:'0.75rem' }}>
        <p className="label" style={{ marginBottom:10 }}>遊戲設定</p>
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>

          {/* 難度 */}
          <div style={{ flex:2, minWidth:180 }}>
            <label className="label">難度</label>
            <div style={{ display:'flex', gap:6 }}>
              {[
                { key:'easy',   label:'簡單', desc:'敵人只巡邏' },
                { key:'normal', label:'普通', desc:'靠近才追' },
                { key:'hard',   label:'困難', desc:'全程追擊' },
              ].map(d => (
                <div key={d.key} onClick={() => setMeta('difficulty', d.key)}
                  style={{ flex:1, padding:'8px 6px', border:`1.5px solid ${difficulty===d.key?'var(--c-primary)':'var(--c-border)'}`,
                    borderRadius:'var(--radius-md)', cursor:'pointer', textAlign:'center',
                    background: difficulty===d.key ? 'var(--c-primary-bg)' : 'var(--c-surface)' }}>
                  <p style={{ fontSize:13, fontWeight:500, color: difficulty===d.key?'#0C447C':'var(--c-text)' }}>{d.label}</p>
                  <p style={{ fontSize:11, color:'var(--c-text-hint)', marginTop:2 }}>{d.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 敵人數量 */}
          <div style={{ width:90 }}>
            <label className="label">敵人數量</label>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <button onClick={() => setMeta('enemies', Math.max(1, enemies-1))}
                style={{ width:28, height:28, padding:0, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>−</button>
              <span style={{ fontSize:18, fontWeight:600, width:24, textAlign:'center' }}>{enemies}</span>
              <button onClick={() => setMeta('enemies', Math.min(4, enemies+1))}
                style={{ width:28, height:28, padding:0, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>＋</button>
            </div>
            <p style={{ fontSize:11, color:'var(--c-text-hint)', marginTop:4 }}>最多 4 隻</p>
          </div>

          {/* 愛心數量 */}
          <div style={{ width:90 }}>
            <label className="label">愛心數量</label>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <button onClick={() => setMeta('hearts', Math.max(1, hearts-1))}
                style={{ width:28, height:28, padding:0, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>−</button>
              <span style={{ fontSize:18, fontWeight:600, width:24, textAlign:'center' }}>{hearts}</span>
              <button onClick={() => setMeta('hearts', Math.min(5, hearts+1))}
                style={{ width:28, height:28, padding:0, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>＋</button>
            </div>
            <p style={{ fontSize:11, color:'var(--c-text-hint)', marginTop:4 }}>最多 5 顆</p>
          </div>
        </div>
      </div>

      {/* 題目清單 */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
        <p className="label" style={{ margin:0 }}>題目（{items.length}）</p>
        <p style={{ fontSize:12, color:'var(--c-text-hint)' }}>點圓圈設為正確答案・選項 {MIN_OPTIONS}–{MAX_OPTIONS} 個</p>
      </div>

      {items.map((item, idx) => (
        <div key={idx} className="card" style={{ background:'var(--c-bg)', padding:'1rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ fontSize:12, fontWeight:600, color:'var(--c-text-muted)' }}>題目 {idx+1}</span>
            {items.length > 1 && (
              <button onClick={() => removeDraftItem(idx)}
                style={{ padding:'2px 8px', fontSize:12, color:'var(--c-danger)', borderColor:'var(--c-danger)' }}>
                <i className="ti ti-trash" aria-hidden="true" /> 刪除
              </button>
            )}
          </div>

          <input type="text" placeholder="輸入問題…" value={item.question}
            onChange={e => updateDraftItem(idx, { question: e.target.value })}
            style={{ marginBottom:10 }} />

          {(item.options || []).map((opt, optIdx) => (
            <div key={optIdx} style={{ display:'flex', alignItems:'center', gap:8, marginTop:7 }}>
              {/* 正確答案圓圈 */}
              <button onClick={() => updateDraftItem(idx, { answerIndex: optIdx })}
                style={{ width:26, height:26, borderRadius:'50%', border:'1.5px solid', padding:0,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0,
                  background: item.answerIndex===optIdx ? 'var(--c-success)' : 'var(--c-surface)',
                  color:      item.answerIndex===optIdx ? '#fff' : 'var(--c-text-muted)',
                  borderColor:item.answerIndex===optIdx ? 'var(--c-success)' : 'var(--c-border-strong)',
                  cursor:'pointer' }}>
                {String.fromCharCode(65 + optIdx)}
              </button>
              <input type="text" placeholder={`選項 ${String.fromCharCode(65+optIdx)}`}
                value={opt} onChange={e => updateOption(idx, optIdx, e.target.value)}
                style={{ flex:1 }} />
              {(item.options?.length || 0) > MIN_OPTIONS && (
                <button onClick={() => removeOption(idx, optIdx)}
                  style={{ width:28, height:28, padding:0, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--c-danger)', borderColor:'var(--c-danger)', fontSize:13, flexShrink:0 }}>
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}

          {(item.options?.length || 0) < MAX_OPTIONS && (
            <button className="btn-ghost" onClick={() => addOption(idx)}
              style={{ fontSize:12, padding:'4px 12px', marginTop:8 }}>
              <i className="ti ti-plus" aria-hidden="true" /> 新增選項
            </button>
          )}
        </div>
      ))}

      <button className="btn-ghost" onClick={addItem} style={{ width:'100%', padding:'10px' }}>
        <i className="ti ti-plus" aria-hidden="true" /> 新增題目
      </button>
    </div>
  )
}