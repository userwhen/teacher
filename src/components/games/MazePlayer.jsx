import { useState, useEffect, useRef, useCallback } from 'react'

const COLS = 11
const ROWS = 11
const CELL = 36

// ── 迷宮生成（recursive backtracking） ───────────────────────
function generateMaze(cols, rows) {
  const walls = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ top: true, left: true, right: true, bottom: true }))
  )
  const visited = Array.from({ length: rows }, () => new Array(cols).fill(false))

  function carve(r, c) {
    visited[r][c] = true
    const dirs = [[0,1,'right','left'],[0,-1,'left','right'],[1,0,'bottom','top'],[-1,0,'top','bottom']]
    dirs.sort(() => Math.random() - 0.5)
    for (const [dr, dc, wa, wb] of dirs) {
      const nr = r + dr, nc = c + dc
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || visited[nr][nc]) continue
      walls[r][c][wa] = false
      walls[nr][nc][wb] = false
      carve(nr, nc)
    }
  }
  carve(0, 0)
  return walls
}

// ── BFS 找最短路徑長度 ────────────────────────────────────────
function bfsPathLength(walls, startR, startC, endR, endC) {
  const q = [[startR, startC, 0]]
  const seen = new Set([`${startR},${startC}`])
  while (q.length) {
    const [r, c, d] = q.shift()
    if (r === endR && c === endC) return d
    const moves = [
      [-1,0,'top'],[1,0,'bottom'],[0,-1,'left'],[0,1,'right']
    ]
    for (const [dr, dc, wall] of moves) {
      if (walls[r][c][wall]) continue
      const key = `${r+dr},${c+dc}`
      if (!seen.has(key)) { seen.add(key); q.push([r+dr, c+dc, d+1]) }
    }
  }
  return Infinity
}

