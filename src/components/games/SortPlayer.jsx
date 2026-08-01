import { useState, useMemo, useRef } from 'react'
import ResultScreen from '../ResultScreen.jsx'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]] }
  return a
}

export default function SortPlayer({ activity, onFinish, onRestart }) {
  const items      = activity.items || []
  const categories = activity.meta?.categories || []
  const difficulty = activity.meta?.difficulty || 'easy'
  const pool       = useMemo(() => shuffle(items.map((it, i) => ({ ...it, id: i }))), [])
  const initBuckets = Object.fromEntries(categories.map(c => [c, []]))
  const [buckets,     setBuckets]     = useState(initBuckets)
  const [remaining,   setRemaining]   = useState(pool.map(it => it.id))
  const [wrong,       setWrong]       = useState([])
  const [finished,    setFinished]    = useState(false)
  const [mistakes,    setMistakes]    = useState(0)
  const [dragOverCat, setDragOverCat] = useState(null)   // 目前拖到哪個分類框上方
  const totalPlaced = Object.values(buckets).flat().length
  const dragId = useRef(null)

  function dropInto(id, cat) {
    const item = pool.find(it => it.id===id)
    if (!item) return
    if (item.category === cat) {
      const next = { ...buckets, [cat]: [...buckets[cat], id] }
      setBuckets(next)
      setRemaining(prev => prev.filter(x => x!==id))
      if (totalPlaced+1 === items.length) setTimeout(() => { if(onFinish) onFinish(items.length-mistakes, items.length); setFinished(true) }, 400)
    } else {
      setMistakes(m => m+1)
      if (difficulty === 'easy') { setWrong([id]); setTimeout(() => setWrong([]), 700) }
    }
  }

  // ── 桌面：原生拖曳 ─────────────────────────────────────────
  function onDragStart(id) { dragId.current = id }
  function onDragEnd() { dragId.current = null; setDragOverCat(null) }
  function onDragOverCat(e, cat) { e.preventDefault(); setDragOverCat(cat) }
  function onDragLeaveCat(cat) { setDragOverCat(prev => prev===cat ? null : prev) }
  function onDropCat(e, cat) {
    e.preventDefault()
    setDragOverCat(null)
    if (dragId.current === null) return
    dropInto(dragId.current, cat)
    dragId.current = null
  }

  // ── 觸控：手動判斷放開時手指下方的分類 ───────────────────────
  function onTouchStart(id) { dragId.current = id }
  function onTouchMove(e) {
    if (dragId.current === null) return
    e.preventDefault()
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const cat = el?.closest('[data-cat]')?.dataset.cat
    setDragOverCat(cat || null)
  }
  function onTouchEnd() {
    if (dragId.current !== null && dragOverCat) dropInto(dragId.current, dragOverCat)
    dragId.current = null
    setDragOverCat(null)
  }

  function handleRestart() {
    setBuckets(Object.fromEntries(categories.map(c=>[c,[]])))
    setRemaining(pool.map(it=>it.id)); setWrong([]); setFinished(false); setMistakes(0)
    dragId.current = null; setDragOverCat(null)
    if (onRestart) onRestart()
  }

  if (finished) {
    return <ResultScreen score={items.length} total={items.length} mistakes={mistakes} onRestart={handleRestart} perfectMessage="分類完成！" mistakeLabel="分錯" />
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--c-text-muted)', marginBottom:6 }}>
        <span>已放入 {totalPlaced} / {items.length}</span><span>分錯 {mistakes} 次</span>
      </div>
      <div style={{ height:6, background:'var(--c-border)', borderRadius:999, overflow:'hidden', marginBottom:12 }}>
        <div style={{ height:'100%', background:'var(--c-primary)', borderRadius:999, transition:'width 0.3s', width:`${(totalPlaced/items.length)*100}%` }} />
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, minHeight:52, padding:10, background:'var(--c-bg)', borderRadius:'var(--radius-md)', marginBottom:4, border:'1px solid var(--c-border)' }}>
        {remaining.map(id => {
          const it = pool.find(p=>p.id===id)
          return (
            <div key={id} draggable
              onDragStart={() => onDragStart(id)}
              onDragEnd={onDragEnd}
              onTouchStart={() => onTouchStart(id)}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              style={{ padding:'7px 14px', border:`1.5px solid ${wrong.includes(id)?'var(--c-danger)':'var(--c-border)'}`, borderRadius:999,
                background: wrong.includes(id)?'var(--c-danger-bg)':'var(--c-surface)',
                color: wrong.includes(id)?'#791F1F':'var(--c-text)',
                fontSize:14, cursor:'grab', userSelect:'none', touchAction:'none', transition:'all 0.12s' }}>
              {it.text}
            </div>
          )
        })}
        {remaining.length===0 && <p style={{ color:'var(--c-text-hint)', fontSize:13 }}>所有詞語已放入分類</p>}
      </div>
      <p style={{ fontSize:13, color:'var(--c-text-hint)', textAlign:'center', margin:'8px 0 12px' }}>
        抓著詞語拖曳到下方對應的分類框
      </p>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(categories.length,3)},1fr)`, gap:10 }}>
        {categories.map(cat => (
          <div key={cat} data-cat={cat}
            onDragOver={e => onDragOverCat(e, cat)}
            onDragLeave={() => onDragLeaveCat(cat)}
            onDrop={e => onDropCat(e, cat)}
            style={{ border:`1.5px ${dragOverCat===cat?'solid':'dashed'} ${dragOverCat===cat?'var(--c-primary)':'var(--c-border)'}`,
              borderRadius:'var(--radius-md)', padding:10, minHeight:100,
              background:dragOverCat===cat?'var(--c-primary-bg)':'var(--c-surface)', transition:'all 0.12s' }}>
            <p style={{ fontSize:13, fontWeight:600, color:'var(--c-text-muted)', marginBottom:8, textAlign:'center' }}>{cat}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, minHeight:36 }}>
              {buckets[cat].map(id => {
                const it = pool.find(p=>p.id===id)
                return <span key={id} style={{ padding:'4px 10px', background:'var(--c-success-bg)', color:'#27500A', borderRadius:999, fontSize:13, border:'1px solid var(--c-success)' }}>{it?.text}</span>
              })}
            </div>
            <p style={{ fontSize:11, color:'var(--c-text-hint)', textAlign:'right', marginTop:6 }}>{buckets[cat].length} 個</p>
          </div>
        ))}
      </div>
    </div>
  )
}