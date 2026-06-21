import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore.js'
import { GAME_META, SUBJECTS, emptyActivity } from '../utils/schema.js'
import { buildPlayUrl } from '../utils/codec.js'

const GRADES = ['一年級','二年級','三年級','四年級','五年級','六年級','國一','國二','國三']

export default function HomePage() {
  const navigate = useNavigate()
  const { activities, loadActivities, deleteActivity, setDraft } = useStore()
  const [filterSubject, setFilterSubject] = useState('全部')
  const [copied, setCopied] = useState(null)

  useEffect(() => { loadActivities() }, [])

  const filtered = filterSubject === '全部'
    ? activities
    : activities.filter(a => a.subject === filterSubject)

  function handleNew(gameType) {
    const draft = emptyActivity(gameType)
    setDraft(draft)
    navigate(`/editor/${gameType}`)
  }

  function handleEdit(a) {
    setDraft(a)
    navigate(`/editor/${a.gameType}/${a.id}`)
  }

  function handleCopyUrl(a) {
    const url = buildPlayUrl(a)
    navigator.clipboard.writeText(url).then(() => {
      setCopied(a.id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  function handleDelete(id) {
    if (window.confirm('確定刪除這份題目？')) deleteActivity(id)
  }

  return (
    <div className="page">
      <div style={styles.header}>
        <h1 style={styles.title}>教學遊戲平台</h1>
        <p style={styles.sub}>建立互動題目，分享網址給學生</p>
      </div>

      {/* 選遊戲類型 */}
      <section>
        <p className="label" style={{ marginBottom: '0.75rem' }}>新增題目</p>
        <div style={styles.gameGrid}>
          {Object.entries(GAME_META).map(([type, meta]) => (
            <button
              key={type}
              style={styles.gameCard}
              onClick={() => handleNew(type)}
              className="btn-ghost"
            >
              <span style={styles.gameIcon}>
                <i className={`ti ti-${meta.icon}`} aria-hidden="true" />
              </span>
              <span style={styles.gameName}>{meta.label}</span>
              <span style={styles.gameDesc}>{meta.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="divider" />

      {/* 題目庫 */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <p className="label" style={{ margin: 0 }}>我的題目庫（{activities.length}）</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['全部', ...SUBJECTS].map(s => (
              <button
                key={s}
                style={{
                  ...styles.filterBtn,
                  ...(filterSubject === s ? styles.filterBtnActive : {})
                }}
                onClick={() => setFilterSubject(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <div style={styles.empty}>
            <i className="ti ti-books" style={{ fontSize: 32, color: 'var(--c-text-hint)' }} aria-hidden="true" />
            <p style={{ color: 'var(--c-text-muted)', marginTop: 8 }}>
              {activities.length === 0 ? '還沒有題目，點上方新增吧！' : '這個科目還沒有題目'}
            </p>
          </div>
        )}

        {filtered.map(a => (
          <div key={a.id} className="card" style={styles.actCard}>
            <div style={styles.actTop}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span className="tag tag-blue">{a.subject}</span>
                  <span className="tag tag-green">{GAME_META[a.gameType]?.label}</span>
                  <span className="tag tag-gray">{a.grade}</span>
                  <span className="tag tag-gray">{a.items?.length} 題</span>
                </div>
                <p style={styles.actTitle}>{a.title || '（未命名）'}</p>
                <p style={styles.actDate}>
                  {new Date(a.updatedAt).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
            <div className="divider" style={{ margin: '0.75rem 0' }} />
            <div className="btn-row">
              <button onClick={() => handleCopyUrl(a)} className="btn-primary" style={{ flex: 2 }}>
                <i className="ti ti-copy" aria-hidden="true" />
                {' '}{copied === a.id ? '已複製！' : '複製學生網址'}
              </button>
              <button onClick={() => handleEdit(a)} style={{ flex: 1 }}>
                <i className="ti ti-edit" aria-hidden="true" /> 編輯
              </button>
              <button onClick={() => handleDelete(a.id)} style={{ flex: 1 }}>
                <i className="ti ti-trash" aria-hidden="true" /> 刪除
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}

const styles = {
  header: { marginBottom: '1.5rem' },
  title: { fontSize: 22, fontWeight: 500, marginBottom: 4 },
  sub: { fontSize: 14, color: 'var(--c-text-muted)' },
  gameGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: 10,
    marginBottom: '1rem',
  },
  gameCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1rem 0.5rem',
    gap: 4,
    cursor: 'pointer',
    borderRadius: 'var(--radius-md)',
  },
  gameIcon: { fontSize: 26, color: 'var(--c-text-muted)' },
  gameName: { fontSize: 14, fontWeight: 500, color: 'var(--c-text)' },
  gameDesc: { fontSize: 11, color: 'var(--c-text-hint)' },
  filterBtn: {
    padding: '3px 10px',
    fontSize: 12,
    borderRadius: 999,
    border: '1px solid var(--c-border)',
    background: 'var(--c-surface)',
    cursor: 'pointer',
  },
  filterBtnActive: {
    background: 'var(--c-primary-bg)',
    color: '#0C447C',
    borderColor: 'var(--c-primary)',
    fontWeight: 500,
  },
  empty: {
    textAlign: 'center',
    padding: '2.5rem 1rem',
    background: 'var(--c-surface)',
    borderRadius: 'var(--radius-lg)',
    border: '1px dashed var(--c-border)',
  },
  actCard: { padding: '1rem' },
  actTop: { display: 'flex', gap: 10 },
  actTitle: { fontSize: 15, fontWeight: 500, marginBottom: 3 },
  actDate: { fontSize: 12, color: 'var(--c-text-hint)' },
}
