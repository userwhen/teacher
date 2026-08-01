import useStore from '../../store/useStore.js'
import { emptyItem } from '../../utils/schema.js'

export default function AnagramEditor() {
  const { draft, updateDraftItem, addDraftItem, removeDraftItem, updateDraftMeta } = useStore()
  const items = draft?.items || []
  const difficulty = draft?.meta?.difficulty || 'easy'

  return (
    <div>
      <div style={S.tip}>
        <i className="ti ti-info-circle" style={{ fontSize:14, verticalAlign:-2 }} aria-hidden="true" />
        {' '}輸入正確答案，學生端會把字打亂，讓學生重新排列。
      </div>

      {/* 難度選擇 */}
      <div className="card" style={{ background:'var(--c-bg)', padding:'0.875rem', marginBottom:'0.75rem' }}>
        <p className="label" style={{ marginBottom:8 }}>難度</p>
        <div style={{ display:'flex', gap:8 }}>
          {[
            { key:'easy', label:'簡單', desc:'拼錯會提示' },
            { key:'hard', label:'困難', desc:'拼錯不會提示，靜默清空重來' },
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
      </div>

      {items.map((item, idx) => (
        <div key={idx} className="card" style={{ background:'var(--c-bg)', padding:'1rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={S.qNum}>題目 {idx + 1}</span>
            {items.length > 1 && (
              <button onClick={() => removeDraftItem(idx)}
                style={{ padding:'2px 8px', fontSize:12, color:'var(--c-danger)', borderColor:'var(--c-danger)' }}>
                <i className="ti ti-trash" aria-hidden="true" /> 刪除
              </button>
            )}
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <div style={{ flex:1 }}>
              <label className="label">提示（題目說明）</label>
              <input type="text" placeholder="例：指用玻璃做成的容器"
                value={item.hint || ''}
                onChange={e => updateDraftItem(idx, { hint: e.target.value })} />
            </div>
            <div style={{ flex:1 }}>
              <label className="label">正確答案（要重組的詞）</label>
              <input type="text" placeholder="例：玻璃缸"
                value={item.answer || ''}
                onChange={e => updateDraftItem(idx, { answer: e.target.value })} />
            </div>
          </div>

          {item.answer && item.answer.length >= 2 && (
            <div style={S.preview}>
              <span style={{ fontSize:12, color:'var(--c-text-hint)' }}>打亂後預覽：</span>
              {shufflePreview(item.answer).split('').map((ch, i) => (
                <span key={i} style={S.previewTile}>{ch}</span>
              ))}
            </div>
          )}
        </div>
      ))}

      <button className="btn-ghost" onClick={() => addDraftItem({ hint: '', answer: '' })}
        style={{ width:'100%', padding:'10px' }}>
        <i className="ti ti-plus" aria-hidden="true" /> 新增題目
      </button>
    </div>
  )
}

// 簡單預覽打亂（純 UI 用）
function shufflePreview(str) {
  const a = str.split('')
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  // 避免和原字串一樣
  return a.join('') === str && str.length > 1 ? a.reverse().join('') : a.join('')
}

const S = {
  tip: {
    padding:'7px 12px', background:'var(--c-bg)', borderRadius:'var(--radius-sm)',
    fontSize:12, color:'var(--c-text-hint)', marginBottom:10,
    display:'flex', alignItems:'center', gap:6,
    border: '1px solid var(--c-border)',
  },
  qNum: { fontSize:12, fontWeight:600, color:'var(--c-text-muted)', letterSpacing:0.5 },
  preview: {
    marginTop:10, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap',
    padding:'8px 10px', background:'var(--c-surface)', border:'1px solid var(--c-border)',
    borderRadius:'var(--radius-sm)',
  },
  previewTile: {
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    width:36, height:36, borderRadius:'var(--radius-sm)',
    background:'#2c2c2a', color:'#fff', fontSize:16, fontWeight:600,
    boxShadow:'0 2px 4px rgba(0,0,0,0.2)',
  },
}
