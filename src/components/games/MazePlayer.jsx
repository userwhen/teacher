import { useState, useEffect, useRef, useCallback } from 'react'
import ResultScreen from '../ResultScreen.jsx'

// ── 常數 ─────────────────────────────────────────────────────
const COLS = 15
const ROWS = 15
const CELL = 32

// 6 個房間：中心格座標（入口方向改成每次隨機，見 getActiveRooms）
const ROOM_DEFS = [
  { r: 3,  c: 3  },  // 左上
  { r: 3,  c: 11 },  // 右上
  { r: 11, c: 3  },  // 左下
  { r: 11, c: 11 },  // 右下
  { r: 3,  c: 7  },  // 中上
  { r: 11, c: 7  },  // 中下
]

const PLAYER_START = { r: 7, c: 7 }

// 怪物候選起點（走廊區，遠離角落和中心）
const ENEMY_CANDIDATES = [
  { r: 1, c: 5 }, { r: 1, c: 9 },
  { r: 5, c: 1 }, { r: 9, c: 1 },
  { r: 5, c: 13 }, { r: 9, c: 13 },
  { r: 13, c: 5 }, { r: 13, c: 9 },
  { r: 5, c: 5 }, { r: 5, c: 9 },
  { r: 9, c: 5 }, { r: 9, c: 9 },
]

const CHASE_RADIUS = 5

// 穿越通道：上下互通的欄、左右互通的列（固定位置，不與房間衝突）
const TUNNEL_COLS = [4, 10]   // c=4, c=10 上下穿越
const TUNNEL_ROWS = [4, 10]   // r=4, r=10 左右穿越
const DIRS_DEF = [
  [-1, 0, 'top',    'bottom'],
  [ 1, 0, 'bottom', 'top'   ],
  [ 0,-1, 'left',   'right' ],
  [ 0, 1, 'right',  'left'  ],
]

// ── 迷宮生成 ─────────────────────────────────────────────────
function makeWalls() {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ top: true, bottom: true, left: true, right: true }))
  )
}

function removeWall(walls, r, c, dir) {
  const opp = { top:'bottom', bottom:'top', left:'right', right:'left' }
  const delta = { top:[-1,0], bottom:[1,0], left:[0,-1], right:[0,1] }
  const [dr, dc] = delta[dir]
  const nr = r + dr, nc = c + dc
  if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return
  walls[r][c][dir] = false
  walls[nr][nc][opp[dir]] = false
}

function inBounds(r, c) { return r >= 0 && r < ROWS && c >= 0 && c < COLS }

// 房間佔用的格子集合（3×3）
function roomCells(room) {
  const cells = new Set()
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++)
      cells.add(`${room.r+dr},${room.c+dc}`)
  return cells
}

