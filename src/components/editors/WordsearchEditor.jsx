import useStore from '../../store/useStore.js'

const SIZE_OPTIONS = [
  { key: 10, label: '簡單', desc: '10×10 字格' },
  { key: 14, label: '中等', desc: '14×14 字格' },
  { key: 18, label: '困難', desc: '18×18 字格' },
]
const HEART_OPTIONS = [3, 5, 7]

export default function WordsearchEditor() {
  const { draft, updateDraftMeta } = useStore()
  const meta      = draft?.meta || {}
  const words     = meta.words   || ['']
  const matches   = meta.matches || []
  const gridSize  = meta.gridSize  || 14
  const showHint  = meta.showHint !== false
  const matchMode = !!meta.matchMode
  const hearts    = meta.hearts || 5

  function updateWord(idx, val) {
    const next = [...words]
    next[idx] = val.replace(/\s/g, '')  // 不允許空白
    updateDraftMeta('words', next)
  }

  function updateMatch(idx, val) {
    const next = [...matches]
    next[idx] = val
    updateDraftMeta('matches', next)
  }

  function addWord() {
    updateDraftMeta('words', [...words, ''])
  }

  function removeWord(idx) {
    const next = words.filter((_, i) => i !== idx)
    updateDraftMeta('words', next.length ? next : [''])
    updateDraftMeta('matches', matches.filter((_, i) => i !== idx))
  }

  const validWords = words.filter(w => w.trim().length >= 2)

  return (
    <div>
      <div style={S.tip}>
        <i className="ti ti-info-circle" style={{ fontSize:14, verticalAlign:-2 }} aria-hidden="true" />
        {' '}輸入要藏在字格裡的詞語，系統自動排列。每個詞至少 2 個字。
      </div>

      {/* 字格大小 */}
      <p className="label" style={{ marginBottom:8 }}>字格大小</p>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        {SIZE_OPTIONS.map(({ key, label, desc }) => (
          <div key={key} onClick={() => updateDraftMeta('gridSize', key)} style={{
            flex:1, display:'flex', flexDirection:'column', padding:'10px 12px',
            border:`1.5px solid ${gridSize===key ? 'var(--c-primary)' : 'var(--c-border)'}`,
            borderRadius:'var(--radius-md)', cursor:'pointer', transition:'all 0.12s',
            background: gridSize===key ? 'var(--c-primary-bg)' : 'var(--c-surface)',
          }}>
            <span style={{ fontWeight:500, fontSize:13, color: gridSize===key ? '#0C447C' : 'var(--c-text)' }}>{label}</span>
            <span style={{ fontSize:11, color:'var(--c-text-hint)', marginTop:2 }}>{desc}</span>
          </div>
        ))}
      </div>

      {/* 提示開關 */}
      <div onClick={() => updateDraftMeta('showHint', !showHint)} style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 14px', borderRadius:'var(--radius-md)', border:'1px solid var(--c-border)',
        marginBottom:10, cursor:'pointer',
      }}>
        <div>
          <p style={{ fontSize:13, fontWeight:500 }}>顯示提示</p>
          <p style={{ fontSize:11, color:'var(--c-text-hint)', marginTop:2 }}>開：畫面上列出要找的詞語清單；關：學生完全不知道要找什麼</p>
        </div>
        <div style={{ width:38, height:22, borderRadius:999, background: showHint ? 'var(--c-primary)' : 'var(--c-border)', position:'relative', flexShrink:0, transition:'background 0.15s' }}>
          <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left: showHint ? 18 : 2, transition:'left 0.15s' }} />
        </div>
      </div>

      {/* 配對模式開關 */}
      <div onClick={() => updateDraftMeta('matchMode', !matchMode)} style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 14px', borderRadius:'var(--radius-md)', border:'1px solid var(--c-border)',
        marginBottom:10, cursor:'pointer',
      }}>
        <div>
          <p style={{ fontSize:13, fontWeight:500 }}>配對模式</p>
          <p style={{ fontSize:11, color:'var(--c-text-hint)', marginTop:2 }}>開：字格找到詞語後，還要再選出對應的意思或圖片才算完成</p>
        </div>
        <div style={{ width:38, height:22, borderRadius:999, background: matchMode ? 'var(--c-primary)' : 'var(--c-border)', position:'relative', flexShrink:0, transition:'background 0.15s' }}>
          <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:2, left: matchMode ? 18 : 2, transition:'left 0.15s' }} />
        </div>
      </div>

      {/* 愛心數量 */}
      <p className="label" style={{ marginBottom:8 }}>愛心數量</p>
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        {HEART_OPTIONS.map(n => (
          <div key={n} onClick={() => updateDraftMeta('hearts', n)} style={{
            flex:1, textAlign:'center', padding:'8px', borderRadius:'var(--radius-md)',
            border:`1.5px solid ${hearts===n ? 'var(--c-primary)' : 'var(--c-border)'}`,
            background: hearts===n ? 'var(--c-primary-bg)' : 'var(--c-surface)',
            cursor:'pointer', fontSize:13, fontWeight:500,
            color: hearts===n ? '#0C447C' : 'var(--c-text)',
          }}>
            ❤️ × {n}
          </div>
        ))}
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
        <p className="label" style={{ margin:0 }}>詞語清單（{validWords.length} 個有效）</p>
        <p style={{ fontSize:12, color:'var(--c-text-hint)' }}>建議 5–15 個詞</p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {words.map((w, idx) => (
          <div key={idx} style={{ display:'flex', gap:6, alignItems:'center' }}>
            <div style={S.num}>{idx + 1}</div>
            <input
              type="text"
              placeholder={`詞語 ${idx + 1}`}
              value={w}
              onChange={e => updateWord(idx, e.target.value)}
              style={{ flex:1 }}
            />
            {matchMode && (
              <input
                type="text"
                placeholder="對應內容（文字或圖片網址）"
                value={matches[idx] || ''}
                onChange={e => updateMatch(idx, e.target.value)}
                style={{ flex:1 }}
              />
            )}
            {words.length > 1 && (
              <button onClick={() => removeWord(idx)}
                style={{ width:30, height:30, padding:0, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:'var(--c-danger)', borderColor:'var(--c-danger)', fontSize:13 }}>
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button className="btn-ghost" onClick={addWord} style={{ width:'100%', padding:'9px', marginTop:10 }}>
        <i className="ti ti-plus" aria-hidden="true" /> 新增詞語
      </button>

      {validWords.length > 0 && (
        <div style={{ ...S.tip, marginTop:10, background:'var(--c-success-bg)', color:'#27500A' }}>
          <i className="ti ti-check" aria-hidden="true" />
          {' '}{validWords.length} 個詞語，字格至少 {Math.max(gridSize, Math.max(...validWords.map(w=>w.length)) + 4)} × {Math.max(gridSize, Math.max(...validWords.map(w=>w.length)) + 4)}
        </div>
      )}
    </div>
  )
}

const S = {
  tip: {
    padding:'7px 12px', background:'var(--c-bg)', borderRadius:'var(--radius-sm)',
    fontSize:12, color:'var(--c-text-hint)', marginBottom:10,
    display:'flex', alignItems:'center', gap:6,
  },
  num: {
    width:20, fontSize:12, color:'var(--c-text-hint)', textAlign:'right', flexShrink:0,
  },
}