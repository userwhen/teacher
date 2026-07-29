import { useState, useEffect, useRef } from 'react'
import { startCountdownBeeps } from '../utils/beep.js'
import { formatTime } from '../utils/scores.js'

// Props:
//   totalSeconds: 總秒數（null = 無限制）
//   onTimeUp: 時間到的 callback
//   running: 是否在計時（false 時暫停）
//   onTick: 每秒回呼 (secondsLeft) => void（選用）

export default function GameTimer({ totalSeconds, onTimeUp, running = true, onTick }) {
  const [left, setLeft] = useState(totalSeconds)
  const beepCleanupRef = useRef(null)
  const intervalRef    = useRef(null)

  useEffect(() => {
    setLeft(totalSeconds)
  }, [totalSeconds])

  useEffect(() => {
    if (!totalSeconds || !running) return
    if (left === null) return

    intervalRef.current = setInterval(() => {
      setLeft(prev => {
        const next = prev - 1
        if (onTick) onTick(next)

        // 最後 10 秒啟動音效
        if (next === 10) {
          if (beepCleanupRef.current) beepCleanupRef.current()
          beepCleanupRef.current = startCountdownBeeps(10)
        }

        if (next <= 0) {
          clearInterval(intervalRef.current)
          if (beepCleanupRef.current) beepCleanupRef.current()
          if (onTimeUp) onTimeUp()
          return 0
        }
        return next
      })
    }, 1000)

    return () => {
      clearInterval(intervalRef.current)
      if (beepCleanupRef.current) beepCleanupRef.current()
    }
  }, [running, totalSeconds])

  // 無限制模式：只顯示已用時間
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (totalSeconds || !running) return
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [running, totalSeconds])

  if (!totalSeconds) {
    return (
      <div style={styles.wrap}>
        <i className="ti ti-clock" style={{ fontSize:14 }} aria-hidden="true" />
        {' '}{formatTime(elapsed)}
      </div>
    )
  }

  const pct     = left / totalSeconds
  const isUrgent = left <= 10
  const color    = isUrgent ? '#E24B4A' : left <= 30 ? '#BA7517' : 'var(--c-text-muted)'

  return (
    <div style={{ ...styles.wrap, color }}>
      <i className="ti ti-clock" style={{ fontSize:14, flexShrink:0 }} aria-hidden="true" />
      <span style={{ fontWeight: isUrgent ? 700 : 500, fontSize: isUrgent ? 15 : 14 }}>
        {formatTime(left)}
      </span>
      {/* 進度弧 */}
      <svg width="22" height="22" style={{ flexShrink:0 }}>
        <circle cx="11" cy="11" r="9" fill="none" stroke="var(--c-border)" strokeWidth="2" />
        <circle cx="11" cy="11" r="9" fill="none"
          stroke={color} strokeWidth="2"
          strokeDasharray={`${2 * Math.PI * 9}`}
          strokeDashoffset={`${2 * Math.PI * 9 * (1 - pct)}`}
          strokeLinecap="round"
          transform="rotate(-90 11 11)"
          style={{ transition:'stroke-dashoffset 0.9s linear, stroke 0.3s' }} />
      </svg>
    </div>
  )
}

const styles = {
  wrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    color: 'var(--c-text-muted)',
    fontSize: 14,
  },
}
