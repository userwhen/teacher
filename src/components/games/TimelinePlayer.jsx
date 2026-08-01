import { useState, useMemo, useRef } from 'react'
import ResultScreen from '../ResultScreen.jsx'

function shuffle(arr) {
  const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]} return a
}

export default function TimelinePlayer({ activity, onFinish, onRestart }) {
  const items   = activity.items || []
  const correct = useMemo(() => [...items].sort((a,b)=>a.order-b.order).map(it=>it.text), [])
  const [order, setOrder]       = useState(() => shuffle(correct))
  const [checked, setChecked]   = useState(false)
  const [finished, setFinished] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const dragIdx = useRef(null)

  function onDragStart(idx) { dragIdx.current=idx }
  function onDragOver(e, idx) {
    e.preventDefault()
    if(dragIdx.current===null||dragIdx.current===idx) return
    const next=[...order]; const[moved]=next.splice(dragIdx.current,1); next.splice(idx,0,moved)
    dragIdx.current=idx; setOrder(next); setChecked(false)
  }
  function onDragEnd() { dragIdx.current=null }

  const touchItemIdx=useRef(null)
  function onTouchStart(e,idx){touchItemIdx.current=idx}
  function onTouchMove(e){
    e.preventDefault()
    if(touchItemIdx.current===null) return
    const el=document.elementFromPoint(e.touches[0].clientX,e.touches[0].clientY)
    const target=el?.closest('[data-idx]')
    if(!target) return
    const toIdx=parseInt(target.dataset.idx)
    if(isNaN(toIdx)||toIdx===touchItemIdx.current) return
    const next=[...order];const[moved]=next.splice(touchItemIdx.current,1);next.splice(toIdx,0,moved)
    touchItemIdx.current=toIdx; setOrder(next); setChecked(false)
  }
  function onTouchEnd(){touchItemIdx.current=null}

  function handleCheck() {
    const ok=order.every((text,i)=>text===correct[i])
    setChecked(true)
    if(ok) setTimeout(()=>{ if(onFinish) onFinish(1,1); setFinished(true) },600)
    else setMistakes(m=>m+1)
  }

  function handleRestart() { setOrder(shuffle(correct)); setChecked(false); setFinished(false); setMistakes(0); if (onRestart) onRestart() }

  if(finished) return (
    <ResultScreen score={items.length} total={items.length} mistakes={mistakes} onRestart={handleRestart}
      perfectMessage="排序正確！" perfectSubtitle="一次就排對了！" mistakeLabel="嘗試錯誤">
      <div style={{ textAlign:'left', marginBottom:'1.5rem' }}>
        {correct.map((text,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--c-border)' }}>
            <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--c-primary-bg)', color:'var(--c-primary)', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{i+1}</div>
            <span style={{ fontSize:14 }}>{text}</span>
          </div>
        ))}
      </div>
    </ResultScreen>
  )

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--c-text-muted)', marginBottom:8 }}>
        <span>拖曳排出正確順序</span><span>嘗試 {mistakes} 次</span>
      </div>
      {checked && !order.every((t,i)=>t===correct[i]) && (
        <div style={{ padding:'8px 12px', background:'var(--c-danger-bg)', color:'#791F1F', borderRadius:'var(--radius-sm)', fontSize:13, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
          <i className="ti ti-alert-triangle" aria-hidden="true" /> 順序還不對，再調整看看！
        </div>
      )}
      <div style={{ userSelect:'none' }}>
        {order.map((text, i) => {
          const isCorrect = checked && text===correct[i]
          const isWrong   = checked && text!==correct[i]
          return (
            <div key={text} data-idx={i} draggable
              onDragStart={()=>onDragStart(i)} onDragOver={e=>onDragOver(e,i)} onDragEnd={onDragEnd}
              onTouchStart={e=>onTouchStart(e,i)} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px',
                border:`1.5px solid ${isCorrect?'var(--c-success)':isWrong?'var(--c-danger)':'var(--c-border)'}`,
                borderRadius:'var(--radius-md)', background:isCorrect?'var(--c-success-bg)':isWrong?'var(--c-danger-bg)':'var(--c-surface)',
                marginBottom:8, cursor:'grab', transition:'all 0.12s' }}>
              <span style={{ color:'var(--c-text-hint)', fontSize:16, flexShrink:0 }}><i className="ti ti-grip-vertical" aria-hidden="true" /></span>
              <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--c-bg)', border:'1px solid var(--c-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--c-text-muted)', flexShrink:0 }}>{i+1}</div>
              <span style={{ flex:1, fontSize:15 }}>{text}</span>
              {isCorrect && <i className="ti ti-check" style={{ color:'var(--c-success)', fontSize:16 }} aria-hidden="true" />}
              {isWrong   && <i className="ti ti-x"     style={{ color:'var(--c-danger)',  fontSize:16 }} aria-hidden="true" />}
            </div>
          )
        })}
      </div>
      <button className="btn-primary" onClick={handleCheck} style={{ width:'100%', padding:12, marginTop:'1rem' }}>確認順序</button>
    </div>
  )
}