function generateMaze(activeRooms) {
  const walls   = makeWalls()
  const visited = Array.from({ length: ROWS }, () => new Array(COLS).fill(false))

  // 標記所有房間格子為已訪問（carve 不進去）
  const allRoomCells = new Set()
  for (const room of activeRooms) {
    for (const key of roomCells(room)) {
      allRoomCells.add(key)
      const [r, c] = key.split(',').map(Number)
      if (inBounds(r, c)) visited[r][c] = true
    }
  }

  // 先打通每個房間內部（3×3 全打通）
  for (const room of activeRooms) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = room.r + dr, c = room.c + dc
        if (!inBounds(r, c)) continue
        if (dc < 1 && inBounds(r, c+1) && allRoomCells.has(`${r},${c+1}`)) removeWall(walls, r, c, 'right')
        if (dr < 1 && inBounds(r+1, c) && allRoomCells.has(`${r+1},${c}`)) removeWall(walls, r, c, 'bottom')
      }
    }
  }

  // Recursive backtracking — 只在非房間格走
  function carve(r, c) {
    visited[r][c] = true
    const dirs = [...DIRS_DEF].sort(() => Math.random() - 0.5)
    for (const [dr, dc, wa, wb] of dirs) {
      const nr = r + dr, nc = c + dc
      if (!inBounds(nr, nc) || visited[nr][nc]) continue
      walls[r][c][wa] = false
      walls[nr][nc][wb] = false
      carve(nr, nc)
    }
  }

  // 從玩家起點開始 carve
  carve(PLAYER_START.r, PLAYER_START.c)

  // 確保所有走廊格都被 carve 到（防止孤立格）
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!visited[r][c]) carve(r, c)
    }
  }

  // 打通每個房間的入口（房間邊緣 → 外側走廊格）
  for (const room of activeRooms) {
    const entryMap = {
      right: { wallR: room.r, wallC: room.c + 1, dir: 'right' },
      left:  { wallR: room.r, wallC: room.c - 1, dir: 'left'  },
      down:  { wallR: room.r + 1, wallC: room.c, dir: 'bottom'},
      up:    { wallR: room.r - 1, wallC: room.c, dir: 'top'   },
    }
    const e = entryMap[room.entry]
    if (inBounds(e.wallR, e.wallC)) {
      removeWall(walls, e.wallR, e.wallC, e.dir)
    }
  }

  // 打通穿越通道（邊界格子的外牆）
  for (const c of TUNNEL_COLS) {
    // 上邊界 row=0 的 top 牆 和 下邊界 row=ROWS-1 的 bottom 牆 互通（邏輯上：移動時 wrap）
    walls[0][c].top        = false
    walls[ROWS-1][c].bottom = false
  }
  for (const r of TUNNEL_ROWS) {
    walls[r][0].left         = false
    walls[r][COLS-1].right   = false
  }

  return walls
}

// 依難度拆牆（增加開放路線；數值調高讓地圖整體更開闊）
function knockWalls(walls, difficulty, allRoomCells) {
  const rate = difficulty === 'easy' ? 0.5 : difficulty === 'normal' ? 0.32 : 0.25
  const dirs = ['right', 'bottom']
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (allRoomCells.has(`${r},${c}`)) continue
      for (const dir of dirs) {
        if (!walls[r][c][dir]) continue
        const [dr, dc] = dir === 'right' ? [0,1] : [1,0]
        const nr = r+dr, nc = c+dc
        if (!inBounds(nr, nc)) continue
        if (allRoomCells.has(`${nr},${nc}`)) continue
        if (Math.random() < rate) removeWall(walls, r, c, dir)
      }
    }
  }
}

// 消除整張地圖的死路：每個走廊格至少要有 2 個出口（房間內部不受影響，
// 房間本來就全部打通）。在 knockWalls() 之後跑，等於做一次完整補強。
function eliminateDeadEnds(walls, allRoomCells) {
  const dirs = [
    ['top',    -1, 0, 'bottom'],
    ['bottom',  1, 0, 'top'   ],
    ['left',    0,-1, 'right' ],
    ['right',   0, 1, 'left'  ],
  ]
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (allRoomCells.has(`${r},${c}`)) continue
      let openCount = dirs.filter(([dir]) => !walls[r][c][dir]).length
      if (openCount >= 2) continue

      const closedDirs = dirs.filter(([dir]) => walls[r][c][dir]).sort(() => Math.random() - 0.5)
      for (const [dir, dr, dc, opp] of closedDirs) {
        if (openCount >= 2) break
        const nr = r + dr, nc = c + dc
        if (!inBounds(nr, nc)) continue
        if (allRoomCells.has(`${nr},${nc}`)) continue
        walls[r][c][dir]   = false
        walls[nr][nc][opp] = false
        openCount++
      }
    }
  }
}

