import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import ResultScreen from '../ResultScreen.jsx'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const COLORS = ['#E53935','#43A047','#1E88E5','#8E24AA','#F4511E','#00ACC1','#F9A825','#6D4C41']

function LabelPlayer({ meta, difficulty, onFinish }) {
  const points = meta.points || []
  const labels = meta.labels || []
  const pairs  = meta.pairs  || []
  const shuffledLabels = useMemo(() => shuffle([...labels]), [])
  const [lines,      setLines]      = useState([])   // { labelId, pointId, state: 'correct'|'pending' }
  const [selLabel,   setSelLabel]   = useState(null)
  const [mistakes,   setMistakes]   = useState(0)
  const [wrongFlash, setWrongFlash] = useState(null)
  const imgRef  = useRef(null)
  const wrapRef = useRef(null)
  const [, redraw] = useState(0)
  const triggerRedraw = useCallback(() => redraw(n => n+1), [])
  useEffect(() => { window.addEventListener('resize', triggerRedraw); return () => window.removeEventListener('resize', triggerRedraw) }, [])
  useEffect(() => { setTimeout(triggerRedraw, 80) }, [])

  const activeLines = lines // 顯示用：簡單模式只會有 correct，困難模式是 pending

  function ptToPx(pt) {
    const img=imgRef.current, wrap=wrapRef.current; if(!img||!wrap) return null
    const ir=img.getBoundingClientRect(), wr=wrap.getBoundingClientRect()
    return { x:(pt.x/100)*ir.width+(ir.left-wr.left), y:(pt.y/100)*ir.height+(ir.top-wr.top) }
  }

  function labelAnchor(labelId) {
    const el=document.getElementById('lb-'+labelId), wrap=wrapRef.current; if(!el||!wrap) return null
    const er=el.getBoundingClientRect(), wr=wrap.getBoundingClientRect()
    return { x:er.right-wr.left, y:er.top-wr.top+er.height/2 }
  }

  function clickLabel(id) {
    if (difficulty === 'easy' && activeLines.some(l => l.labelId===id)) return
    setSelLabel(prev => prev===id ? null : id)
  }

  function clickPoint(pointId) {
    if (!selLabel) return
    if (difficulty === 'easy') {
      const correctPair = pairs.find(p => p.labelId===selLabel && p.pointId===pointId)
      if (correctPair) {
        const next = [...lines.filter(l => l.labelId!==selLabel), { labelId:selLabel, pointId, state:'correct' }]
        setLines(next); setSelLabel(null)
        if (next.length === pairs.length) setTimeout(() => onFinish(pairs.length, pairs.length, mistakes), 600)
      } else {
        setMistakes(m => m+1); setWrongFlash(selLabel)
        setTimeout(() => { setWrongFlash(null); setSelLabel(null) }, 700)
      }
    } else {
      // 困難：任意連，覆蓋同一個標籤或同一個點的舊線，先不判斷對錯
      setLines(prev => [...prev.filter(l => l.labelId!==selLabel && l.pointId!==pointId), { labelId:selLabel, pointId, state:'pending' }])
      setSelLabel(null)
    }
  }

  function checkAll() {
    let correct = 0
    lines.forEach(l => { if (pairs.some(p => p.labelId===l.labelId && p.pointId===l.pointId)) correct++ })
    onFinish(correct, pairs.length, lines.length - correct)
  }

  const wrapW = wrapRef.current?.offsetWidth  || 600
  const wrapH = wrapRef.current?.offsetHeight || 400

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--c-text-muted)', marginBottom:6 }}>
        <span>已連 {activeLines.length} / {pairs.length}</span>
        {difficulty==='easy'
          ? <span>錯誤 {mistakes} 次</span>
          : <span style={{ display:'inline-block', padding:'1px 8px', borderRadius:999, fontSize:11, fontWeight:500, background:'var(--c-warning-bg)', color:'var(--c-warning)' }}>困難</span>}
      </div>
      <div style={{ height:6, background:'var(--c-border)', borderRadius:999, overflow:'hidden', marginBottom:10 }}>
        <div style={{ height:'100%', background:'var(--c-success)', borderRadius:999, transition:'width 0.3s', width:`${(activeLines.length/pairs.length)*100}%` }} />
      </div>
      <p style={{ fontSize:13, color:'var(--c-text-hint)', textAlign:'center', marginBottom:8 }}>
        {selLabel ? '點圖片上的定位點來連線' : '點左側標籤，再點圖片上的定位點'}
      </p>
      <div ref={wrapRef} className="hotspot-layout" style={{ display:'flex', gap:12, alignItems:'flex-start', position:'relative' }}>
        <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:4 }} viewBox={`0 0 ${wrapW} ${wrapH}`}>
          {activeLines.map((line, i) => {
            const lbA = labelAnchor(line.labelId)
            const pt  = points.find(p => p.id===line.pointId)
            if (!lbA || !pt) return null
            const ptPx = ptToPx(pt); if (!ptPx) return null
            const lbIdx = labels.findIndex(l => l.id===line.labelId)
            const color = line.state==='pending' ? '#185FA5' : COLORS[lbIdx % COLORS.length]
            const mx = (lbA.x+ptPx.x)/2
            return (
              <g key={i}>
                <path d={`M${lbA.x},${lbA.y} C${mx},${lbA.y} ${mx},${ptPx.y} ${ptPx.x},${ptPx.y}`} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={line.state==='pending'?'5,3':undefined} />
                <circle cx={lbA.x}  cy={lbA.y}  r="5" fill={color} />
                <circle cx={ptPx.x} cy={ptPx.y} r="5" fill={color} />
              </g>
            )
          })}
          {selLabel !== null && (() => {
            const a = labelAnchor(selLabel)
            if (!a) return null
            return <line x1={a.x} y1={a.y} x2={a.x+28} y2={a.y} stroke="#185FA5" strokeWidth="2" strokeDasharray="4,3" strokeLinecap="round" />
          })()}
        </svg>

        <div className="label-col" style={{ display:'flex', flexDirection:'column', gap:6, width:120, flexShrink:0, zIndex:3 }}>
          {shuffledLabels.map((lb) => {
            const lbIdx   = labels.findIndex(l => l.id===lb.id)
            const baseColor = COLORS[lbIdx % COLORS.length]
            const line    = activeLines.find(l => l.labelId===lb.id)
            const done    = difficulty==='easy' && !!line
            const isWrong = wrongFlash===lb.id
            const isSel   = selLabel===lb.id
            const bg = isWrong ? '#E24B4A' : line ? (line.state==='pending' ? '#185FA5' : baseColor) : baseColor
            return (
              <div id={'lb-'+lb.id} key={lb.id} onClick={() => !done && clickLabel(lb.id)}
                style={{ padding:'8px 10px', borderRadius:'var(--radius-sm)', background: bg,
                  opacity: done ? 0.55 : 1, color:'#fff', fontWeight:600, fontSize:14,
                  cursor: done?'default':'pointer', textAlign:'center',
                  outline: isSel?'3px solid #fff':'none', outlineOffset:2,
                  transform: isSel?'scale(1.05)':'scale(1)', transition:'all 0.12s' }}>
                {lb.text}
              </div>
            )
          })}
        </div>

        <div style={{ flex:1, position:'relative', zIndex:2 }}>
          <img ref={imgRef} src={meta.imageDataUrl} alt="圖片"
            style={{ width:'100%', borderRadius:'var(--radius-md)', display:'block' }} onLoad={triggerRedraw} />
          {points.map(pt => {
            const line = activeLines.find(l => l.pointId===pt.id)
            const lbIdx  = line ? labels.findIndex(l => l.id===line.labelId) : -1
            const color  = line ? (line.state==='pending' ? '#185FA5' : (lbIdx>=0 ? COLORS[lbIdx % COLORS.length] : 'rgba(255,255,255,0.9)')) : 'rgba(255,255,255,0.9)'
            const showPulse = selLabel && !line
            return (
              <div key={pt.id} onClick={() => clickPoint(pt.id)}
                style={{ position:'absolute', left:`${pt.x}%`, top:`${pt.y}%`, transform:'translate(-50%,-50%)', zIndex:3, cursor:selLabel?'pointer':'default' }}>
                {showPulse && <div style={{ position:'absolute', inset:-6, borderRadius:'50%', border:'2px solid #185FA5', opacity:0.5, animation:'pulse 1s infinite' }} />}
                <div style={{ width:22, height:22, borderRadius:'50%', background:line?color:'rgba(0,0,0,0.3)',
                  border:`3px solid ${line?color:'#fff'}`, boxShadow:'0 2px 6px rgba(0,0,0,0.35)', transition:'all 0.15s',
                  transform: showPulse?'scale(1.2)':'scale(1)' }} />
              </div>
            )
          })}
        </div>
      </div>

      {difficulty === 'hard' && (
        <button className="btn-primary" onClick={checkAll} disabled={lines.length < pairs.length}
          style={{ width:'100%', padding:12, marginTop:'1rem' }}>
          確認答案（已連 {lines.length}/{pairs.length}）
        </button>
      )}

      <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.5);opacity:0.1}}`}</style>
    </div>
  )
}

function PointPlayer({ meta, difficulty, onFinish }) {
  const points = meta.points || []
  const pairs  = meta.pairs  || []
  const [lines,    setLines]    = useState([])   // { a, b, state: 'correct'|'wrong'|'pending' }
  const [selPt,    setSelPt]    = useState(null)
  const [mistakes, setMistakes] = useState(0)
  const imgRef  = useRef(null)
  const wrapRef = useRef(null)
  const [, redraw] = useState(0)
  const triggerRedraw = useCallback(() => redraw(n=>n+1), [])
  useEffect(() => { window.addEventListener('resize', triggerRedraw); return () => window.removeEventListener('resize', triggerRedraw) }, [])
  useEffect(() => { setTimeout(triggerRedraw, 80) }, [])

  const correctPairSet = useMemo(() => new Set(pairs.map(p=>`${p.a}|${p.b}`).concat(pairs.map(p=>`${p.b}|${p.a}`))), [])
  const activeLines     = lines.filter(l => l.state!=='wrong')  // 顯示用：簡單模式只會有 correct，困難模式是 pending

  function ptToPx(pt) {
    const img=imgRef.current, wrap=wrapRef.current; if(!img||!wrap) return null
    const ir=img.getBoundingClientRect(), wr=wrap.getBoundingClientRect()
    return { x:(pt.x/100)*ir.width+(ir.left-wr.left), y:(pt.y/100)*ir.height+(ir.top-wr.top) }
  }

  function clickPoint(id) {
    if (difficulty === 'hard') {
      if (!selPt) { setSelPt(id); return }
      if (selPt === id) { setSelPt(null); return }
      setLines(prev => [...prev.filter(l => l.a!==selPt && l.b!==selPt && l.a!==id && l.b!==id), { a:selPt, b:id, state:'pending' }])
      setSelPt(null)
      return
    }
    if (activeLines.some(l => l.a===id || l.b===id)) return
    if (!selPt) { setSelPt(id); return }
    if (selPt===id) { setSelPt(null); return }
    const isCorrect = correctPairSet.has(`${selPt}|${id}`)
    if (isCorrect) {
      const next = [...lines, { a:selPt, b:id, state:'correct' }]
      setLines(next); setSelPt(null)
      if (next.length === pairs.length) setTimeout(() => onFinish(pairs.length, pairs.length, mistakes), 400)
    } else {
      setMistakes(m=>m+1)
      const failA = selPt, failB = id
      setLines(prev => [...prev, { a:failA, b:failB, state:'wrong' }])
      setSelPt(null)
      setTimeout(() => setLines(prev => prev.filter(l => !(l.state==='wrong' && l.a===failA && l.b===failB))), 700)
    }
  }

  function checkAll() {
    let correct = 0
    lines.forEach(l => { if (correctPairSet.has(`${l.a}|${l.b}`)) correct++ })
    onFinish(correct, pairs.length, lines.length - correct)
  }

  const wrapW = wrapRef.current?.offsetWidth  || 600
  const wrapH = wrapRef.current?.offsetHeight || 400

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--c-text-muted)', marginBottom:6 }}>
        <span>已配對 {activeLines.length} / {pairs.length}</span>
        {difficulty==='easy'
          ? <span>錯誤 {mistakes} 次</span>
          : <span style={{ display:'inline-block', padding:'1px 8px', borderRadius:999, fontSize:11, fontWeight:500, background:'var(--c-warning-bg)', color:'var(--c-warning)' }}>困難</span>}
      </div>
      <div style={{ height:6, background:'var(--c-border)', borderRadius:999, overflow:'hidden', marginBottom:10 }}>
        <div style={{ height:'100%', background:'var(--c-success)', borderRadius:999, transition:'width 0.3s', width:`${(activeLines.length/pairs.length)*100}%` }} />
      </div>
      <p style={{ fontSize:13, color:'var(--c-text-hint)', textAlign:'center', marginBottom:8 }}>
        {selPt ? '點另一個定位點完成配對' : '點圖片上的定位點開始配對'}
      </p>
      <div ref={wrapRef} style={{ position:'relative' }}>
        <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:2 }} viewBox={`0 0 ${wrapW} ${wrapH}`}>
          {lines.map((line, i) => {
            const pa=points.find(p=>p.id===line.a), pb=points.find(p=>p.id===line.b)
            if(!pa||!pb) return null
            const a=ptToPx(pa), b=ptToPx(pb)
            if(!a||!b) return null
            const color = line.state==='correct' ? '#1D9E75' : line.state==='wrong' ? '#E24B4A' : '#185FA5'
            const mx=(a.x+b.x)/2
            return (
              <g key={i}>
                <path d={`M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={line.state!=='correct'?'5,3':undefined} />
                <circle cx={a.x} cy={a.y} r="4" fill={color} /><circle cx={b.x} cy={b.y} r="4" fill={color} />
              </g>
            )
          })}
        </svg>
        <img ref={imgRef} src={meta.imageDataUrl} alt="圖片" style={{ width:'100%', borderRadius:'var(--radius-md)', display:'block' }} onLoad={triggerRedraw} />
        {points.map((pt, i) => {
          const line = activeLines.find(l => l.a===pt.id || l.b===pt.id)
          const isSel = selPt===pt.id
          const color = line ? (line.state==='pending' ? '#185FA5' : '#1D9E75') : isSel ? '#185FA5' : 'rgba(0,0,0,0.4)'
          return (
            <div key={pt.id} onClick={() => clickPoint(pt.id)}
              style={{ position:'absolute', left:`${pt.x}%`, top:`${pt.y}%`, transform:'translate(-50%,-50%)', zIndex:3, cursor: difficulty==='easy' && line ? 'default' : 'pointer' }}>
              <div style={{ width:24, height:24, borderRadius:'50%', border:'3px solid #fff',
                background: color,
                boxShadow:'0 2px 6px rgba(0,0,0,0.3)', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center',
                transform: isSel?'scale(1.25)':'scale(1)' }}>
                <span style={{ fontSize:10, fontWeight:700, color:'#fff' }}>{i+1}</span>
              </div>
              {pt.label && <div style={{ position:'absolute', bottom:'calc(100% + 4px)', left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.7)', color:'#fff', fontSize:10, padding:'2px 6px', borderRadius:3, whiteSpace:'nowrap' }}>{pt.label}</div>}
            </div>
          )
        })}
      </div>
      {difficulty === 'hard' && (
        <button className="btn-primary" onClick={checkAll} disabled={lines.length < pairs.length}
          style={{ width:'100%', padding:12, marginTop:'1rem' }}>
          確認答案（已連 {lines.length}/{pairs.length}）
        </button>
      )}
    </div>
  )
}

