import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import ResultScreen from '../ResultScreen.jsx'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * 將圖片切成 rows×cols 的 dataURL 碎片
 */
function sliceImage(img, rows, cols) {
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  const pw = Math.floor(w / cols)
  const ph = Math.floor(h / rows)
  const pieces = []
  const canvas = document.createElement('canvas')
  canvas.width = pw
  canvas.height = ph
  const ctx = canvas.getContext('2d')
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.clearRect(0, 0, pw, ph)
      ctx.drawImage(img, c * pw, r * ph, pw, ph, 0, 0, pw, ph)
      pieces.push({ id: r * cols + c, src: canvas.toDataURL('image/jpeg', 0.85), r, c })
    }
  }
  return pieces
}

export default function PuzzlePlayer({ activity, onFinish, onRestart }) {
  const meta = activity.meta || {}
  const imageUrl = meta.imageUrl || meta.image || ''
  const rows = meta.rows || 4
  const cols = meta.cols || 4
  const total = rows * cols

  const [pieces, setPieces] = useState([])       // 正確順序的碎片定義
  const [board, setBoard] = useState([])         // 目前板上的 piece id 排列（含 null）
  const [selected, setSelected] = useState(null) // 點選交換用
  const [finished, setFinished] = useState(false)
  const [moves, setMoves] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scale, setScale] = useState(1)
  const wrapRef = useRef(null)

  // 載入圖片並切片
  useEffect(() => {
    if (!imageUrl) {
      setError('尚未設定拼圖圖片')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const sliced = sliceImage(img, rows, cols)
        setPieces(sliced)
        // 打亂，確保至少有一點亂序
        let order = shuffle(sliced.map(p => p.id))
        let attempts = 0
        while (order.every((id, i) => id === i) && attempts < 10) {
          order = shuffle(sliced.map(p => p.id))
          attempts++
        }
        setBoard(order)
        setLoading(false)
      } catch (e) {
        setError('圖片處理失敗')
        setLoading(false)
      }
    }
    img.onerror = () => {
      setError('無法載入圖片')
      setLoading(false)
    }
    img.src = imageUrl
  }, [imageUrl, rows, cols])

  // 等比縮放：最大佔 90vw
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => {
      const avail = Math.min(el.parentElement?.clientWidth || window.innerWidth, window.innerWidth * 0.9)
      // 以 320 為基準原生寬
      const base = 320
      setScale(Math.min(1, avail / base))
    }
    update()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    if (ro) ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      if (ro) ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [loading])

  const isSolved = useCallback((arr) => arr.every((id, i) => id === i), [])

  function tapPiece(idx) {
    if (finished || loading) return
    if (selected === null) {
      setSelected(idx)
      return
    }
    if (selected === idx) {
      setSelected(null)
      return
    }
    // 交換
    setBoard(prev => {
      const next = [...prev]
      ;[next[selected], next[idx]] = [next[idx], next[selected]]
      setMoves(m => m + 1)
      if (isSolved(next)) {
        setFinished(true)
        if (onFinish) onFinish(total, total)
      }
      return next
    })
    setSelected(null)
  }

  function handleRestart() {
    if (pieces.length) {
      let order = shuffle(pieces.map(p => p.id))
      let attempts = 0
      while (order.every((id, i) => id === i) && attempts < 10) {
        order = shuffle(pieces.map(p => p.id))
        attempts++
      }
      setBoard(order)
    }
    setSelected(null)
    setFinished(false)
    setMoves(0)
    if (onRestart) onRestart()
  }

  if (loading) {
    return (
      <div className="card" style={{ textAlign:'center', padding:'2rem' }}>
        <p style={{ color:'var(--c-text-muted)' }}>載入拼圖中…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign:'center', padding:'2rem' }}>
        <i className="ti ti-photo-off" style={{ fontSize:36, color:'var(--c-text-hint)' }} aria-hidden="true" />
        <p style={{ marginTop:8, color:'var(--c-text-muted)' }}>{error}</p>
        <p style={{ fontSize:13, color:'var(--c-text-hint)', marginTop:4 }}>請老師在編輯器上傳圖片後再試</p>
      </div>
    )
  }

  if (finished) {
    return (
      <ResultScreen
        score={total}
        total={total}
        mistakes={moves}
        onRestart={handleRestart}
        perfectMessage="拼圖完成！"
        perfectSubtitle={`共移動 ${moves} 次`}
        mistakeLabel="移動"
        scoreLabel="完成"
      />
    )
  }

  const pieceMap = useMemo(() => Object.fromEntries(pieces.map(p => [p.id, p])), [pieces])
  const boardSize = 320 * scale

  return (
    <div className="play-shell">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:13, color:'var(--c-text-muted)', marginBottom:8 }}>
        <span>{rows}×{cols} 拼圖</span>
        <span>移動 {moves} 次</span>
      </div>

      <p style={{ fontSize:13, color:'var(--c-text-hint)', textAlign:'center', marginBottom:10 }}>
        點兩塊碎片即可交換位置
      </p>

      <div ref={wrapRef} style={{ display:'flex', justifyContent:'center' }}>
        <div
          style={{
            display:'grid',
            gridTemplateColumns:`repeat(${cols}, 1fr)`,
            width: boardSize,
            height: boardSize,
            gap: 2,
            background:'var(--c-border)',
            borderRadius:'var(--radius-md)',
            overflow:'hidden',
            border:'2px solid var(--c-border-strong)',
          }}
        >
          {board.map((pid, idx) => {
            const piece = pieceMap[pid]
            const isSel = selected === idx
            const correct = pid === idx
            return (
              <div
                key={idx}
                onClick={() => tapPiece(idx)}
                className="tap-target"
                style={{
                  position:'relative',
                  aspectRatio:'1',
                  cursor:'pointer',
                  outline: isSel ? '3px solid var(--c-primary)' : correct ? '2px solid var(--c-success)' : 'none',
                  outlineOffset: -2,
                  transition:'outline 0.12s',
                  background:'var(--c-surface)',
                }}
              >
                {piece && (
                  <img
                    src={piece.src}
                    alt=""
                    draggable={false}
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', pointerEvents:'none' }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 預覽小圖 */}
      {imageUrl && (
        <div style={{ marginTop:12, textAlign:'center' }}>
          <p style={{ fontSize:11, color:'var(--c-text-hint)', marginBottom:4 }}>參考圖</p>
          <img
            src={imageUrl}
            alt="參考"
            style={{ width:80, height:80, objectFit:'cover', borderRadius:6, border:'1px solid var(--c-border)', opacity:0.85 }}
          />
        </div>
      )}
    </div>
  )
}
