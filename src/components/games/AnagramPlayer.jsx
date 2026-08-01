import { useState, useMemo } from 'react'
import ResultScreen from '../ResultScreen.jsx'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  // 避免和原字串相同
  if (a.join('') === arr.join('') && a.length > 1) {
    [a[0], a[a.length - 1]] = [a[a.length - 1], a[0]]
  }
  return a
}

export default function AnagramPlayer({ activity, onFinish, onRestart }) {
  const items = (activity.items || []).filter(it => it.answer?.length >= 2)
  const difficulty = activity.meta?.difficulty || 'easy'

  const [current, setCurrent]   = useState(0)
  const [score,   setScore]     = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [finished, setFinished] = useState(false)
  const [status,  setStatus]    = useState(null) // null | 'correct' | 'wrong'

  const item = items[current]

  // 打亂的字母陣列，每個元素 { char, id, used }
  const scrambled = useMemo(() => {
    if (!item) return []
    return shuffle(item.answer.split('')).map((ch, i) => ({ ch, id: i, used: false }))
  }, [current])

  // 學生點選的順序 [{ ch, id }]
  const [picked, setPicked] = useState([])

  // 初始化每題重置 picked
  useMemo(() => { setPicked([]); setStatus(null) }, [current])

  function pickTile(tile) {
    if (status || tile.used) return
    const next = [...picked, tile]
    setPicked(next)

    const composed = next.map(t => t.ch).join('')
    const answer   = item.answer

    if (composed.length === answer.length) {
      // 長度夠了，判斷對錯
      if (composed === answer) {
        setStatus('correct')
        setScore(s => s + 1)
        setTimeout(() => goNext(), 900)
      } else {
        setStatus('wrong')
        setMistakes(m => m + 1)
        setTimeout(() => { setPicked([]); setStatus(null) }, 800)
      }
    }
  }

  function unpickLast() {
    if (!picked.length || status) return
    setPicked(prev => prev.slice(0, -1))
  }

  function goNext() {
    if (current + 1 >= items.length) {
      if (onFinish) onFinish(score + 1, items.length)
      setFinished(true)
    } else {
      setCurrent(c => c + 1)
    }
  }

  function handleRestart() {
    setCurrent(0); setScore(0); setMistakes(0)
    setFinished(false); setPicked([]); setStatus(null)
    if (onRestart) onRestart()
  }

  if (finished) {
    return <ResultScreen score={score} total={items.length} mistakes={mistakes} onRestart={handleRestart} />
  }

  if (!item) return (
    <div className="card" style={{ textAlign:'center', padding:'2rem', color:'var(--c-text-muted)' }}>
      <p>沒有有效題目</p>
    </div>
  )

  const pickedIds = new Set(picked.map(t => t.id))
  const composed  = picked.map(t => t.ch).join('')
  const showResult = difficulty === 'easy' ? status : null

  return (
    <div>
      {/* 進度 */}
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--c-text-muted)', marginBottom:6 }}>
        <span>題目 {current + 1} / {items.length}</span>
        <span>✓ {score} 題</span>
      </div>
      <div style={{ height:6, background:'var(--c-border)', borderRadius:999, overflow:'hidden', marginBottom:16 }}>
        <div style={{ height:'100%', background:'var(--c-primary)', borderRadius:999, transition:'width 0.3s', width:`${(current/items.length)*100}%` }} />
      </div>

      {/* 提示 */}
      <div className="card" style={{ marginBottom:'1rem', textAlign:'center' }}>
        <p style={{ fontSize:17, fontWeight:500, lineHeight:1.5 }}>
          {item.hint || '重新排列下方字母拼出正確答案'}
        </p>
      </div>

      {/* 答案槽：學生點選後出現的格子 */}
      <div style={styles.answerRow}>
        {item.answer.split('').map((_, i) => {
          const t = picked[i]
          let bg = 'var(--c-bg)', border = '2px dashed var(--c-border)', color = 'var(--c-text)'
          if (t) {
            if (showResult === 'correct') { bg = 'var(--c-success-bg)'; border = '2px solid var(--c-success)'; color = '#27500A' }
            else if (showResult === 'wrong') { bg = 'var(--c-danger-bg)'; border = '2px solid var(--c-danger)'; color = '#791F1F' }
            else { bg = 'var(--c-primary-bg)'; border = '2px solid var(--c-primary)'; color = '#0C447C' }
          }
          return (
            <div key={i} style={{ ...styles.slot, background:bg, borderColor: border.includes('solid') ? border.split('solid ')[1] : 'var(--c-border)', border, color }}>
              {t?.ch || ''}
            </div>
          )
        })}
        {/* 退一格按鈕 */}
        {picked.length > 0 && !status && (
          <button onClick={unpickLast}
            style={{ marginLeft:8, padding:'0 10px', fontSize:18, color:'var(--c-text-muted)', border:'1px solid var(--c-border)', borderRadius:'var(--radius-sm)', background:'var(--c-surface)', cursor:'pointer', height:44 }}>
            ⌫
          </button>
        )}
      </div>

      {/* 回饋 */}
      {showResult && (
        <div style={{
          padding:'10px 14px', borderRadius:'var(--radius-md)', fontSize:14, fontWeight:500,
          marginBottom:12, display:'flex', alignItems:'center', gap:6,
          background: showResult==='correct' ? 'var(--c-success-bg)' : 'var(--c-danger-bg)',
          color:      showResult==='correct' ? '#27500A' : '#791F1F',
        }}>
          <i className={`ti ti-${showResult==='correct'?'circle-check':'circle-x'}`} aria-hidden="true" />
          {showResult === 'correct' ? '答對了！' : '順序不對，再試一次'}
        </div>
      )}

      {/* 打亂的字母磚 */}
      <div style={styles.tilesRow}>
        {scrambled.map(tile => {
          const used = pickedIds.has(tile.id)
          return (
            <div key={tile.id} onClick={() => !used && !status && pickTile(tile)}
              style={{
                ...styles.tile,
                opacity:    used ? 0.25 : 1,
                cursor:     used || status ? 'default' : 'pointer',
                background: used ? 'var(--c-bg)' : '#2c2c2a',
                color:      used ? 'var(--c-border)' : '#fff',
                transform:  used ? 'scale(0.92)' : 'scale(1)',
                boxShadow:  used ? 'none' : '0 3px 6px rgba(0,0,0,0.25)',
              }}>
              {tile.ch}
            </div>
          )
        })}
      </div>

      <p style={{ fontSize:12, color:'var(--c-text-hint)', textAlign:'center', marginTop:8 }}>
        依序點擊字母磚拼出正確答案
      </p>
    </div>
  )
}

const styles = {
  answerRow: {
    display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center',
    marginBottom:12, minHeight:52, alignItems:'center',
  },
  slot: {
    width:44, height:44, borderRadius:'var(--radius-sm)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:18, fontWeight:700, transition:'all 0.12s',
  },
  tilesRow: {
    display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center',
    padding:'12px', background:'var(--c-bg)',
    borderRadius:'var(--radius-md)', border:'1px solid var(--c-border)',
    minHeight:68,
  },
  tile: {
    width:44, height:44, borderRadius:'var(--radius-sm)',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:18, fontWeight:700, transition:'all 0.15s',
    userSelect:'none',
  },
}