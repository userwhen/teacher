import { useState, useRef } from 'react'
import ResultScreen from '../ResultScreen.jsx'

export default function FillPlayer({ activity, onFinish, onRestart }) {
  const items = activity.items || []
  const difficulty = activity.meta?.difficulty || 'easy'
  const [current, setCurrent]   = useState(0)
  const [input, setInput]       = useState('')
  const [status, setStatus]     = useState(null)
  const [score, setScore]       = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [finished, setFinished] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const inputRef = useRef(null)
  const item   = items[current]
  const parts  = item.sentence.split('___')
  const reveal = status && difficulty === 'easy'

  function handleCheck() {
    if (!input.trim()) return
    const correct = input.trim().toLowerCase() === item.answer.trim().toLowerCase()
    setStatus(correct ? 'correct' : 'wrong')
    if (correct) setScore(s=>s+1); else setMistakes(m=>m+1)
  }

  function handleNext() {
    if (current+1 >= items.length) { if (onFinish) onFinish(score, items.length); setFinished(true) }
    else { setCurrent(c=>c+1); setInput(''); setStatus(null); setShowHint(false); setTimeout(()=>inputRef.current?.focus(),50) }
  }

  function handleRestart() {
    setCurrent(0); setInput(''); setStatus(null); setScore(0); setMistakes(0); setFinished(false); setShowHint(false)
    if (onRestart) onRestart()
  }

  if (finished) {
    return <ResultScreen score={score} total={items.length} mistakes={mistakes} onRestart={handleRestart} />
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--c-text-muted)', marginBottom:6 }}>
        <span>題目 {current+1} / {items.length}</span><span>✓ {score} 題</span>
      </div>
      <div style={{ height:6, background:'var(--c-border)', borderRadius:999, overflow:'hidden', marginBottom:16 }}>
        <div style={{ height:'100%', background:'var(--c-primary)', borderRadius:999, transition:'width 0.3s', width:`${(current/items.length)*100}%` }} />
      </div>
      <div className="card" style={{ fontSize:18, lineHeight:2, marginBottom:'0.75rem' }}>
        {parts[0]}
        <input ref={inputRef} type="text" value={input} autoFocus
          onChange={e => { if (status===null) setInput(e.target.value) }}
          onKeyDown={e => { if(e.key==='Enter'){ if(status===null) handleCheck(); else handleNext() } }}
          placeholder="填入答案"
          style={{ display:'inline-block', width:140, padding:'4px 10px',
            border:`2px solid ${reveal ? (status==='correct'?'var(--c-success)':'var(--c-danger)') : 'var(--c-primary)'}`,
            borderRadius:'var(--radius-sm)', fontSize:17, fontWeight:500, margin:'0 6px', textAlign:'center', outline:'none', transition:'all 0.15s',
            background: reveal ? (status==='correct'?'var(--c-success-bg)':'var(--c-danger-bg)') : 'var(--c-primary-bg)',
            color: reveal ? (status==='correct'?'#27500A':'#791F1F') : 'var(--c-text)' }} />
        {parts[1]}
      </div>
      {item.hint && !showHint && <button onClick={() => setShowHint(true)} style={{ fontSize:13, padding:'4px 10px', marginBottom:8 }}><i className="ti ti-bulb" aria-hidden="true" /> 顯示提示</button>}
      {item.hint && showHint && <div style={{ padding:'7px 12px', background:'var(--c-warning-bg)', color:'var(--c-warning)', borderRadius:'var(--radius-sm)', fontSize:13, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}><i className="ti ti-bulb" aria-hidden="true" /> {item.hint}</div>}
      {reveal && (
        <div style={{ padding:'10px 14px', borderRadius:'var(--radius-md)', fontSize:14, fontWeight:500, display:'flex', alignItems:'center', gap:6,
          background: status==='correct'?'var(--c-success-bg)':'var(--c-danger-bg)', color: status==='correct'?'#27500A':'#791F1F' }}>
          <i className={`ti ti-${status==='correct'?'circle-check':'circle-x'}`} aria-hidden="true" />
          {status==='correct' ? '答對了！' : `答案是「${item.answer}」`}
        </div>
      )}
      <div style={{ marginTop:'1rem' }}>
        {!status
          ? <button className="btn-primary" onClick={handleCheck} disabled={!input.trim()} style={{ width:'100%', padding:12 }}>確認答案</button>
          : <button className="btn-primary" onClick={handleNext} style={{ width:'100%', padding:12 }}>{current+1>=items.length?'查看結果':'下一題'} <i className="ti ti-arrow-right" aria-hidden="true" /></button>
        }
      </div>
    </div>
  )
}