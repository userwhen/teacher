import useStore from '../../store/useStore.js'
import CsvTools from '../CsvTools.jsx'
import { matchupCsv } from '../../utils/csvConfigs.js'

export default function MatchupEditor() {
  const { draft, setDraft, updateDraftItem, addDraftItem, removeDraftItem, updateDraftMeta } = useStore()
  const items = draft?.items || []
  const difficulty = draft?.meta?.difficulty || 'easy'

  return (
    <div>
      <div style={S.tip}>
        <i className="ti ti-info-circle" style={{ fontSize:14, verticalAlign:-2 }} aria-hidden="true" />
        {' '}輸入句子時用 ___ 標記填空位置，再填入對應的正確詞語。學生把左側詞語拖入句子空格。
      </div>

      {/* 難度選擇 */}
      <div className="card" style={{ background:'var(--c-bg)', padding:'0.875rem', marginBottom:'0.75rem' }}>
        <p className="label" style={{ marginBottom:8 }}>難度</p>
        <div style={{ display:'flex', gap:8 }}>
          {[
            { key:'easy', label:'簡單', desc:'放錯詞語會被退回，不會卡在句子裡' },
            { key:'hard', label:'困難', desc:'可以先全部填完，提交後才知道對錯' },
          ].map(({ key, label, desc }) => (
            <div key={key} onClick={() => updateDraftMeta('difficulty', key)} style={{
              flex:1, display:'flex', flexDirection:'column', padding:'10px 14px',
              border:`1.5px solid ${difficulty===key ? 'var(--c-primary)' : 'var(--c-border)'}`,
              borderRadius:'var(--radius-md)', cursor:'pointer', transition:'all 0.12s',
              background: difficulty===key ? 'var(--c-primary-bg)' : 'var(--c-surface)',
            }}>
              <span style={{ fontWeight:500, fontSize:13, color: difficulty===key ? '#0C447C' : 'var(--c-text)' }}>{label}</span>
              <span style={{ fontSize:11, color:'var(--c-text-hint)', marginTop:2 }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <CsvTools {...matchupCsv} items={items} onImport={newItems => setDraft({ ...draft, items: newItems })} />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
        <p className="label" style={{ margin:0 }}>題目（{items.length}）</p>
      </div>

      {items.map((item, idx) => (
        <div key={idx} className="card" style={{ background:'var(--c-bg)', padding:'1rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={S.qNum}>題目 {idx + 1}</span>
            {items.length > 1 && (
              <button onClick={() => removeDraftItem(idx)}
                style={{ padding:'2px 8px', fontSize:12, color:'var(--c-danger)', borderColor:'var(--c-danger)' }}>
                <i className="ti ti-trash" aria-hidden="true" /> 刪除
              </button>
            )}
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <div style={{ flex:2 }}>
              <label className="label">句子（用 ___ 標記填空）</label>
              <input type="text"
                placeholder="例：弟弟玩耍時打破了桌上的花瓶，不禁 ___ 得哭起來。"
                value={item.sentence || ''}
                onChange={e => updateDraftItem(idx, { sentence: e.target.value })} />
            </div>
            <div style={{ flex:1 }}>
              <label className="label">正確答案（詞語）</label>
              <input type="text"
                placeholder="例：傷心"
                value={item.answer || ''}
                onChange={e => updateDraftItem(idx, { answer: e.target.value })} />
            </div>
          </div>

          {item.sentence && item.answer && (
            <div style={S.preview}>
              <span style={{ fontSize:12, color:'var(--c-text-hint)' }}>預覽：</span>
              {item.sentence.split('___').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span style={S.answerChip}>{item.answer}</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      <button className="btn-ghost"
        onClick={() => addDraftItem({ sentence: '', answer: '' })}
        style={{ width:'100%', padding:'10px' }}>
        <i className="ti ti-plus" aria-hidden="true" /> 新增題目
      </button>

      <div style={{ ...S.tip, marginTop:10 }}>
        <i className="ti ti-bulb" style={{ fontSize:14, verticalAlign:-2 }} aria-hidden="true" />
        {' '}建議 8–12 題，左側詞語會打亂順序顯示
      </div>
    </div>
  )
}

const S = {
  tip: {
    padding:'7px 12px', background:'var(--c-bg)', borderRadius:'var(--radius-sm)',
    fontSize:12, color:'var(--c-text-hint)', marginBottom:10,
    display:'flex', alignItems:'center', gap:6,
    border: '1px solid var(--c-border)',
  },
  qNum: { fontSize:12, fontWeight:600, color:'var(--c-text-muted)', letterSpacing:0.5 },
  preview: {
    marginTop:10, padding:'8px 10px', background:'var(--c-surface)',
    border:'1px solid var(--c-border)', borderRadius:'var(--radius-sm)',
    fontSize:14, lineHeight:1.8,
  },
  answerChip: {
    display:'inline-block', padding:'1px 10px',
    background:'var(--c-success-bg)', color:'var(--c-success)',
    borderRadius:4, fontWeight:500, margin:'0 2px',
  },
}
