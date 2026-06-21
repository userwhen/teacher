const KEY = 'ww_activities'

// 讀取所有題目
export function getAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

// 儲存（新增或更新）
export function save(activity) {
  const all = getAll()
  const now = Date.now()
  if (activity.id) {
    // 更新既有
    const idx = all.findIndex(a => a.id === activity.id)
    if (idx >= 0) {
      all[idx] = { ...activity, updatedAt: now }
    } else {
      all.unshift({ ...activity, updatedAt: now })
    }
  } else {
    // 新增
    const newItem = { ...activity, id: `act_${now}`, createdAt: now, updatedAt: now }
    all.unshift(newItem)
    localStorage.setItem(KEY, JSON.stringify(all))
    return newItem
  }
  localStorage.setItem(KEY, JSON.stringify(all))
  return activity
}

// 刪除
export function remove(id) {
  const all = getAll().filter(a => a.id !== id)
  localStorage.setItem(KEY, JSON.stringify(all))
}

// 讀取單筆
export function getById(id) {
  return getAll().find(a => a.id === id) || null
}