export default function HotspotPlayer({ activity, onFinish, onRestart }) {
  if (!activity) return (
    <div className="card" style={{ textAlign:'center', padding:'2rem', color:'var(--c-text-muted)' }}>
      <i className="ti ti-alert-circle" style={{ fontSize:32 }} aria-hidden="true" />
      <p style={{ marginTop:8 }}>無法載入題目資料</p>
    </div>
  )
  const meta  = activity.meta || {}
  const mode  = meta.mode     || 'label'
  const difficulty = meta.difficulty || 'easy'
  const [finished,  setFinished]  = useState(false)
  const [mistakes,  setMistakes]  = useState(0)
  const [score,     setScore]     = useState(0)
  const [total,     setTotal]     = useState(0)

  function handleFinish(correct, tot, m) {
    setScore(correct); setTotal(tot); setMistakes(m); setFinished(true)
    if (onFinish) onFinish(correct, tot)
  }
  function handleRestart() {
    setFinished(false); setMistakes(0); setScore(0); setTotal(0)
    if (onRestart) onRestart()
  }

  if (finished) {
    return <ResultScreen score={score} total={total} mistakes={mistakes} onRestart={handleRestart} perfectMessage="全部配對正確！" />
  }

  if (mode==='label') return <LabelPlayer key="label" meta={meta} difficulty={difficulty} onFinish={handleFinish} />
  return <PointPlayer key="point" meta={meta} difficulty={difficulty} onFinish={handleFinish} />
}