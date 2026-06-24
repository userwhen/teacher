import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { decodeData } from '../utils/codec.js'
import { GAME_META } from '../utils/schema.js'
import QuizPlayer      from '../components/games/QuizPlayer.jsx'
import MatchPlayer     from '../components/games/MatchPlayer.jsx'
import SortPlayer      from '../components/games/SortPlayer.jsx'
import FillPlayer      from '../components/games/FillPlayer.jsx'
import MazePlayer      from '../components/games/MazePlayer.jsx'
import HighlightPlayer from '../components/games/HighlightPlayer.jsx'
import TimelinePlayer  from '../components/games/TimelinePlayer.jsx'

const PLAYERS = {
  quiz:      QuizPlayer,
  match:     MatchPlayer,
  sort:      SortPlayer,
  fill:      FillPlayer,
  maze:      MazePlayer,
  highlight: HighlightPlayer,
  timeline:  TimelinePlayer,
}

export default function PlayerPage() {
  const { encoded } = useParams()
  const navigate    = useNavigate()
  const activity    = useMemo(() => decodeData(encoded), [encoded])

  if (!activity) {
    return (
      <div className="page" style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <i className="ti ti-alert-circle" style={{ fontSize: 40, color: 'var(--c-danger)' }} aria-hidden="true" />
        <p style={{ marginTop: 12, fontWeight: 500 }}>無法讀取題目</p>
        <p style={{ color: 'var(--c-text-muted)', fontSize: 14, marginTop: 4 }}>
          連結可能已損壞，請向老師索取新的連結
        </p>
        <button onClick={() => navigate('/')} style={{ marginTop: 16 }}>
          <i className="ti ti-home" aria-hidden="true" /> 回首頁
        </button>
      </div>
    )
  }

  const PlayerComponent = PLAYERS[activity.gameType]
  const meta = GAME_META[activity.gameType]

  return (
    <div className="page">
      <div style={styles.header}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
          <span className="tag tag-blue">{activity.subject}</span>
          <span className="tag tag-gray">{activity.grade}</span>
          {meta && (
            <span className="tag tag-green">
              <i className={`ti ti-${meta.icon}`} style={{ fontSize: 12, verticalAlign: -1 }} aria-hidden="true" />
              {' '}{meta.label}
            </span>
          )}
        </div>
        <h1 style={styles.title}>{activity.title}</h1>
      </div>

      {PlayerComponent
        ? <PlayerComponent activity={activity} />
        : (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--c-text-muted)' }}>
            <i className="ti ti-tools" style={{ fontSize: 36 }} aria-hidden="true" />
            <p style={{ marginTop: 8 }}>「{meta?.label}」遊戲開發中</p>
          </div>
        )
      }
    </div>
  )
}

const styles = {
  header: {
    marginBottom: '1.25rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid var(--c-border)',
  },
  title: { fontSize: 20, fontWeight: 500 },
}