// ── BFS ──────────────────────────────────────────────────────
function bfsPath(walls, sr, sc, er, ec) {
  if (sr === er && sc === ec) return []
  const q    = [{ r: sr, c: sc, path: [] }]
  const seen = new Set([`${sr},${sc}`])
  while (q.length) {
    const { r, c, path } = q.shift()
    for (const [dr, dc, wall] of [[-1,0,'top'],[1,0,'bottom'],[0,-1,'left'],[0,1,'right']]) {
      if (walls[r][c][wall]) continue
      const nr = r+dr, nc = c+dc
      if (!inBounds(nr, nc)) continue
      const key = `${nr},${nc}`
      if (seen.has(key)) continue
      seen.add(key)
      const np = [...path, { r: nr, c: nc }]
      if (nr === er && nc === ec) return np
      q.push({ r: nr, c: nc, path: np })
    }
  }
  return []
}

function bfsDist(walls, sr, sc, er, ec) {
  return bfsPath(walls, sr, sc, er, ec).length
}

// ── 敵人移動輔助（避免同格重疊）──────────────────────────────
function posKey(p) { return `${p.r},${p.c}` }

function pickAvoidingOccupied(moves, occupied) {
  const free = moves.filter(m => !occupied.has(posKey(m)))
  const pool = free.length ? free : moves
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── 主題色彩（從 CSS 變數讀取，隨主題自動換色）───────────────
function getThemeColors(canvas) {
  const cs = getComputedStyle(canvas)
  const v = (name, fallback) => cs.getPropertyValue(name).trim() || fallback
  return {
    bg:        v('--c-bg',         '#f8f7f4'),
    surface:   v('--c-surface',    '#ffffff'),
    primary:   v('--c-primary',    '#185FA5'),
    primaryBg: v('--c-primary-bg', '#E6F1FB'),
    text:      v('--c-text',       '#2c2c2a'),
    textMuted: v('--c-text-muted', '#5f5e5a'),
    warning:   v('--c-warning',    '#BA7517'),
  }
}

// ── 愛心 ─────────────────────────────────────────────────────
function Hearts({ total, remaining }) {
  return (
    <div style={{ display:'flex', gap:3 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ fontSize:18, opacity: i < remaining ? 1 : 0.2, transition:'opacity 0.3s' }}>❤️</span>
      ))}
    </div>
  )
}

