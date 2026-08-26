import { useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { decodeData } from '../utils/codec.js'
import { GAME_META } from '../utils/schema.js'
import { saveScore, getScores, getActivityKey } from '../utils/scores.js'
import GameTimer from '../components/GameTimer.jsx'
import ScoreBoard from '../components/ScoreBoard.jsx'
import QuizPlayer      from '../components/games/QuizPlayer.jsx'
import MatchPlayer     from '../components/games/MatchPlayer.jsx'
import SortPlayer      from '../components/games/SortPlayer.jsx'
import FillPlayer      from '../components/games/FillPlayer.jsx'
import MazePlayer      from '../components/games/MazePlayer.jsx'
import HighlightPlayer from '../components/games/HighlightPlayer.jsx'
import TimelinePlayer  from '../components/games/TimelinePlayer.jsx'
import HotspotPlayer   from '../components/games/HotspotPlayer.jsx'
import WordsearchPlayer from '../components/games/WordsearchPlayer.jsx'
import AnagramPlayer   from '../components/games/AnagramPlayer.jsx'
import MatchupPlayer   from '../components/games/MatchupPlayer.jsx'
import PuzzlePlayer    from '../components/games/PuzzlePlayer.jsx'

// 不套用計時器的遊戲（有自己的時間機制）
const NO_TIMER = ['maze', 'puzzle']

const PLAYERS = {
  quiz:       QuizPlayer,
  match:      MatchPlayer,
  sort:       SortPlayer,
  fill:       FillPlayer,
  maze:       MazePlayer,
  highlight:  HighlightPlayer,
  timeline:   TimelinePlayer,
  hotspot:    HotspotPlayer,
  wordsearch: WordsearchPlayer,
  anagram:    AnagramPlayer,
  matchup:    MatchupPlayer,
  puzzle:     PuzzlePlayer,
}

export default function PlayerPage() {
  const { encoded } = useParams()
  const navigate    = useNavigate()
  const activity    = useMemo(() => decodeData(encoded), [encoded])
  const actKey      = useMemo(() => getActivityKey(), [])

  const [timerRunning, setTimerRunning] = useState(true)
  const [elapsed,      setElapsed]      = useState(0)   // 已用秒數
  const [timeUp,       setTimeUp]       = useState(false)
  const [records,      setRecords]      = useState(() => getScores(actKey))
  const [lastResult,   setLastResult]   = useState(null) // { score, total, pct, timeUsed }
  const [restartKey,   setRestartKey]   = useState(0)   // 變動時強制 GameTimer 重新掛載

  if (!activity) {
    return (
      <div className="page" style={{ textAlign:'center', paddingTop:'4rem' }}>
        <i className="ti ti-alert-circle" style={{ fontSize:40, color:'var(--c-danger)' }} aria-hidden="true" />
        <p style={{ marginTop:12, fontWeight:500 }}>無法讀取題目</p>
        <p style={{ color:'var(--c-text-muted)', fontSize:14, marginTop:4 }}>連結可能已損壞，請向老師索取新的連結</p>
        <button onClick={() => navigate('/')} style={{ marginTop:16 }}>
          <i className="ti ti-home" aria-hidden="true" /> 回首頁
        </button>
      </div>
    )
  }

  const PlayerComponent = PLAYERS[activity.gameType]
  const meta            = GAME_META[activity.gameType]
  const timeLimit       = activity.timeLimit || 0   // 0 = 不限時
  const showTimer       = !NO_TIMER.includes(activity.gameType)
  const theme           = activity.theme || 'default'

  // 遊戲結束 callback（各 Player 呼叫）
  const handleFinish = useCallback((score, total) => {
    setTimerRunning(false)
    const pct     = total > 0 ? Math.round((score / total) * 100) : 0
    const timeUsed = timeLimit
      ? timeLimit - elapsed   // 有計時：已用時間 = 總時間 - 剩餘
      : elapsed               // 無限制：elapsed 是已用時間
    const record  = { score, total, pct, timeUsed }
    setLastResult(record)
    const next = saveScore(actKey, record)
    setRecords(next)
  }, [elapsed, timeLimit, actKey])

  // 時間到
  const handleTimeUp = useCallback(() => {
    setTimeUp(true)
    setTimerRunning(false)
  }, [])

  // elapsed 更新（GameTimer 每秒回呼）
  const handleTick = useCallback((left) => {
    if (timeLimit) setElapsed(timeLimit - left)
    else setElapsed(e => e + 1)
  }, [timeLimit])
  // 學生按「再玩一次」：重置計時器與相關狀態
 const handleRestart = useCallback(() => {
setElapsed(0)
setTimeUp(false)
setLastResult(null)
setTimerRunning(true)
setRestartKey(k => k + 1)
}, [])

  return (
    <div className={`page play-shell theme-${theme}`}>
      {/* 標頭 */}
      <div style={{ ...styles.header, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', gap:6, marginBottom:6, flexWrap:'wrap' }}>
            <span className="tag tag-blue">{activity.subject}</span>
            <span className="tag tag-gray">{activity.grade}</span>
            {meta && (
              <span className="tag tag-green">
                <i className={`ti ti-${meta.icon}`} style={{ fontSize:12, verticalAlign:-1 }} aria-hidden="true" />
                {' '}{meta.label}
              </span>
            )}
          </div>
          <h1 style={{ ...styles.title, fontSize:18, wordBreak:'break-word' }}>{activity.title}</h1>
        </div>

        {/* 計時器 */}
        {showTimer && (
          <GameTimer
          key={restartKey}
            totalSeconds={timeLimit || null}
            running={timerRunning}
            onTimeUp={handleTimeUp}
            onTick={handleTick}
          />
        )}
      </div>

      {/* 時間到 overlay */}
      {timeUp && (
        <div style={styles.timeUpBanner}>
          <i className="ti ti-clock-off" aria-hidden="true" /> 時間到！
        </div>
      )}

      {/* 遊戲元件 */}
      {!timeUp && PlayerComponent && (
        <PlayerComponent
          activity={activity}
          onFinish={handleFinish}
          onRestart={handleRestart}
        />
      )}

      {!timeUp && !PlayerComponent && (
        <div className="card" style={{ textAlign:'center', padding:'2rem', color:'var(--c-text-muted)' }}>
          <i className="ti ti-tools" style={{ fontSize:36 }} aria-hidden="true" />
          <p style={{ marginTop:8 }}>「{meta?.label}」遊戲開發中</p>
        </div>
      )}

      {/* 成績紀錄 */}
      {lastResult && (
        <ScoreBoard records={records} currentIdx={0} />
      )}
    </div>
  )
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: '1.25rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid var(--c-border)',
  },
  title: { fontSize:20, fontWeight:500 },
  timeUpBanner: {
    padding: '14px',
    background: 'var(--c-danger-bg)',
    color: '#791F1F',
    borderRadius: 'var(--radius-md)',
    fontSize: 18,
    fontWeight: 600,
    textAlign: 'center',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
}
