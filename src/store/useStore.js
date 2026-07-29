import { create } from 'zustand'
import { getAll, save, remove } from '../utils/storage.js'

const useStore = create((set) => ({
  activities: [],
  draft: null,

  loadActivities: () => set({ activities: getAll() }),

  saveActivity: (activity) => {
    const saved = save(activity)
    set({ activities: getAll(), draft: { ...activity, id: saved.id || activity.id } })
    return saved
  },

  deleteActivity: (id) => { remove(id); set({ activities: getAll() }) },

  setDraft: (activity) => set({ draft: activity }),

  updateDraftField: (field, value) =>
    set(state => ({ draft: { ...state.draft, [field]: value } })),

  updateDraftItem: (index, newItem) =>
    set(state => {
      const items = [...state.draft.items]
      items[index] = { ...items[index], ...newItem }
      return { draft: { ...state.draft, items } }
    }),

  addDraftItem: (emptyItem) =>
    set(state => ({ draft: { ...state.draft, items: [...state.draft.items, emptyItem] } })),

  removeDraftItem: (index) =>
    set(state => ({ draft: { ...state.draft, items: state.draft.items.filter((_, i) => i !== index) } })),

  // 單一 key 更新
  updateDraftMeta: (key, value) =>
    set(state => ({ draft: { ...state.draft, meta: { ...state.draft.meta, [key]: value } } })),

  // 批次更新多個 meta key（避免連續呼叫的 race condition）
  updateDraftMetaBatch: (patch) =>
    set(state => ({ draft: { ...state.draft, meta: { ...state.draft.meta, ...patch } } })),
}))

export default useStore
