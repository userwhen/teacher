const KEY = 'ww_activities'

export function getAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function save(activity) {
  const all = getAll()
  const now = Date.now()
  if (activity.id) {
    const idx = all.findIndex(a => a.id === activity.id)
    if (idx >= 0) all[idx] = { ...activity, updatedAt: now }
    else all.unshift({ ...activity, updatedAt: now })
    localStorage.setItem(KEY, JSON.stringify(all))
    return activity
  } else {
    const newItem = { ...activity, id: `act_${now}`, createdAt: now, updatedAt: now }
    all.unshift(newItem)
    localStorage.setItem(KEY, JSON.stringify(all))
    return newItem
  }
}

export function remove(id) {
  const all = getAll().filter(a => a.id !== id)
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function getById(id) {
  return getAll().find(a => a.id === id) || null
}
