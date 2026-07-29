import { useState, useMemo, useEffect, useRef, useCallback } from 'react'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const COLOR = { correct: '#1D9E75', wrong: '#E24B4A', pending: '#185FA5' }

export default function MatchPlayer({ activity, onFinish, onRestart }) {
  const items      = activity.items || []
  const difficulty = activity.meta?.difficulty || 'easy'

  const rightOrder = useMemo(() => shuffle(items.map((_, i) => i)), [])

  const [lines,    setLines]    = useState([])
  const [selLeft,  setSelLeft]  = useState(null)
  const [finished, setFinished] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const [, redraw] = useState(0)

  const arenaRef = useRef(null)

  // 視窗 resize 時重繪 SVG
  const triggerRedraw = useCallback(() => redraw(n => n + 1), [])
  useEffect(() => {
    window.addEventListener('resize', triggerRedraw)
    return () => window.removeEventListener('resize', triggerRedraw)
  }, [])

  // 初次 render 後等 DOM 穩定再算一次座標
  useEffect(() => { setTimeout(triggerRedraw, 50) }, [])

  function anchor(id, side) {
    const el  = document.getElementById(id)
    const box = arenaRef.current
    if (!el || !box) return null
    const er = el.getBoundingClientRect()
    const br = box.getBoundingClientRect()
    return {
      x: side === 'right' ? er.right - br.left : er.left - br.left,
      y: er.top  - br.top  + er.height / 2,
    }
  }

  function clickLeft(li) {
    if (finished) return
    if (lines.find(l => l.li === li && l.state === 'correct')) return
    setSelLeft(prev => prev === li ? null : li)
  }

  function clickRight(ri) {
    if (finished || selLeft === null) return
    if (lines.find(l => l.ri === ri && l.state === 'correct')) return
    const isCorrect = selLeft === ri

    if (difficulty === 'easy') {
      if (isCorrect) {
        setLines(prev => {
          const next = [...prev.filter(l => l.li !== selLeft && l.ri !== ri), { li: selLeft, ri, state: 'correct' }]
          if (next.filter(l => l.state === 'correct').length === items.length) setTimeout(() => { setFinished(true); if (onFinish) onFinish(items.length, items.length) }, 300)
          return next
        })
        setSelLeft(null)
      } else {
        setMistakes(m => m + 1)
        setLines(prev => [...prev.filter(l => l.li !== selLeft && l.ri !== ri), { li: selLeft, ri, state: 'wrong' }])
        setSelLeft(null)
        setTimeout(() => setLines(prev => prev.filter(l => l.state !== 'wrong')), 750)
      }
    } else {
      // 困難：允許任意連，覆蓋舊線
      setLines(prev => [...prev.filter(l => l.li !== selLeft && l.ri !== ri), { li: selLeft, ri, state: 'pending' }])
      setSelLeft(null)
    }
  }

  function checkAll() {
    const graded = lines.map(l => ({ ...l, state: l.li === l.ri ? 'correct' : 'wrong' }))
    const correct = graded.filter(l => l.state === 'correct').length
    setLines(graded)
    setMistakes(graded.filter(l => l.state === 'wrong').length)
    setFinished(true)
    if (onFinish) onFinish(correct, items.length)
  }

  function handleRestart() {
    setLines([]); setSelLeft(null); setFinished(false); setMistakes(0)
    if (onRestart) onRestart()
  }

  const correctCount = lines.filter(l => l.state === 'correct').length
  const arenaW = arenaRef.current?.offsetWidth  || 600
  const arenaH = arenaRef.current?.offsetHeight || 400

  // 完成畫面
  if (finished) {
    return (
      <div className="card" style={{ textAlign:'center', padding:'2rem' }}>
        <div style={{ fontSize:48, marginBottom:8 }}>{correctCount===items.length?'🎉':correctCount>=items.length*0.6?'👍':'💪'}</div>
        <p style={{ fontSize:20, fontWeight:500, marginBottom:4 }}>
          {correctCount===items.length ? '全部配對正確！' : `答對 ${correctCount} / ${items.length}`}
        </p>
        <p style={{ color:'var(--c-text-muted)', marginBottom:'1.25rem' }}>{mistakes===0?'零失誤！':`錯誤 ${mistakes} 次`}</p>
        {(difficulty==='hard' || correctCount<items.length) && (
          <div style={{ textAlign:'left', marginBottom:'1.25rem' }}>
            {items.map((item, i) => {
              const line = lines.find(l => l.li === i)
              const ok   = line?.state === 'correct'
              return (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom:'1px solid var(--c-border)', fontSize:13 }}>
                  <i className={`ti ti-${ok?'check':'x'}`} style={{ color: ok?'#1D9E75':'#E24B4A', flexShrink:0 }} aria-hidden="true" />
                  <span style={{ flex:1 }}>{item.left}</span>
                  <i className="ti ti-arrow-right" style={{ color:'var(--c-text-hint)', fontSize:12 }} aria-hidden="true" />
                  <span style={{ flex:1, color: ok?'#27500A':'var(--c-text-muted)' }}>
                    {ok ? item.right : (
                      <>{line ? <span style={{ color:'#E24B4A', textDecoration:'line-through' }}>{items[line.ri]?.right}</span> : '未連線'}{' → '}<span style={{ color:'#1D9E75' }}>{item.right}</span></>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )}
        <button className="btn-primary" onClick={handleRestart} style={{ padding:'10px 32px' }}>
          <i className="ti ti-refresh" aria-hidden="true" /> 再玩一次
        </button>
      </div>
    )
  }

  function chipStyle(state, isSel) {
    if (state === 'correct') return { borderColor:'#1D9E75', background:'var(--c-success-bg)', color:'#27500A' }
    if (state === 'wrong')   return { borderColor:'#E24B4A', background:'var(--c-danger-bg)',  color:'#791F1F' }
    if (isSel)               return { borderColor:'var(--c-primary)', background:'var(--c-primary-bg)', color:'#0C447C' }
    return {}
  }

  return (
    <div>
      {/* 進度 */}
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--c-text-muted)', marginBottom:6 }}>
        <span>已配對 {correctCount} / {items.length}</span>
        <span style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ display:'inline-block', padding:'1px 8px', borderRadius:999, fontSize:11, fontWeight:500, background: difficulty==='easy'?'var(--c-success-bg)':'var(--c-warning-bg)', color: difficulty==='easy'?'#27500A':'var(--c-warning)' }}>
            {difficulty==='easy'?'簡單':'困難'}
          </span>
          錯誤 {mistakes} 次
        </span>
      </div>
      <div style={{ height:6, background:'var(--c-border)', borderRadius:999, overflow:'hidden', marginBottom:4 }}>
        <div style={{ height:'100%', background:'var(--c-success)', borderRadius:999, transition:'width 0.3s', width:`${(correctCount/items.length)*100}%` }} />
      </div>

      <p style={{ fontSize:13, color:'var(--c-text-hint)', textAlign:'center', margin:'8px 0 10px' }}>
        {selLeft !== null ? `「${items[selLeft].left}」→ 點右側答案連線` : '點左側，再點右側配對'}
      </p>

      {/* 配對區 */}
      <div ref={arenaRef} style={{ position:'relative' }}>
        {/* SVG 連線層 */}
        <svg style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:2 }}
          viewBox={`0 0 ${arenaW} ${arenaH}`}>
          {lines.map((line, i) => {
            const a = anchor(`LChip-${line.li}`, 'right')
            const b = anchor(`RChip-${line.ri}`, 'left')
            if (!a || !b) return null
            const col = COLOR[line.state] || COLOR.pending
            const mx  = (a.x + b.x) / 2
            return (
              <g key={i}>
                <path d={`M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`}
                  fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round"
                  strokeDasharray={line.state==='wrong'?'5,3':undefined} />
                <circle cx={a.x} cy={a.y} r="4" fill={col} />
                <circle cx={b.x} cy={b.y} r="4" fill={col} />
              </g>
            )
          })}
          {/* 選中後的 stub */}
          {selLeft !== null && (() => {
            const a = anchor(`LChip-${selLeft}`, 'right')
            if (!a) return null
            return <line x1={a.x} y1={a.y} x2={a.x+28} y2={a.y} stroke={COLOR.pending} strokeWidth="2" strokeDasharray="4,3" strokeLinecap="round" />
          })()}
        </svg>

        {/* 左右兩欄 */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, position:'relative', zIndex:1 }}>
          {/* 左欄 */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {items.map((item, li) => {
              const line  = lines.find(l => l.li === li)
              const state = line?.state
              const isSel = selLeft === li
              return (
                <div key={li} id={`LChip-${li}`} onClick={() => clickLeft(li)}
                  style={{ display:'inline-flex', alignItems:'center', padding:'10px 14px',
                    border:'1.5px solid var(--c-border)', borderRadius:'var(--radius-md)',
                    background:'var(--c-surface)', fontSize:14, lineHeight:1.5,
                    wordBreak:'break-word', alignSelf:'stretch', userSelect:'none',
                    cursor: state==='correct' ? 'default' : 'pointer',
                    transition:'all 0.12s', ...chipStyle(state, isSel) }}>
                  {state==='correct' && <i className="ti ti-check" style={{ color:'#1D9E75', marginRight:6, fontSize:13, flexShrink:0 }} aria-hidden="true" />}
                  {item.left}
                </div>
              )
            })}
          </div>
          {/* 右欄（打亂） */}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {rightOrder.map(ri => {
              const line  = lines.find(l => l.ri === ri)
              const state = line?.state
              return (
                <div key={ri} id={`RChip-${ri}`} onClick={() => clickRight(ri)}
                  style={{ display:'inline-flex', alignItems:'center', padding:'10px 14px',
                    border:'1.5px solid var(--c-border)', borderRadius:'var(--radius-md)',
                    background:'var(--c-surface)', fontSize:14, lineHeight:1.5,
                    wordBreak:'break-word', alignSelf:'stretch', userSelect:'none',
                    cursor: state==='correct' ? 'default' : selLeft!==null ? 'pointer' : 'default',
                    transition:'all 0.12s', ...chipStyle(state, false) }}>
                  {state==='correct' && <i className="ti ti-check" style={{ color:'#1D9E75', marginRight:6, fontSize:13, flexShrink:0 }} aria-hidden="true" />}
                  {items[ri].right}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 困難模式確認按鈕 */}
      {difficulty === 'hard' && (
        <button className="btn-primary" onClick={checkAll} disabled={lines.length < items.length}
          style={{ width:'100%', padding:12, marginTop:'1rem' }}>
          確認答案（已連 {lines.length}/{items.length}）
        </button>
      )}
    </div>
  )
}
