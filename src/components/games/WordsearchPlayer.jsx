import { useState, useMemo, useRef } from 'react'
import ResultScreen from '../ResultScreen.jsx'

// ── 字格生成 ─────────────────────────────────────────────────
const DIRS = [
  [0, 1], [1, 0], [0, -1], [-1, 0],   // 橫、直、反橫、反直
  [1, 1], [1, -1], [-1, 1], [-1, -1], // 斜四方向
]

function buildGrid(words, size) {
  const grid   = Array.from({ length: size }, () => new Array(size).fill(''))
  const placed = []  // [{ word, cells: [{r,c}] }]

  const shuffled = [...words].sort(() => Math.random() - 0.5)

  for (const word of shuffled) {
    let success = false
    const triedDirs = [...DIRS].sort(() => Math.random() - 0.5)
    outer:
    for (let attempt = 0; attempt < 200; attempt++) {
      const [dr, dc] = triedDirs[attempt % triedDirs.length]
      const r0 = Math.floor(Math.random() * size)
      const c0 = Math.floor(Math.random() * size)
      const cells = []
      let ok = true
      for (let i = 0; i < word.length; i++) {
        const r = r0 + dr * i, c = c0 + dc * i
        if (r < 0 || r >= size || c < 0 || c >= size) { ok = false; break }
        if (grid[r][c] !== '' && grid[r][c] !== word[i]) { ok = false; break }
        cells.push({ r, c })
      }
      if (ok) {
        cells.forEach(({ r, c }, i) => { grid[r][c] = word[i] })
        placed.push({ word, cells })
        success = true
        break outer
      }
    }
    if (!success) placed.push({ word, cells: [] }) // 放不進去就跳過
  }

  // 填滿空格：從答案本身的文字抽字當干擾，跟真詞混在一起更難分辨
  const pool = words.join('').split('')
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = pool[Math.floor(Math.random() * pool.length)]
      }
    }
  }

  return { grid, placed }
}

// ── 選取範圍計算 ──────────────────────────────────────────────
function getCellsBetween(r1, c1, r2, c2) {
  const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1)
  if (dr !== 0 && dc !== 0 && Math.abs(r2 - r1) !== Math.abs(c2 - c1)) return []
  const cells = []
  let r = r1, c = c1
  while (true) {
    cells.push({ r, c })
    if (r === r2 && c === c2) break
    r += dr; c += dc
    if (cells.length > 30) break
  }
  return cells
}

function cellKey(r, c) { return `${r},${c}` }

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function isImageUrl(s) { return typeof s === 'string' && /^https?:\/\//i.test(s) }

function Hearts({ total, remaining }) {
  return (
    <div style={{ display:'flex', gap:3 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ fontSize:15, opacity: i < remaining ? 1 : 0.2, transition:'opacity 0.3s' }}>❤️</span>
      ))}
    </div>
  )
}

