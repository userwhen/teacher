import { create } from 'zustand'
import { getAll, save, remove } from '../utils/storage.js'

const useStore = create((set, get) => ({
  activities: [],
  draft: null,

  loadActivities: () => {
    set({ activities: getAll() })
  },

  saveActivity: (activity) => {
    const saved = save(activity)
    // 更新 draft（補上新增時產生的 id），不清空，EditorPage Step 2 還需要它
    set({ activities: getAll(), draft: { ...activity, id: saved.id || activity.id } })
    return saved
  },

  deleteActivity: (id) => {
    remove(id)
    set({ activities: getAll() })
  },

  setDraft: (activity) => {
    set({ draft: activity })
  },

  updateDraftField: (field, value) => {
    set(state => ({
      draft: { ...state.draft, [field]: value }
    }))
  },

  updateDraftItem: (index, newItem) => {
    set(state => {
      const items = [...state.draft.items]
      items[index] = { ...items[index], ...newItem }
      return { draft: { ...state.draft, items } }
    })
  },

  addDraftItem: (emptyItem) => {
    set(state => ({
      draft: {
        ...state.draft,
        items: [...state.draft.items, emptyItem]
      }
    }))
  },

  removeDraftItem: (index) => {
    set(state => {
      const items = state.draft.items.filter((_, i) => i !== index)
      return { draft: { ...state.draft, items } }
    })
  },

  updateDraftMeta: (key, value) => {
    set(state => ({
      draft: {
        ...state.draft,
        meta: { ...state.draft.meta, [key]: value }
      }
    }))
  },
}))

export default useStore