export default function MazePlayer({ activity }) {
  const items = activity.items || []
  const canvasRef = useRef(null)

  const [phase, setPhase] = useState('intro') // intro | playing | question | win | lose
  const [qIdx, setQIdx]   = useState(0)
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null) // 'correct' | 'wrong'
  const [score, setScore]  = useState(0)
  const [mistakes, setMistakes] = useState(0)

  // 迷宮狀態（ref，避免 canvas 重繪觸發 re-render）
  const mazeRef     = useRef(null)
  const playerRef   = useRef({ r: 0, c: 0 })
  const chasersRef  = useRef([])  // [{ r, c }]
  const exitRef     = useRef({ r: ROWS - 1, c: COLS - 1 })
  const chaseTimer  = useRef(null)

  // 初始化迷宮
  function initMaze() {
    const walls = generateMaze(COLS, ROWS)
    mazeRef.current  = walls
    playerRef.current  = { r: 0, c: 0 }
    chasersRef.current = [{ r: ROWS - 1, c: 0 }, { r: 0, c: COLS - 1 }]
    exitRef.current    = { r: ROWS - 1, c: COLS - 1 }
  }

  // 畫迷宮
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !mazeRef.current) return
    const ctx = canvas.getContext('2d')
    const W = COLS * CELL, H = ROWS * CELL
    ctx.clearRect(0, 0, W, H)

    const walls = mazeRef.current
    ctx.strokeStyle = '#b4b2a9'
    ctx.lineWidth   = 2

    // 格子
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * CELL, y = r * CELL
        ctx.beginPath()
        if (walls[r][c].top)    { ctx.moveTo(x, y);        ctx.lineTo(x + CELL, y) }
        if (walls[r][c].left)   { ctx.moveTo(x, y);        ctx.lineTo(x, y + CELL) }
        if (walls[r][c].bottom) { ctx.moveTo(x, y + CELL); ctx.lineTo(x + CELL, y + CELL) }
        if (walls[r][c].right)  { ctx.moveTo(x + CELL, y); ctx.lineTo(x + CELL, y + CELL) }
        ctx.stroke()
      }
    }

    // 終點
    const ex = exitRef.current
    ctx.fillStyle = '#EAF3DE'
    ctx.fillRect(ex.c * CELL + 2, ex.r * CELL + 2, CELL - 4, CELL - 4)
    ctx.font = `${CELL * 0.6}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🏁', ex.c * CELL + CELL / 2, ex.r * CELL + CELL / 2)

    // 追兵
    chasersRef.current.forEach(ch => {
      ctx.fillStyle = '#E24B4A'
      const cx2 = ch.c * CELL + CELL / 2, cy2 = ch.r * CELL + CELL / 2
      ctx.beginPath()
      ctx.arc(cx2, cy2, CELL * 0.35, 0, Math.PI * 2)
      ctx.fill()
      ctx.font = `${CELL * 0.45}px serif`
      ctx.fillText('👾', cx2, cy2)
    })

    // 玩家
    const p = playerRef.current
    const px = p.c * CELL + CELL / 2, py = p.r * CELL + CELL / 2
    ctx.beginPath()
    ctx.arc(px, py, CELL * 0.38, 0, Math.PI * 2)
    ctx.fillStyle = '#185FA5'
    ctx.fill()
    ctx.font = `${CELL * 0.5}px serif`
    ctx.fillText('🧑', px, py)
  }, [])

  // 追兵移動（BFS 一步）
  function moveChaser(ch) {
    const walls = mazeRef.current
    const p = playerRef.current
    const moves = [[-1,0,'top'],[1,0,'bottom'],[0,-1,'left'],[0,1,'right']]
    let best = null, bestDist = Infinity
    for (const [dr, dc, wall] of moves) {
      if (walls[ch.r][ch.c][wall]) continue
      const nr = ch.r + dr, nc = ch.c + dc
      const d = bfsPathLength(walls, nr, nc, p.r, p.c)
      if (d < bestDist) { bestDist = d; best = { r: nr, c: nc } }
    }
    return best || ch
  }

  function tickChasers() {
    chasersRef.current = chasersRef.current.map(ch => moveChaser(ch))
    draw()
    // 碰到玩家 → 答題
    const p = playerRef.current
    const caught = chasersRef.current.some(ch => ch.r === p.r && ch.c === p.c)
    if (caught) {
      clearInterval(chaseTimer.current)
      setPhase('question')
    }
  }

  function startChaseTimer() {
    clearInterval(chaseTimer.current)
    chaseTimer.current = setInterval(tickChasers, 1200)
  }

  // 玩家移動
  function movePlayer(dr, dc) {
    if (phase !== 'playing') return
    const p = playerRef.current
    const walls = mazeRef.current
    const wallMap = {
      '-10': 'top', '10': 'bottom', '0-1': 'left', '01': 'right'
    }
    const key = `${dr}${dc}`
    if (walls[p.r][p.c][wallMap[key]]) return
    playerRef.current = { r: p.r + dr, c: p.c + dc }
    draw()
    // 到終點
    const ex = exitRef.current
    if (playerRef.current.r === ex.r && playerRef.current.c === ex.c) {
      clearInterval(chaseTimer.current)
      setPhase('win')
      return
    }
    // 答題觸發（每移動 N 步觸發一題）— 這裡改為：玩家主動走到追兵也觸發
  }

  // 鍵盤
  useEffect(() => {
    const handler = (e) => {
      const map = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] }
      if (map[e.key]) { e.preventDefault(); movePlayer(...map[e.key]) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [phase])

  // 開始遊戲
  function startGame() {
    initMaze()
    setPhase('playing')
    setQIdx(0)
    setScore(0)
    setMistakes(0)
    setFeedback(null)
  }

  useEffect(() => {
    if (phase === 'playing') {
      draw()
      startChaseTimer()
      // 一開始先問一題
      setTimeout(() => {
        clearInterval(chaseTimer.current)
        setPhase('question')
      }, 800)
    }
    return () => clearInterval(chaseTimer.current)
  }, [phase === 'playing'])

  // 答題
  function handleAnswer(optIdx) {
    if (selected !== null) return
    setSelected(optIdx)
    const item = items[qIdx % items.length]
    const correct = optIdx === item.answerIndex
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) setScore(s => s + 1)
    else setMistakes(m => m + 1)

    setTimeout(() => {
      setSelected(null)
      setFeedback(null)
      setQIdx(i => i + 1)
      if (correct) {
        // 答對：追兵後退一步（重生到遠角）
        const ex = exitRef.current
        chasersRef.current = [
          { r: 0, c: 0 },
          { r: ex.r, c: 0 },
        ]
      }
      setPhase('playing')
    }, 1000)
  }

  const item = items[qIdx % items.length]

  // ── 渲染 ──────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏃</div>
        <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>迷宮追逐</p>
        <p style={{ color: 'var(--c-text-muted)', fontSize: 14, marginBottom: '1.5rem', lineHeight: 1.6 }}>
          用方向鍵移動角色，逃離追兵！<br />
          被追上時要回答問題，答對追兵退後，答錯追兵繼續追。<br />
          到達 🏁 終點就過關！
        </p>
        <button className="btn-primary" onClick={startGame} style={{ padding: '12px 40px', fontSize: 16 }}>
          開始遊戲
        </button>
      </div>
    )
  }

  if (phase === 'win') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>🎉</div>
        <p style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>成功逃脫！</p>
        <p style={{ color: 'var(--c-text-muted)', marginBottom: '1.5rem' }}>
          答對 {score} 題 · 答錯 {mistakes} 題
        </p>
        <button className="btn-primary" onClick={startGame} style={{ padding: '10px 32px' }}>
          <i className="ti ti-refresh" aria-hidden="true" /> 再玩一次
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* 迷宮畫布 */}
      {phase === 'playing' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 6 }}>
            <span>✓ 答對 {score}</span>
            <span>✗ 答錯 {mistakes}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <canvas
              ref={canvasRef}
              width={COLS * CELL}
              height={ROWS * CELL}
              style={{ display: 'block', border: '1px solid var(--c-border)', borderRadius: 'var(--radius-md)' }}
            />
          </div>
          {/* 行動按鈕（手機用） */}
          <div style={styles.dpad}>
            <div />
            <button style={styles.dpadBtn} onClick={() => movePlayer(-1, 0)}>▲</button>
            <div />
            <button style={styles.dpadBtn} onClick={() => movePlayer(0, -1)}>◀</button>
            <div />
            <button style={styles.dpadBtn} onClick={() => movePlayer(0, 1)}>▶</button>
            <div />
            <button style={styles.dpadBtn} onClick={() => movePlayer(1, 0)}>▼</button>
            <div />
          </div>
          <p style={{ fontSize: 12, color: 'var(--c-text-hint)', textAlign: 'center', marginTop: 4 }}>
            鍵盤方向鍵或點上方按鈕移動
          </p>
        </div>
      )}

      {/* 答題 */}
      {phase === 'question' && item && (
        <div>
          <div style={styles.caughtBanner}>
            <i className="ti ti-alert-triangle" aria-hidden="true" /> 被追上了！回答問題才能繼續
          </div>
          <div className="card" style={{ marginBottom: '0.75rem' }}>
            <p style={{ fontSize: 17, fontWeight: 500 }}>{item.question}</p>
          </div>
          {item.options.map((opt, optIdx) => {
            let bg = 'var(--c-surface)', border = 'var(--c-border)', color = 'var(--c-text)'
            if (feedback) {
              if (optIdx === item.answerIndex) { bg = 'var(--c-success-bg)'; border = 'var(--c-success)'; color = '#27500A' }
              else if (optIdx === selected)    { bg = 'var(--c-danger-bg)';  border = 'var(--c-danger)';  color = '#791F1F' }
            } else if (selected === optIdx) {
              bg = 'var(--c-primary-bg)'; border = 'var(--c-primary)'; color = '#0C447C'
            }
            return (
              <div
                key={optIdx}
                onClick={() => handleAnswer(optIdx)}
                style={{ ...styles.option, background: bg, borderColor: border, color, cursor: selected !== null ? 'default' : 'pointer' }}
              >
                <span style={{ ...styles.optLetter, borderColor: border, color }}>{['A','B','C','D'][optIdx]}</span>
                {opt}
              </div>
            )
          })}
          {feedback && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 500,
              marginTop: 8, display: 'flex', alignItems: 'center', gap: 6,
              background: feedback === 'correct' ? 'var(--c-success-bg)' : 'var(--c-danger-bg)',
              color:      feedback === 'correct' ? '#27500A' : '#791F1F',
            }}>
              <i className={`ti ti-${feedback === 'correct' ? 'circle-check' : 'circle-x'}`} aria-hidden="true" />
              {feedback === 'correct' ? '答對！追兵後退，繼續逃！' : `答錯了，正確是「${item.options[item.answerIndex]}」`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  dpad: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 44px)',
    gridTemplateRows: 'repeat(3, 44px)',
    gap: 4,
    margin: '10px auto 0',
    width: 'fit-content',
  },
  dpadBtn: {
    width: 44,
    height: 44,
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    borderRadius: 'var(--radius-sm)',
    background: 'var(--c-surface)',
  },
  caughtBanner: {
    padding: '10px 14px',
    background: 'var(--c-danger-bg)',
    color: '#791F1F',
    borderRadius: 'var(--radius-md)',
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    border: '1.5px solid',
    borderRadius: 'var(--radius-md)',
    marginBottom: 8,
    transition: 'all 0.12s',
    fontSize: 15,
    userSelect: 'none',
  },
  optLetter: {
    width: 26, height: 26,
    borderRadius: '50%',
    border: '1.5px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
}
