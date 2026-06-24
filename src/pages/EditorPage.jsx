import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useStore from '../store/useStore.js'
import { GAME_META, SUBJECTS, emptyActivity } from '../utils/schema.js'
import { buildPlayUrl } from '../utils/codec.js'
import QuizEditor      from '../components/editors/QuizEditor.jsx'
import MatchEditor     from '../components/editors/MatchEditor.jsx'
import SortEditor      from '../components/editors/SortEditor.jsx'
import FillEditor      from '../components/editors/FillEditor.jsx'
import MazeEditor      from '../components/editors/MazeEditor.jsx'
import HighlightEditor from '../components/editors/HighlightEditor.jsx'
import TimelineEditor  from '../components/editors/TimelineEditor.jsx'

const EDITORS = {
  quiz:      QuizEditor,
  match:     MatchEditor,
  sort:      SortEditor,
  fill:      FillEditor,
  maze:      MazeEditor,
  highlight: HighlightEditor,
  timeline:  TimelineEditor,
}

const GRADES = ['一年級','二年級','三年級','四年級','五年級','六年級','國一','國二','國三']
const STEPS  = ['選遊戲類型', '填寫題目', '產生網址']

export default function EditorPage() {
  const { gameType, activityId } = useParams()
  const navigate = useNavigate()
  const { draft, setDraft, updateDraftField, saveActivity } = useStore()
  const [step, setStep]               = useState(1)
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [copied, setCopied]           = useState(false)
  const [saveMsg, setSaveMsg]         = useState('')

  useEffect(() => {
    if (!draft) {
      setDraft(emptyActivity(gameType))
    }
  }, [])

  if (!draft) return (
    <div className="page" style={{ paddingTop: '3rem', textAlign: 'center', color: 'var(--c-text-muted)' }}>
      載入中...
    </div>
  )

  const EditorComponent = EDITORS[gameType]
  const meta = GAME_META[gameType]

  function handleGenerate() {
    if (!draft.title.trim()) { alert('請填寫標題'); return }
    if (!draft.items || draft.items.length === 0) { alert('請至少新增一題'); return }
    saveActivity(draft)
    setGeneratedUrl(buildPlayUrl(draft))
    setStep(2)
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleSaveDraft() {
    saveActivity(draft)
    setSaveMsg('已儲存')
    setTimeout(() => setSaveMsg(''), 2000)
  }

  return (
    <div className="page">
      <div style={styles.topBar}>
        <button onClick={() => navigate('/')} style={{ padding: '6px 10px', fontSize: 13 }}>
          <i className="ti ti-arrow-left" aria-hidden="true" /> 首頁
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className={`ti ti-${meta?.icon}`} style={{ fontSize: 18, color: 'var(--c-text-muted)' }} aria-hidden="true" />
          <span style={{ fontWeight: 500, fontSize: 15 }}>{meta?.label}</span>
        </div>
        <button onClick={handleSaveDraft} style={{ padding: '6px 12px', fontSize: 13 }}>
          {saveMsg || <><i className="ti ti-device-floppy" aria-hidden="true" /> 儲存草稿</>}
        </button>
      </div>

      <div className="step-bar">
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div className={`step ${step === i ? 'active' : step > i ? 'done' : ''}`}>
              <div className="step-dot">
                {step > i
                  ? <i className="ti ti-check" style={{ fontSize: 11 }} aria-hidden="true" />
                  : i + 1}
              </div>
              <span>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className="step-line" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          <div className="card">
            <div style={styles.metaRow}>
              <div style={{ flex: 2, minWidth: 140 }}>
                <label className="label">標題</label>
                <input
                  type="text"
                  placeholder="例：三年級國文第二課"
                  value={draft.title}
                  onChange={e => updateDraftField('title', e.target.value)}
                />
              </div>
              <div style={{ width: 90 }}>
                <label className="label">科目</label>
                <select value={draft.subject} onChange={e => updateDraftField('subject', e.target.value)}>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ width: 90 }}>
                <label className="label">年級</label>
                <select value={draft.grade} onChange={e => updateDraftField('grade', e.target.value)}>
                  {GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
          </div>

          {EditorComponent
            ? <EditorComponent />
            : (
              <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--c-text-muted)' }}>
                <i className="ti ti-tools" style={{ fontSize: 32 }} aria-hidden="true" />
                <p style={{ marginTop: 8 }}>「{meta?.label}」編輯器開發中</p>
              </div>
            )
          }

          <div className="btn-row" style={{ marginTop: '1rem' }}>
            <button onClick={() => navigate('/')} style={{ flex: 1 }}>
              <i className="ti ti-arrow-left" aria-hidden="true" /> 取消
            </button>
            <button className="btn-primary" onClick={handleGenerate} style={{ flex: 2 }}>
              產生學生網址 <i className="ti ti-arrow-right" aria-hidden="true" />
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <div className="card">
          <div style={styles.successBadge}>
            <i className="ti ti-circle-check" aria-hidden="true" /> 網址已產生
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            <span className="tag tag-blue">{draft.subject}</span>
            <span className="tag tag-green">{meta?.label}</span>
            <span className="tag tag-gray">{draft.grade}</span>
            <span className="tag tag-gray">{draft.items?.length} 題</span>
          </div>
          <p style={{ fontWeight: 500, fontSize: 15, marginBottom: '1rem' }}>{draft.title}</p>
          <label className="label">學生連結</label>
          <div className="url-box">
            <span>{generatedUrl.slice(0, 40)}</span>{generatedUrl.slice(40)}
          </div>
          <div className="btn-row" style={{ marginBottom: '1rem' }}>
            <button className="btn-primary" onClick={handleCopy} style={{ flex: 2 }}>
              <i className="ti ti-copy" aria-hidden="true" />
              {' '}{copied ? '已複製！' : '複製網址'}
            </button>
            <button onClick={() => window.open(generatedUrl, '_blank')} style={{ flex: 1 }}>
              <i className="ti ti-external-link" aria-hidden="true" /> 預覽
            </button>
          </div>
          <div style={styles.tip}>
            <i className="ti ti-brand-google" style={{ fontSize: 15, verticalAlign: -2 }} aria-hidden="true" />
            {' '}貼到 Google Meet 聊天室，學生直接點開即可
          </div>
          <div className="divider" />
          <div className="btn-row">
            <button onClick={() => setStep(1)} style={{ flex: 1 }}>
              <i className="ti ti-edit" aria-hidden="true" /> 繼續編輯
            </button>
            <button onClick={() => navigate('/')} style={{ flex: 1 }}>
              <i className="ti ti-home" aria-hidden="true" /> 回首頁
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.25rem',
  },
  metaRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  successBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--c-success-bg)',
    color: '#27500A',
    fontSize: 13,
    fontWeight: 500,
    padding: '5px 12px',
    borderRadius: 999,
    marginBottom: '0.75rem',
  },
  tip: {
    background: 'var(--c-bg)',
    borderRadius: 'var(--radius-sm)',
    padding: '8px 12px',
    fontSize: 13,
    color: 'var(--c-text-muted)',
  },
}