// ── 主元件 ───────────────────────────────────────────────────
export default function MazePlayer({ activity, onFinish, onRestart }) {
  if (!activity) return null
  const items      = activity.items || []
  const meta       = activity.meta  || {}
  const difficulty = meta.difficulty || 'normal'
  const enemyCount = Math.min(4, Math.max(1, meta.enemies ?? 1))
  const maxHearts  = Math.min(5, Math.max(1, meta.hearts  ?? 3))

  const [phase,    setPhase]    = useState('intro')
  const [qIdx,     setQIdx]     = useState(0)
  const [hearts,   setHearts]   = useState(maxHearts)
  const [score,    setScore]    = useState(0)
  const [finished, setFinished] = useState(false)
  const [flash,    setFlash]    = useState(null)  // 'correct'|'wrong'|'caught'

  const wallsRef   = useRef(null)
  const playerRef  = useRef({ ...PLAYER_START })
  const enemiesRef = useRef([])
  const roomsRef   = useRef([])
  const heartsRef  = useRef(maxHearts)
  const phaseRef   = useRef('intro')
  const tickRef    = useRef(null)
  const canvasRef  = useRef(null)
  const qIdxRef    = useRef(0)

  const item = items[qIdxRef.current % items.length]

  // ── 選出本題使用的房間（每次隨機指派入口方向）───────────
  function getActiveRooms(currentItem) {
    const optCount   = Math.min(6, currentItem?.options?.length || 4)
    const entryDirs  = ['up', 'down', 'left', 'right']
    return ROOM_DEFS.slice(0, optCount).map(rm => ({
      ...rm,
      entry: entryDirs[Math.floor(Math.random() * entryDirs.length)],
    }))
  }

  // ── 初始化迷宮和實體位置 ─────────────────────────────────
  function initMaze(currentItem) {
    const activeRooms = getActiveRooms(currentItem)
    const roomKeysForKnock = new Set(activeRooms.flatMap(rm => [...roomCells(rm)]))
    const walls       = generateMaze(activeRooms)
    knockWalls(walls, difficulty, roomKeysForKnock)
    eliminateDeadEnds(walls, roomKeysForKnock)
    wallsRef.current  = walls

    // 隨機分配選項到房間
    const optCount  = activeRooms.length
    const optOrder  = Array.from({ length: optCount }, (_, i) => i).sort(() => Math.random() - 0.5)
    roomsRef.current = activeRooms.map((rm, i) => ({ ...rm, optionIdx: optOrder[i] }))

    // 玩家回起點
    playerRef.current = { ...PLAYER_START }

    // 怪物：從候選點中選，排除在房間內的、距玩家太近的
    const allRoomKeys = new Set(activeRooms.flatMap(rm => [...roomCells(rm)]))
    const validCandidates = ENEMY_CANDIDATES.filter(pos => {
      if (allRoomKeys.has(`${pos.r},${pos.c}`)) return false
      const d = bfsDist(walls, pos.r, pos.c, PLAYER_START.r, PLAYER_START.c)
      return d > 4
    })
    const shuffled = [...validCandidates].sort(() => Math.random() - 0.5)
    enemiesRef.current = shuffled.slice(0, enemyCount).map(pos => ({ ...pos }))
  }

  // ── Canvas 繪製 ───────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !wallsRef.current) return
    const ctx   = canvas.getContext('2d')
    const walls = wallsRef.current
    const currentItem = items[qIdxRef.current % items.length]
    const theme = getThemeColors(canvas)

    ctx.clearRect(0, 0, COLS * CELL, ROWS * CELL)

    // 背景
    ctx.fillStyle = theme.bg
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL)

    // 走廊格背景
    ctx.fillStyle = theme.surface
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2)

    // 房間
    for (const room of roomsRef.current) {
      const x  = (room.c - 1) * CELL
      const y  = (room.r - 1) * CELL
      const w  = 3 * CELL
      const opt = currentItem?.options?.[room.optionIdx] ?? ''

      // 房間底色
      ctx.fillStyle = theme.primaryBg
      ctx.fillRect(x + 1, y + 1, w - 2, w - 2)

      // 房間邊框（帶入口缺口）
      ctx.strokeStyle = theme.primary
      ctx.lineWidth   = 3.5
      const gapStart = CELL * 0.8   // 缺口在中間 cell 的中段
      const gapEnd   = CELL * 2.2
      // top
      if (room.entry !== 'up') {
        ctx.beginPath(); ctx.moveTo(x+2, y+2); ctx.lineTo(x+w-2, y+2); ctx.stroke()
      } else {
        ctx.beginPath(); ctx.moveTo(x+2, y+2); ctx.lineTo(x+gapStart, y+2); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(x+gapEnd, y+2); ctx.lineTo(x+w-2, y+2); ctx.stroke()
      }
      // bottom
      if (room.entry !== 'down') {
        ctx.beginPath(); ctx.moveTo(x+2, y+w-2); ctx.lineTo(x+w-2, y+w-2); ctx.stroke()
      } else {
        ctx.beginPath(); ctx.moveTo(x+2, y+w-2); ctx.lineTo(x+gapStart, y+w-2); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(x+gapEnd, y+w-2); ctx.lineTo(x+w-2, y+w-2); ctx.stroke()
      }
      // left
      if (room.entry !== 'left') {
        ctx.beginPath(); ctx.moveTo(x+2, y+2); ctx.lineTo(x+2, y+w-2); ctx.stroke()
      } else {
        ctx.beginPath(); ctx.moveTo(x+2, y+2); ctx.lineTo(x+2, y+gapStart); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(x+2, y+gapEnd); ctx.lineTo(x+2, y+w-2); ctx.stroke()
      }
      // right
      if (room.entry !== 'right') {
        ctx.beginPath(); ctx.moveTo(x+w-2, y+2); ctx.lineTo(x+w-2, y+w-2); ctx.stroke()
      } else {
        ctx.beginPath(); ctx.moveTo(x+w-2, y+2); ctx.lineTo(x+w-2, y+gapStart); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(x+w-2, y+gapEnd); ctx.lineTo(x+w-2, y+w-2); ctx.stroke()
      }

      // 選項文字
      if (opt) {
        ctx.fillStyle    = theme.text
        ctx.textAlign    = 'center'
        ctx.textBaseline = 'middle'
        const cx   = x + w / 2
        const cy   = y + w / 2
        const fs   = opt.length > 6 ? 13 : opt.length > 4 ? 15 : 17
        ctx.font   = `bold ${fs}px sans-serif`
        if (opt.length > 6) {
          const mid = Math.ceil(opt.length / 2)
          ctx.fillText(opt.slice(0, mid), cx, cy - 10)
          ctx.fillText(opt.slice(mid),    cx, cy + 10)
        } else {
          ctx.fillText(opt, cx, cy)
        }
      }
    }

    // 牆壁
    ctx.strokeStyle = theme.textMuted
    ctx.lineWidth   = 3
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * CELL, y = r * CELL
        const w = walls[r][c]
        ctx.beginPath()
        if (w.top)    { ctx.moveTo(x,      y);      ctx.lineTo(x+CELL, y)      }
        if (w.bottom) { ctx.moveTo(x,      y+CELL); ctx.lineTo(x+CELL, y+CELL) }
        if (w.left)   { ctx.moveTo(x,      y);      ctx.lineTo(x,      y+CELL) }
        if (w.right)  { ctx.moveTo(x+CELL, y);      ctx.lineTo(x+CELL, y+CELL) }
        ctx.stroke()
      }
    }

    // 穿越通道視覺提示（主題強調色箭頭標記）
    ctx.fillStyle = theme.warning
    ctx.font      = 'bold 11px sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    for (const c of TUNNEL_COLS) {
      // 上邊
      ctx.fillText('▲', c * CELL + CELL/2, CELL * 0.3)
      // 下邊
      ctx.fillText('▼', c * CELL + CELL/2, (ROWS - 1) * CELL + CELL * 0.7)
    }
    for (const r of TUNNEL_ROWS) {
      // 左邊
      ctx.fillText('◀', CELL * 0.3, r * CELL + CELL/2)
      // 右邊
      ctx.fillText('▶', (COLS - 1) * CELL + CELL * 0.7, r * CELL + CELL/2)
    }

    // 敵人（同格重疊時做小幅位移，避免互相完全遮住）
    ctx.font         = `${CELL * 0.6}px serif`
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    const groups = new Map()
    for (const e of enemiesRef.current) {
      const key = posKey(e)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(e)
    }
    for (const group of groups.values()) {
      const n = group.length
      group.forEach((e, i) => {
        const cx = e.c * CELL + CELL / 2
        const cy = e.r * CELL + CELL / 2
        let ox = 0, oy = 0
        if (n > 1) {
          const angle = (i / n) * Math.PI * 2
          const radius = CELL * 0.16
          ox = Math.cos(angle) * radius
          oy = Math.sin(angle) * radius
        }
        ctx.fillText('👾', cx + ox, cy + oy)
      })
    }

    // 玩家
    const p = playerRef.current
    ctx.fillText('🧑', p.c * CELL + CELL / 2, p.r * CELL + CELL / 2)
  }, [items])

  // ── 敵人移動 ─────────────────────────────────────────────
  function moveEnemies() {
    const walls  = wallsRef.current
    if (!walls) return
    const player = playerRef.current
    const occupied = new Set()   // 本次 tick 已被分配的格子，避免多隻怪物疊在一起

    enemiesRef.current = enemiesRef.current.map(e => {
      // 計算可移動的格子（含穿越通道）
      const validMoves = DIRS_DEF
        .filter(([,, wall]) => !walls[e.r][e.c][wall])
        .map(([dr, dc]) => {
          let nr = e.r + dr, nc = e.c + dc
          if (nr < 0)     nr = ROWS - 1
          if (nr >= ROWS) nr = 0
          if (nc < 0)     nc = COLS - 1
          if (nc >= COLS) nc = 0
          return { r: nr, c: nc }
        })

      if (!validMoves.length) {
        occupied.add(posKey(e))
        return e
      }

      let choice
      if (difficulty === 'easy') {
        // 全地圖隨機巡邏
        choice = pickAvoidingOccupied(validMoves, occupied)
      } else {
        const dist = bfsDist(walls, e.r, e.c, player.r, player.c)

        if (difficulty === 'normal' && dist > CHASE_RADIUS) {
          // 超出範圍：隨機巡邏
          choice = pickAvoidingOccupied(validMoves, occupied)
        } else {
          // hard 或 normal 靠近：BFS 追，但避開已被其他怪物佔用的格子
          const path = bfsPath(walls, e.r, e.c, player.r, player.c)
          const preferred = path.length ? path[0] : e
          choice = occupied.has(posKey(preferred))
            ? pickAvoidingOccupied(validMoves, occupied)
            : preferred
        }
      }

      occupied.add(posKey(choice))
      return choice
    })
  }

  // ── 碰撞 / 觸發 ──────────────────────────────────────────
  function checkTriggers() {
    const p = playerRef.current

    // 被敵人抓到
    if (enemiesRef.current.some(e => e.r === p.r && e.c === p.c)) {
      triggerLoseHeart('caught'); return
    }

    // 走進房間中心格
    const room = roomsRef.current.find(rm => rm.r === p.r && rm.c === p.c)
    if (!room) return

    const currentItem = items[qIdxRef.current % items.length]
    if (room.optionIdx === currentItem?.answerIndex) {
      triggerCorrect()
    } else {
      triggerLoseHeart('wrong')
    }
  }

  // ── 重新分配敵人位置（重置時使用，一次洗牌、確保彼此不重複）
  function triggerLoseHeart(reason) {
    clearInterval(tickRef.current)
    const next = heartsRef.current - 1
    heartsRef.current = next
    setHearts(next)
    setFlash(reason === 'caught' ? 'caught' : 'wrong')
    setTimeout(() => setFlash(null), 800)

    if (next <= 0) {
      phaseRef.current = 'result'
      setPhase('result')
      if (onFinish) onFinish(score, items.length)
      return
    }

    // 同一題重來，但整張地圖重新生成（牆壁、房間入口、選項位置、怪物位置全部重新洗牌）
    const currentItem = items[qIdxRef.current % items.length]
    initMaze(currentItem)
    draw()
    setTimeout(() => { if (phaseRef.current === 'playing') startTick() }, 1500)
  }

  function triggerCorrect() {
    clearInterval(tickRef.current)
    setFlash('correct')
    setTimeout(() => setFlash(null), 600)
    setScore(s => s + 1)
    const next = qIdxRef.current + 1
    if (next >= items.length) {
      phaseRef.current = 'result'
      setFinished(true)
      setPhase('result')
      if (onFinish) onFinish(score + 1, items.length)
    } else {
      qIdxRef.current = next
      setQIdx(next)
      setTimeout(() => {
        const newItem = items[next % items.length]
        initMaze(newItem)
        phaseRef.current = 'ready'
        setPhase('ready')
      }, 800)
    }
  }

  // 玩家點「開始」，正式讓怪物開始動
  function beginChase() {
    if (phaseRef.current !== 'ready') return
    phaseRef.current = 'playing'
    setPhase('playing')
    requestAnimationFrame(() => { draw(); startTick() })
  }

  // ── 遊戲主循環 ───────────────────────────────────────────
  const normalFastRef = useRef(false)  // 普通模式是否處於加速狀態

  function startTick() {
    clearInterval(tickRef.current)
    const interval = difficulty === 'hard' ? 700 : difficulty === 'normal' ? 950 : 1300

    function tick() {
      if (phaseRef.current !== 'playing') return
      moveEnemies()
      draw()
      checkTriggers()

      // 普通模式：根據距離動態切換 interval
      if (difficulty === 'normal') {
        const walls  = wallsRef.current
        const player = playerRef.current
        const isClose = enemiesRef.current.some(e =>
          bfsDist(walls, e.r, e.c, player.r, player.c) <= CHASE_RADIUS
        )
        const shouldFast = isClose
        if (shouldFast !== normalFastRef.current) {
          normalFastRef.current = shouldFast
          clearInterval(tickRef.current)
          const newInterval = shouldFast ? 550 : 950
          tickRef.current = setInterval(tick, newInterval)
        }
      }
    }

    tickRef.current = setInterval(tick, interval)
  }

  // ── 玩家移動 ─────────────────────────────────────────────
  const movePlayer = useCallback((dr, dc) => {
    if (phaseRef.current !== 'playing') return
    const walls = wallsRef.current
    if (!walls) return
    const p   = playerRef.current
    const wMap = { '-10':'top','10':'bottom','0-1':'left','01':'right' }
    const wall = wMap[`${dr}${dc}`]
    if (walls[p.r][p.c][wall]) return
    let nr = p.r + dr, nc = p.c + dc
    // 穿越通道：超出邊界時 wrap
    if (nr < 0)     nr = ROWS - 1
    if (nr >= ROWS) nr = 0
    if (nc < 0)     nc = COLS - 1
    if (nc >= COLS) nc = 0
    playerRef.current = { r: nr, c: nc }
    draw()
    checkTriggers()
  }, [draw])

  // ── 鍵盤 ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = e => {
      const MAP = {
        ArrowUp:[-1,0], ArrowDown:[1,0], ArrowLeft:[0,-1], ArrowRight:[0,1],
        w:[-1,0], s:[1,0], a:[0,-1], d:[0,1],
      }
      if (MAP[e.key]) { e.preventDefault(); movePlayer(...MAP[e.key]) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [movePlayer])

  // ── 觸控滑動 ─────────────────────────────────────────────
  const touchStart = useRef(null)
  function onTouchStart(e) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  function onTouchEnd(e) {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return
    if (Math.abs(dx) > Math.abs(dy)) movePlayer(0, dx > 0 ? 1 : -1)
    else movePlayer(dy > 0 ? 1 : -1, 0)
  }

  // ── 開始遊戲 ─────────────────────────────────────────────
  function startGame() {
    const wasFinished = phaseRef.current === 'result'
    clearInterval(tickRef.current)
    heartsRef.current = maxHearts
    qIdxRef.current   = 0
    phaseRef.current  = 'ready'
    setHearts(maxHearts)
    setScore(0)
    setQIdx(0)
    setFinished(false)
    setFlash(null)
    setPhase('ready')
    const firstItem = items[0]
    initMaze(firstItem)
    if (wasFinished && onRestart) onRestart()
  }

  useEffect(() => {
    return () => clearInterval(tickRef.current)
  }, [])

  // ── Flash overlay ─────────────────────────────────────────
  const flashStyle = flash ? {
    position:'absolute', inset:0, borderRadius:'var(--radius-md)',
    background: flash==='correct' ? 'rgba(29,158,117,0.25)' : 'rgba(226,75,74,0.25)',
    pointerEvents:'none', zIndex:10,
    animation: 'flashAnim 0.6s ease-out forwards',
  } : null

  // ── 介紹畫面 ─────────────────────────────────────────────
  if (phase === 'intro') {
    const diffLabel = { easy:'簡單', normal:'普通', hard:'困難' }[difficulty]
    return (
      <div className="card" style={{ textAlign:'center', padding:'2rem' }}>
        <div style={{ fontSize:48, marginBottom:8 }}>🏃</div>
        <p style={{ fontSize:18, fontWeight:500, marginBottom:10 }}>迷宮追逐</p>
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:14, flexWrap:'wrap' }}>
          <span className="tag tag-blue">{diffLabel}</span>
          <span className="tag tag-gray">敵人 {enemyCount} 隻</span>
          <span className="tag tag-gray">❤️ × {maxHearts}</span>
          <span className="tag tag-green">{items.length} 題</span>
        </div>
        <p style={{ color:'var(--c-text-muted)', fontSize:14, lineHeight:1.8, marginBottom:'1.5rem' }}>
          走進迷宮中正確答案的房間即可過關<br/>
          走進錯誤房間或被敵人抓到會扣愛心<br/>
          方向鍵 / WASD / 螢幕滑動移動
        </p>
        <button className="btn-primary" onClick={startGame} style={{ padding:'12px 40px', fontSize:16 }}>
          開始遊戲
        </button>
      </div>
    )
  }

  // ── 結果畫面 ─────────────────────────────────────────────
  if (phase === 'result') {
    return (
      <ResultScreen score={score} total={items.length} onRestart={startGame}
        failed={!finished} failMessage="遊戲結束" perfectMessage="全部通關！" />
    )
  }

  // ── 遊戲畫面 ─────────────────────────────────────────────
  const currentItem = items[qIdx % items.length]
  return (
    <div>
      <style>{`
        @keyframes flashAnim { from { opacity:1 } to { opacity:0 } }
        .maze-layout { display:flex; align-items:center; justify-content:center; gap:16px; flex-wrap:wrap; }
      `}</style>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <Hearts total={maxHearts} remaining={hearts} />
        <span style={{ fontSize:13, color:'var(--c-text-muted)' }}>
          第 {qIdx+1} / {items.length} 題
        </span>
      </div>

      {phase === 'ready' ? (
        <div className="card" style={{
          width: COLS * CELL, height: ROWS * CELL, maxWidth:'100%',
          margin:'0 auto', padding:'2rem 1.5rem',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          gap:'1.75rem', textAlign:'center',
        }}>
          <p style={{ fontSize:20, fontWeight:600, lineHeight:1.7 }}>
            {currentItem?.question}
          </p>
          <button className="btn-primary" onClick={beginChase} style={{ padding:'12px 40px', fontSize:16 }}>
            準備好了，開始！
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ padding:'10px 14px', marginBottom:10, textAlign:'center' }}>
            <p style={{ fontSize:16, fontWeight:500, lineHeight:1.5 }}>
              {currentItem?.question}
            </p>
          </div>

          <div className="maze-layout">
            <div style={{ position:'relative', display:'inline-block', maxWidth:'100%', overflowX:'auto' }}>
              {flashStyle && <div style={flashStyle} />}
              <canvas
                ref={canvasRef}
                width={COLS * CELL}
                height={ROWS * CELL}
                style={{ display:'block', borderRadius:'var(--radius-md)', border:'2px solid var(--c-border-strong)' }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              />
            </div>

            {/* 方向鍵：寬螢幕時排在畫布右側，空間不夠會自動換到下方置中 */}
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,44px)', gridTemplateRows:'repeat(3,44px)', gap:4, width:'fit-content', margin:'0 auto' }}>
                {[
                  [null,                    () => movePlayer(-1,0), null                   ],
                  [() => movePlayer(0,-1),  null,                   () => movePlayer(0, 1) ],
                  [null,                    () => movePlayer( 1,0), null                   ],
                ].map((row, ri) =>
                  row.map((fn, ci) =>
                    fn
                      ? <button key={`${ri}-${ci}`} onClick={fn}
                          style={{ width:44, height:44, fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', padding:0, borderRadius:'var(--radius-sm)' }}>
                          {ri===0?'▲':ri===2?'▼':ci===0?'◀':'▶'}
                        </button>
                      : <div key={`${ri}-${ci}`} />
                  )
                )}
              </div>
              <p style={{ fontSize:11, color:'var(--c-text-hint)', textAlign:'center', marginTop:4 }}>
                方向鍵 / WASD /<br/>滑動螢幕移動
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}