import useStore from '../../store/useStore.js'
import { emptyItem } from '../../utils/schema.js'

export default function QuizEditor() {
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
            { key:'easy', label:'簡單', desc:'答錯會提示正確答案' },
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
        <p style={{ fontSize:12, color:'var(--c-text-hint)' }}>點字母圓圈設為正確答案</p>
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
          <input type="text" placeholder="輸入問題…" value={item.question}
            onChange={e => updateDraftItem(idx, { question: e.target.value })} style={{ marginBottom:10 }} />
          {['A','B','C','D'].map((letter, optIdx) => (
            <div key={optIdx} style={{ display:'flex', alignItems:'center', gap:8, marginTop:7 }}>
              <button onClick={() => updateDraftItem(idx, { answerIndex: optIdx })}
                style={{ width:26, height:26, borderRadius:'50%', border:'1.5px solid', padding:0,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700,
                  flexShrink:0, cursor:'pointer',
                  background: item.answerIndex === optIdx ? 'var(--c-success)' : 'var(--c-surface)',
                  color: item.answerIndex === optIdx ? '#fff' : 'var(--c-text-muted)',
                  borderColor: item.answerIndex === optIdx ? 'var(--c-success)' : 'var(--c-border-strong)',
                }}>{letter}</button>
              <input type="text" placeholder={`選項 ${letter}`} value={item.options[optIdx]}
                onChange={e => { const o=[...item.options]; o[optIdx]=e.target.value; updateDraftItem(idx,{options:o}) }} />
            </div>
          ))}
        </div>
      ))}
      <button className="btn-ghost" onClick={() => addDraftItem(emptyItem('quiz'))} style={{ width:'100%', padding:'10px' }}>
        <i className="ti ti-plus" aria-hidden="true" /> 新增題目
      </button>
    </div>
  )
}