// ── 主元件 ───────────────────────────────────────────────────
export default function WordsearchPlayer({ activity, onFinish, onRestart }) {
  const meta        = activity.meta || {}
  const rawWordsAll = meta.words   || []
  const rawMatchesAll = meta.matches || []

  const validIdx  = useMemo(() => rawWordsAll.map((w, i) => i).filter(i => rawWordsAll[i].trim().length >= 2), [])
  const rawWords  = useMemo(() => validIdx.map(i => rawWordsAll[i]), [])
  const rawMatches = useMemo(() => validIdx.map(i => rawMatchesAll[i]), [])
  const wordMatchMap = useMemo(() => Object.fromEntries(rawWords.map((w, i) => [w, (rawMatches[i] || '').trim() || w])), [])

  const showHint  = meta.showHint !== false           // 預設顯示提示
  const matchMode = !!meta.matchMode                  // 預設關閉配對模式
  const maxHearts = Math.min(9, Math.max(1, meta.hearts || 5))
  // 手機／平板友善：簡單 10、中等／困難 12（避免格子太小）
  const rawTier   = meta.gridSize || 14
  const gridTier  = rawTier <= 10 ? 10 : 12

  const size = useMemo(() => {
    const wordMax = Math.max(...rawWords.map(w => w.length), 0)
    return Math.min(12, Math.max(gridTier, wordMax + 2))
  }, [gridTier, rawWords])
  const { grid, placed } = useMemo(() => buildGrid(rawWords, size), [rawWords, size])
  const validPlaced = placed.filter(p => p.cells.length > 0)

  const [found,        setFound]        = useState(new Set())
  const [finished,     setFinished]     = useState(false)
  const [gameOver,     setGameOver]     = useState(false)
  const [mistakes,     setMistakes]     = useState(0)
  const [hearts,       setHearts]       = useState(maxHearts)
  const [pendingMatch, setPendingMatch] = useState(null)
  const [wrongOption,  setWrongOption]  = useState(null)

  const [dragStart, setDragStart] = useState(null)
  const [dragEnd,   setDragEnd]   = useState(null)
  const [wrongCells, setWrongCells] = useState([])
  const isSelecting = useRef(false)

  const selectedCells = useMemo(() => {
    if (!dragStart || !dragEnd) return []
    return getCellsBetween(dragStart.r, dragStart.c, dragEnd.r, dragEnd.c)
  }, [dragStart, dragEnd])

  const selectedKeys = useMemo(() => new Set(selectedCells.map(c => cellKey(c.r, c.c))), [selectedCells])

  const foundCellMap = useMemo(() => {
    const map = {}
    placed.forEach(p => {
      if (found.has(p.word)) p.cells.forEach(({ r, c }) => { map[cellKey(r, c)] = p.word })
    })
    return map
  }, [found])

  const shuffledMatches = useMemo(() => shuffle(rawWords.map(w => wordMatchMap[w])), [])
  const usedMatches = useMemo(() => new Set([...found].map(w => wordMatchMap[w])), [found])

  function loseHeart() {
    setMistakes(m => m + 1)
    setHearts(h => {
      const nh = h - 1
      if (nh <= 0) { setGameOver(true); if (onFinish) onFinish(found.size, validPlaced.length) }
      return nh
    })
  }

  function finishGame(count) {
    setFinished(true)
    if (onFinish) onFinish(count, validPlaced.length)
  }

  function confirmSelection() {
    if (gameOver || finished) { resetDrag(); return }
    if (selectedCells.length < 2) { resetDrag(); return }
    const selected = selectedCells.map(({ r, c }) => grid[r][c]).join('')
    const selectedRev = [...selected].reverse().join('')

    const match = placed.find(p =>
      !found.has(p.word) && (p.word === selected || p.word === selectedRev)
    )

    if (match) {
      if (matchMode) {
        setPendingMatch(match.word)
      } else {
        const next = new Set([...found, match.word])
        setFound(next)
        if (next.size === validPlaced.length) setTimeout(() => finishGame(next.size), 400)
      }
    } else {
      loseHeart()
      setWrongCells(selectedCells.map(c => cellKey(c.r, c.c)))
      setTimeout(() => setWrongCells([]), 600)
    }
    resetDrag()
  }

  function pickMatchOption(val) {
    if (!pendingMatch) return
    if (val === wordMatchMap[pendingMatch]) {
      const next = new Set([...found, pendingMatch])
      setFound(next)
      setPendingMatch(null)
      if (next.size === validPlaced.length) setTimeout(() => finishGame(next.size), 400)
    } else {
      loseHeart()
      setWrongOption(val)
      setTimeout(() => setWrongOption(null), 600)
    }
  }

  function resetDrag() {
    setDragStart(null); setDragEnd(null); isSelecting.current = false
  }

  // ── 滑鼠事件 ─────────────────────────────────────────────
  function onMouseDown(r, c) {
    if (gameOver || finished || pendingMatch) return
    isSelecting.current = true
    setDragStart({ r, c }); setDragEnd({ r, c })
  }
  function onMouseEnter(r, c) {
    if (!isSelecting.current) return
    setDragEnd({ r, c })
  }
  function onMouseUp() {
    if (isSelecting.current) confirmSelection()
  }

  // ── 觸控事件 ─────────────────────────────────────────────
  const gridRef = useRef(null)
  function cellFromTouch(e) {
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    if (!el) return null
    const r = parseInt(el.dataset.r), c = parseInt(el.dataset.c)
    if (isNaN(r) || isNaN(c)) return null
    return { r, c }
  }
  function onTouchStart(e) {
    if (gameOver || finished || pendingMatch) return
    const cell = cellFromTouch(e)
    if (!cell) return
    isSelecting.current = true
    setDragStart(cell); setDragEnd(cell)
  }
  function onTouchMove(e) {
    e.preventDefault()
    if (!isSelecting.current) return
    const cell = cellFromTouch(e)
    if (cell) setDragEnd(cell)
  }
  function onTouchEnd() {
    if (isSelecting.current) confirmSelection()
  }

  function handleRestart() {
    setFound(new Set()); setFinished(false); setGameOver(false); setMistakes(0)
    setHearts(maxHearts); setPendingMatch(null); setWrongOption(null)
    resetDrag()
    if (onRestart) onRestart()
  }

  if (finished || gameOver) {
    return (
      <ResultScreen score={found.size} total={validPlaced.length} mistakes={gameOver ? null : mistakes} onRestart={handleRestart}
        failed={gameOver} failMessage="愛心用完了" perfectMessage="所有詞語都找到了！" mistakeLabel="嘗試錯誤" scoreLabel="找到" />
    )
  }

  // 每格的背景色
  function cellBg(r, c) {
    const key = cellKey(r, c)
    if (wrongCells.includes(key))     return '#FCEBEB'
    if (foundCellMap[key])            return '#EAF3DE'
    if (selectedKeys.has(key))        return '#E6F1FB'
    return 'var(--c-surface)'
  }
  function cellColor(r, c) {
    const key = cellKey(r, c)
    if (wrongCells.includes(key))  return '#E24B4A'
    if (foundCellMap[key])         return '#1D9E75'
    if (selectedKeys.has(key))     return '#185FA5'
    return 'var(--c-text)'
  }
  function cellBorder(r, c) {
    const key = cellKey(r, c)
    if (wrongCells.includes(key))  return '1.5px solid #E24B4A'
    if (selectedKeys.has(key))     return '1.5px solid #185FA5'
    return '1px solid var(--c-border)'
  }

  const isChinese = rawWords.some(w => /[\u4e00-\u9fff]/.test(w))
  // 手機友善：用 CSS 變數讓格子自適應容器，最小約 28px
  const cellMin = isChinese ? 30 : 26

  return (
    <div className="play-shell">
      {/* 進度 / 愛心 */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, color:'var(--c-text-muted)', marginBottom:6 }}>
        <span>已找到 {found.size} / {validPlaced.length} 個詞</span>
        <Hearts total={maxHearts} remaining={hearts} />
      </div>
      <div style={{ height:6, background:'var(--c-border)', borderRadius:999, overflow:'hidden', marginBottom:12 }}>
        <div style={{ height:'100%', background:'var(--c-success)', borderRadius:999, transition:'width 0.3s', width:`${(found.size/validPlaced.length)*100}%` }} />
      </div>

      {/* 詞語清單（提示） */}
      {showHint && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
          {validPlaced.map(p => (
            <span key={p.word} style={{
              padding:'4px 10px', borderRadius:999, fontSize:13, fontWeight:500,
              border: `1.5px solid ${found.has(p.word) ? 'var(--c-success)' : 'var(--c-border)'}`,
              background: found.has(p.word) ? 'var(--c-success-bg)' : 'var(--c-surface)',
              color: found.has(p.word) ? '#27500A' : 'var(--c-text)',
              textDecoration: found.has(p.word) ? 'line-through' : 'none',
              transition:'all 0.2s',
            }}>
              {found.has(p.word) && <i className="ti ti-check" style={{ fontSize:11, marginRight:3 }} aria-hidden="true" />}
              {p.word}
            </span>
          ))}
        </div>
      )}

      {/* 配對模式：找到詞語後的提示 */}
      {matchMode && pendingMatch && (
        <p style={{ fontSize:13, fontWeight:500, color:'var(--c-primary)', textAlign:'center', marginBottom:8 }}>
          找到「{pendingMatch}」了！點右邊對應的內容
        </p>
      )}

      {/* 字格 + 配對面板：直向堆疊、橫向並排 */}
      <div className="ws-layout" style={{ display:'flex', gap:12, alignItems:'flex-start', flexWrap:'wrap' }}>
        <div className="ws-grid-wrap" style={{ flex:'1 1 auto', minWidth:0 }}>
          <div
            ref={gridRef}
            onMouseLeave={() => { if(isSelecting.current) confirmSelection() }}
            onMouseUp={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              display:'grid',
              gridTemplateColumns:`repeat(${size}, minmax(${cellMin}px, 1fr))`,
              gap:2,
              userSelect:'none',
              cursor:'crosshair',
              padding:4,
              width:'100%',
              maxWidth: `min(100%, ${size * 40}px)`,
              margin:'0 auto',
              touchAction:'none',
            }}
          >
            {grid.map((row, r) =>
              row.map((char, c) => (
                <div
                  key={`${r}-${c}`}
                  data-r={r} data-c={c}
                  onMouseDown={() => onMouseDown(r, c)}
                  onMouseEnter={() => onMouseEnter(r, c)}
                  style={{
                    aspectRatio:'1',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize: isChinese ? 15 : 13,
                    fontWeight: 500,
                    borderRadius: 4,
                    background: cellBg(r, c),
                    color: cellColor(r, c),
                    border: cellBorder(r, c),
                    transition:'background 0.08s, color 0.08s',
                    pointerEvents:'auto',
                    minHeight: cellMin,
                  }}
                >
                  {char}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右側：配對內容（配對模式才顯示） */}
        {matchMode && (
          <div style={{ display:'flex', flexDirection:'column', gap:6, width:120, flexShrink:0, maxWidth:'100%' }}>
            <p style={{ fontSize:11, color:'var(--c-text-hint)', textAlign:'center', marginBottom:2 }}>對應內容</p>
            {shuffledMatches.map((opt, i) => {
              const isUsed  = usedMatches.has(opt)
              const isWrong = wrongOption === opt
              return (
                <div key={i} onClick={() => !isUsed && pickMatchOption(opt)}
                  className="tap-target"
                  style={{
                    padding:7, borderRadius:'var(--radius-sm)', textAlign:'center',
                    cursor: isUsed ? 'default' : 'pointer',
                    opacity: isUsed ? 0.45 : 1,
                    border: `1.5px solid ${isWrong ? 'var(--c-danger)' : isUsed ? 'var(--c-success)' : 'var(--c-border)'}`,
                    background: isWrong ? 'var(--c-danger-bg)' : isUsed ? 'var(--c-success-bg)' : 'var(--c-surface)',
                    transition:'all 0.12s',
                  }}>
                  {isImageUrl(opt)
                    ? <img src={opt} alt="" style={{ width:'100%', height:50, objectFit:'cover', borderRadius:4 }} />
                    : <span style={{ fontSize:13 }}>{opt}</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p style={{ fontSize:12, color:'var(--c-text-hint)', textAlign:'center', marginTop:8 }}>
        {showHint ? '拖曳選取隱藏的詞語（橫、直、斜方向）' : '沒有提示，靠自己找出隱藏的詞語！'}
      </p>
    </div>
  )
}