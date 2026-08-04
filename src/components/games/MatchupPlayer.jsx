import { useState, useMemo } from 'react'
import ResultScreen from '../ResultScreen.jsx'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function MatchupPlayer({ activity, onFinish, onRestart }) {
  const items = (activity.items || []).filter(it => it.sentence && it.answer)
  const difficulty = activity.meta?.difficulty || 'easy'

  const wordBank = useMemo(() =>
    shuffle(items.map((it, i) => ({ id: i, text: it.answer, used: false })))
  , [])

  const [slots,     setSlots]     = useState({})
  const [dragging,  setDragging]  = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [checked,   setChecked]   = useState(false)
  const [mistakes,  setMistakes]  = useState(0)
  const [wrongSlot, setWrongSlot] = useState(null)

  const usedIds = new Set(Object.values(slots).filter(v => v !== null && v !== undefined))

  function flashWrong(itemIdx) {
    setMistakes(m => m + 1)
    setWrongSlot(itemIdx)
    setTimeout(() => setWrongSlot(null), 600)
  }

  function onDragStartWord(word) {
    setDragging({ id: word.id, text: word.text, fromSlot: null })
  }

  function onDragStartSlot(itemIdx, wordId, text) {
    if (difficulty === 'easy') return
    setDragging({ id: wordId, text, fromSlot: itemIdx })
  }

  function onDragOverSlot(e) { e.preventDefault() }

  function onDropSlot(itemIdx) {
    if (!dragging) return
    if (difficulty === 'easy') {
      if (slots[itemIdx] !== null && slots[itemIdx] !== undefined) { setDragging(null); return }
      if (dragging.text !== items[itemIdx].answer) {
        flashWrong(itemIdx)
        setDragging(null)
        return
      }
    }
    const newSlots = { ...slots }
    if (dragging.fromSlot !== null && dragging.fromSlot !== undefined) {
      newSlots[dragging.fromSlot] = null
    }
    newSlots[itemIdx] = dragging.id
    setSlots(newSlots)
    setDragging(null)
    setChecked(false)

    if (difficulty === 'easy') {
      const allDone = items.every((_, i) => newSlots[i] !== null && newSlots[i] !== undefined)
      if (allDone) setTimeout(() => handleSubmit(newSlots), 400)
    }
  }

  function onDropBank() {
    if (!dragging || dragging.fromSlot === null || dragging.fromSlot === undefined) { setDragging(null); return }
    const newSlots = { ...slots }
    newSlots[dragging.fromSlot] = null
    setSlots(newSlots)
    setDragging(null)
    setChecked(false)
  }

  const [tapping, setTapping] = useState(null)

  function tapWord(word) {
    if (checked) return
    setTapping(prev => prev?.id === word.id ? null : { id: word.id, text: word.text })
  }

  function tapSlot(itemIdx) {
    if (checked) return
    if (difficulty === 'easy' && slots[itemIdx] !== null && slots[itemIdx] !== undefined) return

    if (tapping) {
      if (difficulty === 'easy' && tapping.text !== items[itemIdx].answer) {
        flashWrong(itemIdx)
        setTapping(null)
        return
      }
      const newSlots = { ...slots, [itemIdx]: tapping.id }
      setSlots(newSlots)
      setTapping(null)
      setChecked(false)
      if (difficulty === 'easy') {
        const allDone = items.every((_, i) => newSlots[i] !== null && newSlots[i] !== undefined)
        if (allDone) setTimeout(() => handleSubmit(newSlots), 400)
      }
    } else if (slots[itemIdx] !== null && slots[itemIdx] !== undefined) {
      const wordId = slots[itemIdx]
      const word   = wordBank.find(w => w.id === wordId)
      setSlots(prev => ({ ...prev, [itemIdx]: null }))
      if (word) setTapping({ id: word.id, text: word.text })
    }
  }

  function handleSubmit(slotsOverride) {
    const finalSlots = slotsOverride || slots
    setChecked(true)
    setSubmitted(true)
    const correct = items.filter((it,i) => { const wid=finalSlots[i]; const word=wordBank.find(w=>w.id===wid); return word?.text===it.answer }).length
    if (onFinish) onFinish(correct, items.length)
  }

  function handleRestart() {
    setSlots({}); setChecked(false); setSubmitted(false); setDragging(null); setTapping(null)
    setMistakes(0); setWrongSlot(null)
    if (onRestart) onRestart()
  }

  const correctCount = items.filter((it, i) => {
    const wid  = slots[i]
    const word = wordBank.find(w => w.id === wid)
    return word?.text === it.answer
  }).length

  const allFilled = items.every((_, i) => slots[i] !== null && slots[i] !== undefined)

  function slotResult(itemIdx) {
    if (!checked) return null
    const wid  = slots[itemIdx]
    if (wid === null || wid === undefined) return 'empty'
    const word = wordBank.find(w => w.id === wid)
    return word?.text === items[itemIdx].answer ? 'correct' : 'wrong'
  }

  function slotText(itemIdx) {
    const wid = slots[itemIdx]
    if (wid === null || wid === undefined) return null
    return wordBank.find(w => w.id === wid)?.text
  }

  if (submitted) {
    return (
      <ResultScreen score={correctCount} total={items.length} mistakes={difficulty==='easy' ? mistakes : null} onRestart={handleRestart} perfectMessage="全部配對正確！">
        <div style={{ textAlign:'left', marginBottom:'1.5rem' }}>
          {items.map((item, idx) => {
            const text = slotText(idx)
            const ok = text === item.answer
            return (
              <div key={idx} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'7px 0', borderBottom:'1px solid var(--c-border)', fontSize:13 }}>
                <i className={`ti ti-${ok?'check':'x'}`} style={{ color: ok?'#1D9E75':'#E24B4A', flexShrink:0, marginTop:2 }} aria-hidden="true" />
                <span style={{ flex:1, textAlign:'left', color:'var(--c-text-muted)' }}>
                  {item.sentence.replace('___', `〔${text || '空'}〕`)}
                  {!ok && <span style={{ color:'#1D9E75' }}> → {item.answer}</span>}
                </span>
              </div>
            )
          })}
        </div>
      </ResultScreen>
    )
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--c-text-muted)', marginBottom:6 }}>
        <span>{difficulty==='easy' ? '拖對才會放進句子' : '全部填完再提交'}</span>
        {difficulty==='easy' && <span>錯誤 {mistakes} 次</span>}
      </div>
      <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={onDropBank}
          style={S.wordBank}>
          <p style={{ fontSize:12, color:'var(--c-text-hint)', marginBottom:8, fontWeight:500 }}>詞語</p>
          {wordBank.map(word => {
            const used   = usedIds.has(word.id)
            const isTap  = tapping?.id === word.id
            return (
              <div
                key={word.id}
                draggable={!used && !checked}
                onDragStart={() => !used && !checked && onDragStartWord(word)}
                onClick={() => !used && !checked && tapWord(word)}
                style={{
                  ...S.wordChip,
                  opacity:    used ? 0.3 : 1,
                  cursor:     used || checked ? 'default' : 'grab',
                  background: isTap ? 'var(--c-primary)' : 'var(--c-surface)',
                  color:      isTap ? '#fff' : 'var(--c-text)',
                  borderColor: isTap ? 'var(--c-primary)' : 'var(--c-border)',
                  fontWeight: isTap ? 600 : 500,
                }}>
                {word.text}
              </div>
            )
          })}
        </div>

        <div style={{ flex:1 }}>
          {items.map((item, idx) => {
            const parts  = item.sentence.split('___')
            const result = slotResult(idx)
            const text   = slotText(idx)
            const filled = text !== null && text !== undefined
            const isTapTarget = tapping && !filled
            const isWrongFlash = wrongSlot === idx

            let slotBg     = 'var(--c-bg)'
            let slotBorder = '2px dashed var(--c-border)'
            let slotColor  = 'var(--c-text-muted)'
            if (isWrongFlash)                          { slotBg='var(--c-danger-bg)';  slotBorder='2px solid var(--c-danger)';  slotColor='#791F1F' }
            else if (filled && difficulty === 'easy')  { slotBg='var(--c-success-bg)'; slotBorder='2px solid var(--c-success)'; slotColor='#27500A' }
            else if (filled && !checked)               { slotBg='var(--c-primary-bg)'; slotBorder='2px solid var(--c-primary)'; slotColor='#0C447C' }
            if (result==='correct') { slotBg='var(--c-success-bg)'; slotBorder='2px solid var(--c-success)'; slotColor='#27500A' }
            if (result==='wrong')   { slotBg='var(--c-danger-bg)';  slotBorder='2px solid var(--c-danger)';  slotColor='#791F1F' }
            if (isTapTarget)        { slotBorder='2px dashed var(--c-primary)' }

            const canDragOut = filled && !checked && difficulty !== 'easy'

            return (
              <div key={idx} style={S.sentenceRow}>
                <span style={{ fontSize:12, color:'var(--c-text-hint)', width:20, flexShrink:0, textAlign:'right' }}>{idx+1}</span>
                <p style={{ fontSize:15, lineHeight:1.8, flex:1 }}>
                  {parts[0]}
                  <span
                    draggable={canDragOut}
                    onDragStart={() => canDragOut && onDragStartSlot(idx, slots[idx], text)}
                    onDragOver={onDragOverSlot}
                    onDrop={() => onDropSlot(idx)}
                    onClick={() => tapSlot(idx)}
                    style={{
                      display:'inline-block', minWidth:80, padding:'2px 10px',
                      margin:'0 4px', borderRadius:'var(--radius-sm)',
                      background:slotBg, border:slotBorder, color:slotColor,
                      fontWeight:600, fontSize:14, cursor: checked?'default':canDragOut?'grab':'pointer',
                      verticalAlign:'middle', transition:'all 0.12s',
                      textAlign:'center',
                    }}>
                    {filled ? text : <span style={{ opacity:0.4, fontWeight:400, fontSize:12 }}>拖曳至此</span>}
                  </span>
                  {parts[1]}
                  {checked && result === 'wrong' && (
                    <span style={{ fontSize:12, color:'var(--c-success)', marginLeft:6, fontWeight:500 }}>
                      → {item.answer}
                    </span>
                  )}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {tapping && (
        <div style={{ padding:'8px 12px', background:'var(--c-primary-bg)', color:'#0C447C', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:500, marginTop:8, display:'flex', alignItems:'center', gap:6 }}>
          <i className="ti ti-hand-finger" aria-hidden="true" />
          「{tapping.text}」→ 點右側空格填入，或點其他詞語換選
        </div>
      )}

      <div style={{ display:'flex', gap:8, marginTop:'1rem' }}>
        <button className="btn-primary" onClick={() => handleSubmit()}
          disabled={!allFilled}
          style={{ flex:1, padding:12 }}>
          {allFilled ? '提交答案' : `還有 ${items.filter((_,i) => slots[i]===null||slots[i]===undefined).length} 格未填`}
        </button>
      </div>
    </div>
  )
}

const S = {
  wordBank: {
    width: 110, flexShrink:0,
    display:'flex', flexDirection:'column', gap:6,
    padding:'10px', background:'var(--c-bg)',
    borderRadius:'var(--radius-md)', border:'1px solid var(--c-border)',
    minHeight:100,
  },
  wordChip: {
    padding:'7px 10px', borderRadius:'var(--radius-sm)',
    border:'1.5px solid', fontSize:14, textAlign:'center',
    transition:'all 0.12s', userSelect:'none',
  },
  sentenceRow: {
    display:'flex', alignItems:'flex-start', gap:8,
    paddingBottom:8, marginBottom:8,
    borderBottom:'1px solid var(--c-border)',
  },
}