import { useRef, useState } from 'react'
import useStore from '../../store/useStore.js'

// meta 結構：
// mode: 'label' | 'point'
//
// mode=label（標籤連線）:
//   imageDataUrl: string
//   points: [{ id, x, y }]           圖片上的定位點（百分比）
//   labels: [{ id, text }]           左側標籤清單
//   pairs:  [{ labelId, pointId }]   正確配對
//
// mode=point（點對點）:
//   imageDataUrl: string
//   points: [{ id, x, y, label }]    圖片上的點，含標籤
//   pairs:  [{ a, b }]              點對點配對

export default function HotspotEditor() {
  const { draft, updateDraftMeta, updateDraftMetaBatch } = useStore()
const meta   = draft?.meta || {}
  const mode   = meta.mode   || 'label'
  const difficulty = meta.difficulty || 'easy'
  const points = meta.points || []
  const labels = meta.labels || []
  const pairs  = meta.pairs  || []

  const imgRef  = useRef(null)
  const [tool, setTool]           = useState('view')   // view | addPoint | addPair
  const [pairA, setPairA]         = useState(null)     // 配對第一個選項 id
  const [editId, setEditId]       = useState(null)     // 正在編輯的 id
  const [urlInput, setUrlInput]   = useState('')       // 圖片網址輸入框

  function setMode(m) {
    updateDraftMetaBatch({ mode: m, points: [], labels: [], pairs: [] })
    setPairA(null); setTool('view')
  }

  function applyImageUrl() {
    if (!urlInput.trim()) return
    updateDraftMetaBatch({ imageDataUrl: urlInput.trim(), points: [], labels: [], pairs: [] })
    setUrlInput('')
  }

  // ── 點擊圖片 ──────────────────────────────────────────────
  function handleImgClick(e) {
    if (tool !== 'addPoint') return
    const rect = imgRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width)  * 100
    const y = ((e.clientY - rect.top)  / rect.height) * 100
    const id = `pt_${Date.now()}`
    if (mode === 'label') {
      updateDraftMeta('points', [...points, { id, x, y }])
    } else {
      updateDraftMeta('points', [...points, { id, x, y, label: `標記 ${points.length + 1}` }])
    }
  }

  // ── 刪除點 ────────────────────────────────────────────────
  function deletePoint(id) {
    updateDraftMeta('points', points.filter(p => p.id !== id))
    if (mode === 'label') {
      updateDraftMeta('pairs', pairs.filter(p => p.pointId !== id))
    } else {
      updateDraftMeta('pairs', pairs.filter(p => p.a !== id && p.b !== id))
    }
    if (pairA === id) setPairA(null)
  }

  // ── Label 模式：標籤 CRUD ─────────────────────────────────
  function addLabel() {
    const id = `lb_${Date.now()}`
    updateDraftMeta('labels', [...labels, { id, text: `標籤 ${labels.length + 1}` }])
  }

  function updateLabel(id, text) {
    updateDraftMeta('labels', labels.map(l => l.id === id ? { ...l, text } : l))
  }

  function deleteLabel(id) {
    updateDraftMeta('labels', labels.filter(l => l.id !== id))
    updateDraftMeta('pairs',  pairs.filter(p => p.labelId !== id))
    if (pairA === id) setPairA(null)
  }

  // ── 配對邏輯 ──────────────────────────────────────────────
  function handlePairClick(id) {
    if (tool !== 'addPair') return
    if (!pairA) { setPairA(id); return }
    if (pairA === id) { setPairA(null); return }

    if (mode === 'label') {
      // pairA 必須一個是 label 一個是 point
      const aIsLabel = labels.find(l => l.id === pairA)
      const bIsLabel = labels.find(l => l.id === id)
      let labelId, pointId
      if (aIsLabel && !bIsLabel)      { labelId = pairA; pointId = id }
      else if (!aIsLabel && bIsLabel) { labelId = id;    pointId = pairA }
      else { setPairA(id); return }  // 兩個都是同類，換選
      const exists = pairs.find(p => p.labelId === labelId)
      const nextPairs = exists
        ? pairs.map(p => p.labelId === labelId ? { labelId, pointId } : p)
        : [...pairs, { labelId, pointId }]
      updateDraftMeta('pairs', nextPairs)
      setPairA(null)
    } else {
      const exists = pairs.find(p => (p.a===pairA&&p.b===id)||(p.a===id&&p.b===pairA))
      if (!exists) updateDraftMeta('pairs', [...pairs, { a: pairA, b: id }])
      setPairA(null)
    }
  }

  function deletePair(idx) {
    updateDraftMeta('pairs', pairs.filter((_, i) => i !== idx))
  }

  // ── 取得配對狀態 ──────────────────────────────────────────
  function isSelected(id) { return pairA === id }
  function isPaired(id) {
    if (mode === 'label') return pairs.some(p => p.labelId === id || p.pointId === id)
    return pairs.some(p => p.a === id || p.b === id)
  }

  const getLabel = id => labels.find(l => l.id === id)
  const getPoint = id => points.find(p => p.id === id)

  // ── 驗證提示 ──────────────────────────────────────────────
  const isReady = mode === 'label'
    ? meta.imageDataUrl && labels.length >= 2 && points.length >= 2 && pairs.length >= 2
    : meta.imageDataUrl && points.length >= 2 && pairs.length >= 1

  return (
    <div>
      {/* 模式選擇 */}
      <div className="card" style={{ background:'var(--c-bg)', padding:'0.875rem', marginBottom:'0.75rem' }}>
        <p className="label" style={{ marginBottom:8 }}>模式</p>
        <div style={{ display:'flex', gap:8 }}>
          {[
            { key:'label', label:'標籤連線', desc:'左側文字標籤連到圖片上的定位點' },
            { key:'point', label:'點對點',   desc:'圖片上兩個點互相配對' },
          ].map(m => (
            <div key={m.key} onClick={() => setMode(m.key)} style={{
              flex:1, padding:'10px 14px', border:`1.5px solid ${mode===m.key?'var(--c-primary)':'var(--c-border)'}`,
              borderRadius:'var(--radius-md)', cursor:'pointer', transition:'all 0.12s',
              background: mode===m.key ? 'var(--c-primary-bg)' : 'var(--c-surface)',
            }}>
              <p style={{ fontWeight:500, fontSize:13, color: mode===m.key?'#0C447C':'var(--c-text)' }}>{m.label}</p>
              <p style={{ fontSize:11, color:'var(--c-text-hint)', marginTop:2 }}>{m.desc}</p>
            </div>
          ))}
        </div>
</div>

      {/* 難度選擇 */}
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

      {/* 圖片網址 */}
      {!meta.imageDataUrl ? (
        <div style={S.uploadArea}>
          <i className="ti ti-link" style={{ fontSize:36, color:'var(--c-text-hint)' }} aria-hidden="true" />
          <p style={{ marginTop:8, fontWeight:500 }}>貼上圖片網址</p>
          <p style={{ fontSize:12, color:'var(--c-text-hint)', marginBottom:10 }}>去網頁上找圖片，右鍵複製圖片網址貼在這裡</p>
          <div style={{ display:'flex', gap:6, maxWidth:360, margin:'0 auto' }}>
            <input type="text" placeholder="https://..." value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && applyImageUrl()}
              style={{ flex:1 }} />
            <button className="btn-primary" onClick={applyImageUrl} style={{ padding:'0 14px' }}>使用</button>
          </div>
        </div>
      ) : (
        <>
          {/* 工具列 */}
          <div style={S.toolbar}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[
                { key:'view',     icon:'hand-finger', label:'檢視' },
                { key:'addPoint', icon:'map-pin',     label:'放置定位點' },
                { key:'addPair',  icon:'arrows-join', label:'設定配對' },
              ].map(btn => (
                <button key={btn.key} onClick={() => { setTool(btn.key); setPairA(null) }}
                  style={{ ...S.toolBtn, ...(tool===btn.key ? S.toolBtnOn : {}) }}>
                  <i className={`ti ti-${btn.icon}`} aria-hidden="true" /> {btn.label}
                </button>
              ))}
            </div>
            <button onClick={() => updateDraftMetaBatch({ imageDataUrl: '', points: [], labels: [], pairs: [] })} style={{ fontSize:12, padding:'5px 10px' }}>
              <i className="ti ti-refresh" aria-hidden="true" /> 換圖
            </button>
          </div>

          {/* 提示文字 */}
          {tool === 'addPoint' && (
            <div style={S.hint}><i className="ti ti-info-circle" aria-hidden="true" /> 點擊圖片放置定位點</div>
          )}
          {tool === 'addPair' && mode === 'label' && (
            <div style={{ ...S.hint, ...(pairA ? { background:'var(--c-primary-bg)', color:'#0C447C' } : {}) }}>
              <i className="ti ti-arrows-join" aria-hidden="true" />
              {pairA
                ? ` 已選「${getLabel(pairA)?.text || '定位點'}」→ 點另一個完成配對`
                : ' 點左側標籤，再點圖片定位點配對'}
            </div>
          )}
          {tool === 'addPair' && mode === 'point' && (
            <div style={{ ...S.hint, ...(pairA ? { background:'var(--c-primary-bg)', color:'#0C447C' } : {}) }}>
              <i className="ti ti-arrows-join" aria-hidden="true" />
              {pairA ? ' 再點另一個定位點完成配對' : ' 點第一個定位點，再點第二個'}
            </div>
          )}

          {/* 主體：label 模式左右佈局，point 模式只有圖片 */}
          <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>

            {/* label 模式：左側標籤欄 */}
            {mode === 'label' && (
              <div style={S.labelCol}>
                <p className="label" style={{ marginBottom:6 }}>標籤</p>
                {labels.map((lb, i) => (
                  <div key={lb.id} style={{
                    ...S.labelChip,
                    background: isSelected(lb.id) ? 'var(--c-primary)' : isPaired(lb.id) ? 'var(--c-success)' : S.COLORS[i % S.COLORS.length],
                    cursor: tool === 'addPair' ? 'pointer' : 'default',
                    transform: isSelected(lb.id) ? 'scale(1.05)' : 'scale(1)',
                  }} onClick={() => handlePairClick(lb.id)}>
                    {editId === lb.id ? (
                      <input autoFocus value={lb.text} style={S.inlineEdit}
                        onChange={e => updateLabel(lb.id, e.target.value)}
                        onBlur={() => setEditId(null)}
                        onKeyDown={e => e.key==='Enter' && setEditId(null)}
                        onClick={e => e.stopPropagation()} />
                    ) : (
                      <span onDoubleClick={e => { e.stopPropagation(); setEditId(lb.id) }}
                        style={{ flex:1, color:'#fff', fontWeight:600, fontSize:14 }}>{lb.text}</span>
                    )}
                    <button onClick={e => { e.stopPropagation(); deleteLabel(lb.id) }}
                      style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', padding:'0 0 0 4px', fontSize:13 }}>
                      <i className="ti ti-x" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button className="btn-ghost" onClick={addLabel} style={{ width:'100%', padding:'7px', fontSize:12, marginTop:4 }}>
                  <i className="ti ti-plus" aria-hidden="true" /> 新增標籤
                </button>
                <p style={{ fontSize:11, color:'var(--c-text-hint)', marginTop:6 }}>雙擊標籤可編輯文字</p>
              </div>
            )}

            {/* 圖片區 */}
            <div style={{ position:'relative', flex:1 }} onClick={handleImgClick}>
              <img ref={imgRef} src={meta.imageDataUrl} alt="熱點圖片"
                style={{ width:'100%', borderRadius:'var(--radius-md)', display:'block',
                  cursor: tool==='addPoint' ? 'crosshair' : 'default' }} />

              {/* label 模式：連線 SVG */}
              {mode === 'label' && (
                <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none' }}>
                  {pairs.map((pair, i) => {
                    const pt = getPoint(pair.pointId)
                    if (!pt) return null
                    const color = S.COLORS[labels.findIndex(l=>l.id===pair.labelId) % S.COLORS.length] || '#888'
                    // 線從左邊界連到定位點
                    return (
                      <line key={i}
                        x1="0%" y1={`${pt.y}%`}
                        x2={`${pt.x}%`} y2={`${pt.y}%`}
                        stroke={color} strokeWidth="2" strokeDasharray="4,3" opacity="0.6" />
                    )
                  })}
                </svg>
              )}

              {/* point 模式：配對連線 */}
              {mode === 'point' && (
                <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none' }}>
                  {pairs.map((pair, i) => {
                    const a = getPoint(pair.a), b = getPoint(pair.b)
                    if (!a||!b) return null
                    return (
                      <line key={i}
                        x1={`${a.x}%`} y1={`${a.y}%`}
                        x2={`${b.x}%`} y2={`${b.y}%`}
                        stroke="#185FA5" strokeWidth="2" strokeDasharray="5,3" opacity="0.7" />
                    )
                  })}
                </svg>
              )}

              {/* 定位點 */}
              {points.map((pt, i) => {
                const sel = isSelected(pt.id)
                const paired = mode === 'label'
                  ? pairs.some(p => p.pointId === pt.id)
                  : pairs.some(p => p.a===pt.id || p.b===pt.id)
                const color = paired ? '#1D9E75' : sel ? 'var(--c-primary)' : '#888780'
                return (
                  <div key={pt.id}
                    onClick={e => { e.stopPropagation(); handlePairClick(pt.id) }}
                    onContextMenu={e => { e.preventDefault(); e.stopPropagation(); deletePoint(pt.id) }}
                    title="右鍵刪除這個定位點"
                    style={{ position:'absolute', left:`${pt.x}%`, top:`${pt.y}%`,
                      transform:'translate(-50%,-50%)', zIndex:3,
                      cursor: tool==='addPair' ? 'pointer' : 'default' }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'#fff',
                      border:`3px solid ${color}`, boxShadow:'0 1px 4px rgba(0,0,0,0.3)',
                      transition:'all 0.12s', transform: sel ? 'scale(1.3)' : 'scale(1)' }} />
                    {mode === 'point' && pt.label && (
                      <div style={{ position:'absolute', bottom:'calc(100%+4px)', left:'50%',
                        transform:'translateX(-50%)', background:'rgba(0,0,0,0.7)', color:'#fff',
                        fontSize:10, padding:'2px 6px', borderRadius:3, whiteSpace:'nowrap' }}>
                        {pt.label}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 配對清單 */}
          {pairs.length > 0 && (
            <div style={{ marginTop:'1rem' }}>
              <p className="label" style={{ marginBottom:6 }}>已設定配對（{pairs.length} 組）</p>
              {pairs.map((pair, i) => {
                const left  = mode==='label' ? getLabel(pair.labelId)?.text : `定位點 ${points.findIndex(p=>p.id===pair.a)+1}`
                const right = mode==='label' ? `定位點 ${points.findIndex(p=>p.id===pair.pointId)+1}` : `定位點 ${points.findIndex(p=>p.id===pair.b)+1}`
                return (
                  <div key={i} style={S.pairRow}>
                    <span style={{ fontSize:13, flex:1 }}>
                      <span style={S.pairChip}>{left}</span>
                      <i className="ti ti-arrows-right-left" style={{ margin:'0 8px', color:'var(--c-text-hint)', fontSize:12 }} aria-hidden="true" />
                      <span style={S.pairChip}>{right}</span>
                    </span>
                    <button onClick={() => deletePair(i)}
                      style={{ padding:'2px 6px', fontSize:12, color:'var(--c-danger)', borderColor:'var(--c-danger)' }}>
                      <i className="ti ti-trash" aria-hidden="true" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* 狀態提示 */}
          <div style={{ ...S.hint, marginTop:'1rem', ...(isReady ? { background:'var(--c-success-bg)', color:'#27500A' } : {}) }}>
            <i className={`ti ti-${isReady?'check':'alert-triangle'}`} aria-hidden="true" />
            {' '}{isReady
              ? `${mode==='label'?`${labels.length} 個標籤`:`${points.length} 個定位點`}，${pairs.length} 組配對，可以產生網址了`
              : mode==='label'
                ? '請新增至少 2 個標籤、2 個定位點，並設定配對'
                : '請放置至少 2 個定位點並設定配對'
            }
          </div>
        </>
      )}
    </div>
  )
}

const S = {
  COLORS: ['#E53935','#43A047','#1E88E5','#8E24AA','#F4511E','#00ACC1','#F9A825','#6D4C41'],
  uploadArea: {
    border:'2px dashed var(--c-border)', borderRadius:'var(--radius-lg)',
    padding:'2.5rem 1rem', textAlign:'center', cursor:'pointer', color:'var(--c-text-muted)',
  },
  toolbar: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    gap:8, marginBottom:8, flexWrap:'wrap',
  },
  toolBtn: { padding:'5px 12px', fontSize:12, borderRadius:999, border:'1px solid var(--c-border)', background:'var(--c-surface)', cursor:'pointer' },
  toolBtnOn: { background:'var(--c-primary-bg)', borderColor:'var(--c-primary)', color:'#0C447C', fontWeight:500 },
  hint: { padding:'7px 12px', background:'var(--c-bg)', borderRadius:'var(--radius-sm)', fontSize:12, color:'var(--c-text-hint)', marginBottom:8, display:'flex', alignItems:'center', gap:6 },
  labelCol: { width:130, flexShrink:0, display:'flex', flexDirection:'column', gap:6 },
  labelChip: {
    display:'flex', alignItems:'center', gap:4, padding:'8px 10px',
    borderRadius:'var(--radius-sm)', cursor:'pointer', transition:'all 0.12s',
    minHeight:40,
  },
  inlineEdit: { flex:1, background:'transparent', border:'none', outline:'none', color:'#fff', fontWeight:600, fontSize:14, width:'100%' },
  pairRow: { display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid var(--c-border)' },
  pairChip: { display:'inline-block', padding:'2px 8px', background:'var(--c-primary-bg)', color:'#0C447C', borderRadius:999, fontSize:12, fontWeight:500 },
}
