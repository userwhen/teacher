// key 用題目的 encoded URL hash 前 20 字作為 ID
// 每個題目最多記錄 10 筆

const PREFIX = 'ww_score_'
const MAX_RECORDS = 10

function getKey(activityKey) {
  return PREFIX + activityKey
}

// activityKey: 用網址 encoded 的前 20 字當 ID
export function getScores(activityKey) {
  try {
    const raw = sessionStorage.getItem(getKey(activityKey))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

// record: { score, total, pct, timeUsed, timestamp }
export function saveScore(activityKey, record) {
  try {
    const existing = getScores(activityKey)
    const next = [{ ...record, timestamp: Date.now() }, ...existing].slice(0, MAX_RECORDS)
    sessionStorage.setItem(getKey(activityKey), JSON.stringify(next))
    return next
  } catch { return [] }
}

export function clearScores(activityKey) {
  try { sessionStorage.removeItem(getKey(activityKey)) } catch {}
}

// 從網址 hash 取得 activity key（encoded 前 20 字）
export function getActivityKey() {
  const hash = window.location.hash || ''
  const encoded = hash.replace('#/play/', '')
  return encoded.slice(0, 20)
}

// 格式化時間 mm:ss
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
