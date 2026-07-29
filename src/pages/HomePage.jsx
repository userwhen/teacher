import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore.js'
import { GAME_META, SUBJECTS, emptyActivity } from '../utils/schema.js'
import { buildPlayUrl } from '../utils/codec.js'
import { shortenUrl } from '../utils/shorten.js'

export default function HomePage() {
  const navigate = useNavigate()
  const { activities, loadActivities, deleteActivity, setDraft } = useStore()
  const [filterSubject, setFilterSubject] = useState('全部')
  const [copied, setCopied] = useState(null)
  const [shortening, setShortening] = useState(null)

  useEffect(() => { loadActivities() }, [])

  const filtered = filterSubject === '全部' ? activities : activities.filter(a => a.subject === filterSubject)

  function handleNew(gameType) {
    setDraft(emptyActivity(gameType))
    navigate(`/editor/${gameType}`)
  }

  function handleEdit(a) {
    setDraft(a)
    navigate(`/editor/${a.gameType}/${a.id}`)
  }

  async function handleCopyUrl(a) {
    setShortening(a.id)
    const shortUrl = await shortenUrl(buildPlayUrl(a))
    setShortening(null)
    navigator.clipboard.writeText(shortUrl).then(() => {
      setCopied(a.id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  function handleDelete(id) {
    if (window.confirm('確定刪除這份題目？')) deleteActivity(id)
  }

  return (
    <div className="page">
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:22, fontWeight:500, marginBottom:4 }}>教學遊戲平台</h1>
        <p style={{ fontSize:14, color:'var(--c-text-muted)' }}>建立互動題目，分享網址給學生</p>
      </div>

      <section>
        <p className="label" style={{ marginBottom:'0.75rem' }}>新增題目</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10, marginBottom:'1rem' }}>
          {Object.entries(GAME_META).map(([type, meta]) => (
            <button key={type} className="btn-ghost" onClick={() => handleNew(type)}
              style={{
                display:'flex', flexDirection:'column', alignItems:'center',
                padding:'1rem 0.5rem', gap:4, borderRadius:'var(--radius-md)',
              }}>
              <span style={{ fontSize:26, color:'var(--c-text-muted)' }}><i className={`ti ti-${meta.icon}`} aria-hidden="true" /></span>
              <span style={{ fontSize:14, fontWeight:500, color:'var(--c-text)' }}>{meta.label}</span>
              <span style={{ fontSize:10, color:'var(--c-text-hint)', textTransform:'uppercase', letterSpacing:0.3 }}>{meta.labelEn}</span>
              <span style={{ fontSize:11, color:'var(--c-text-hint)' }}>{meta.desc}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="divider" />

      <section>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.75rem' }}>
          <p className="label" style={{ margin:0 }}>我的題目庫（{activities.length}）</p>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {['全部', ...SUBJECTS].map(s => (
              <button key={s} onClick={() => setFilterSubject(s)}
                style={{ padding:'3px 10px', fontSize:12, borderRadius:999,
                  border: filterSubject===s ? '1px solid var(--c-primary)' : '1px solid var(--c-border)',
                  background: filterSubject===s ? 'var(--c-primary-bg)' : 'var(--c-surface)',
                  color: filterSubject===s ? '#0C447C' : 'var(--c-text-muted)',
                  fontWeight: filterSubject===s ? 500 : 400 }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'2.5rem 1rem', background:'var(--c-surface)', borderRadius:'var(--radius-lg)', border:'1px dashed var(--c-border)' }}>
            <i className="ti ti-books" style={{ fontSize:32, color:'var(--c-text-hint)' }} aria-hidden="true" />
            <p style={{ color:'var(--c-text-muted)', marginTop:8 }}>{activities.length===0?'還沒有題目，點上方新增吧！':'這個科目還沒有題目'}</p>
          </div>
        )}

        {filtered.map(a => (
          <div key={a.id} className="card" style={{ padding:'1rem' }}>
            <div style={{ display:'flex', gap:6, marginBottom:5, flexWrap:'wrap' }}>
              <span className="tag tag-blue">{a.subject}</span>
              <span className="tag tag-green">{GAME_META[a.gameType]?.label}</span>
              <span className="tag tag-gray">{a.grade}</span>
              <span className="tag tag-gray">{a.items?.length} 題</span>
            </div>
            <p style={{ fontSize:15, fontWeight:500, marginBottom:3 }}>{a.title || '（未命名）'}</p>
            <p style={{ fontSize:12, color:'var(--c-text-hint)', marginBottom:'0.75rem' }}>
              {new Date(a.updatedAt).toLocaleDateString('zh-TW',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}
            </p>
            <div className="divider" style={{ margin:'0 0 0.75rem' }} />
            <div className="btn-row">
              <button onClick={() => handleCopyUrl(a)} className="btn-primary" disabled={shortening===a.id} style={{ flex:2 }}>
                <i className="ti ti-copy" aria-hidden="true" /> {shortening===a.id?'縮網址中...':copied===a.id?'已複製！':'複製學生網址'}
              </button>
              <button onClick={() => handleEdit(a)} style={{ flex:1 }}><i className="ti ti-edit" aria-hidden="true" /> 編輯</button>
              <button onClick={() => handleDelete(a.id)} style={{ flex:1 }}><i className="ti ti-trash" aria-hidden="true" /> 刪除</button>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}