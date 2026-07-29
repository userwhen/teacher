import { useState, useMemo } from 'react'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]] }
  return a
}

export default function SortPlayer({ activity, onFinish, onRestart }) {
  const items      = activity.items || []
  const categories = activity.meta?.categories || []
  const pool       = useMemo(() => shuffle(items.map((it, i) => ({ ...it, id: i }))), [])
  const initBuckets = Object.fromEntries(categories.map(c => [c, []]))
  const [buckets,   setBuckets]   = useState(initBuckets)
  const [remaining, setRemaining] = useState(pool.map(it => it.id))
  const [selected,  setSelected]  = useState(null)
  const [wrong,     setWrong]     = useState([])
  const [finished,  setFinished]  = useState(false)
  const [mistakes,  setMistakes]  = useState(0)
  const totalPlaced = Object.values(buckets).flat().length

  function pickItem(id) { setSelected(selected===id?null:id); setWrong([]) }

  function dropIntoBucket(cat) {
    if (selected===null) return
    const item = pool.find(it => it.id===selected)
    if (!item) return
    if (item.category === cat) {
      const next = { ...buckets, [cat]: [...buckets[cat], selected] }
      setBuckets(next); setRemaining(prev => prev.filter(id => id!==selected)); setSelected(null)
      if (totalPlaced+1 === items.length) setTimeout(() => { if(onFinish) onFinish(items.length-mistakes, items.length); setFinished(true) }, 400)
    } else {
      setMistakes(m => m+1); setWrong([selected])
      setTimeout(() => { setWrong([]); setSelected(null) }, 700)
    }
  }

  function handleRestart() {
    setBuckets(Object.fromEntries(categories.map(c=>[c,[]])))
    setRemaining(pool.map(it=>it.id)); setSelected(null); setWrong([]); setFinished(false); setMistakes(0)
    if (onRestart) onRestart()
  }

  if (finished) return (
    <div className="card" style={{ textAlign:'center', padding:'2.5rem 1rem' }}>
      <div style={{ fontSize:48, marginBottom:8 }}>{mistakes===0?'🎉':mistakes<=3?'👍':'💪'}</div>
      <p style={{ fontSize:20, fontWeight:500, marginBottom:4 }}>分類完成！</p>
      <p style={{ color:'var(--c-text-muted)', marginBottom:'1.5rem' }}>{mistakes===0?'零失誤，太厲害了！':`分錯 ${mistakes} 次`}</p>
      <button className="btn-primary" onClick={handleRestart} style={{ padding:'10px 32px' }}>
        <i className="ti ti-refresh" aria-hidden="true" /> 再玩一次
      </button>
    </div>
  )

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
            <div key={id} onClick={() => pickItem(id)}
              style={{ padding:'7px 14px', border:`1.5px solid ${wrong.includes(id)?'var(--c-danger)':selected===id?'var(--c-primary)':'var(--c-border)'}`, borderRadius:999,
                background: wrong.includes(id)?'var(--c-danger-bg)':selected===id?'var(--c-primary-bg)':'var(--c-surface)',
                color: wrong.includes(id)?'#791F1F':selected===id?'#0C447C':'var(--c-text)',
                fontSize:14, cursor:'pointer', userSelect:'none', transition:'all 0.12s', fontWeight:selected===id?500:400 }}>
              {it.text}
            </div>
          )
        })}
        {remaining.length===0 && <p style={{ color:'var(--c-text-hint)', fontSize:13 }}>所有詞語已放入分類</p>}
      </div>
      <p style={{ fontSize:13, color:'var(--c-text-hint)', textAlign:'center', margin:'8px 0 12px' }}>
        {selected!==null ? `「${pool.find(p=>p.id===selected)?.text}」→ 點下方分類放入` : '點選詞語，再點分類桶放入'}
      </p>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(categories.length,3)},1fr)`, gap:10 }}>
        {categories.map(cat => (
          <div key={cat} onClick={() => dropIntoBucket(cat)}
            style={{ border:`1.5px ${selected!==null?'solid':'dashed'} ${selected!==null?'var(--c-primary)':'var(--c-border)'}`,
              borderRadius:'var(--radius-md)', padding:10, minHeight:100, cursor:selected!==null?'pointer':'default',
              background:selected!==null?'var(--c-primary-bg)':'var(--c-surface)', transition:'all 0.12s' }}>
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
