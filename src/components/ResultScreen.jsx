export default function ResultScreen({
  score, total, mistakes,
  onRestart,
  failed = false,
  perfectMessage,
  perfectSubtitle = '零失誤，太厲害了！',
  mistakeLabel = '錯誤',
  scoreLabel = '答對',
  failMessage = '遊戲結束',
  children,
}) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const emoji = failed ? '💔' : pct === 100 ? '🎉' : pct >= 60 ? '👍' : '💪'
  const title = failed
    ? failMessage
    : pct === 100
      ? (perfectMessage || '全部答對！')
      : `${scoreLabel} ${score} / ${total}`

  return (
    <div className="card" style={{ textAlign:'center', padding:'2.5rem 1rem' }}>
      <div style={{ fontSize:48, marginBottom:8 }}>{emoji}</div>
      <p style={{ fontSize:20, fontWeight:500, marginBottom:4 }}>{title}</p>
      <p style={{ color:'var(--c-text-muted)', marginBottom: children ? '1.25rem' : '1.5rem' }}>
        {(failed || mistakes == null)
          ? `${scoreLabel} ${score} / ${total} 題`
          : (mistakes === 0 ? perfectSubtitle : `${mistakeLabel} ${mistakes} 次`)}
      </p>
      {children}
      <button className="btn-primary" onClick={onRestart} style={{ padding:'10px 32px' }}>
        <i className="ti ti-refresh" aria-hidden="true" /> 再玩一次
      </button>
    </div>
  )
}