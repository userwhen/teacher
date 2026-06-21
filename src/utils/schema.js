// ─── 遊戲類型常數 ───────────────────────────────────────────
export const GAME_TYPES = {
  QUIZ:      'quiz',       // 選擇題
  MATCH:     'match',      // 連連看
  SORT:      'sort',       // 分類拖曳
  FILL:      'fill',       // 填空
  MAZE:      'maze',       // 迷宮追逐
  HIGHLIGHT: 'highlight',  // 字海找答案
  TIMELINE:  'timeline',   // 排序 Timeline
}

export const GAME_META = {
  quiz:      { label: '選擇題',    icon: 'help-circle',      desc: '1 題 4 選項' },
  match:     { label: '連連看',    icon: 'arrows-join',      desc: '畫線配對' },
  sort:      { label: '分類拖曳',  icon: 'layout-columns',   desc: '拖進對應桶' },
  fill:      { label: '填空',      icon: 'pencil',           desc: '句子填入答案' },
  maze:      { label: '迷宮追逐',  icon: 'maze',             desc: '答對通關' },
  highlight: { label: '字海找字',  icon: 'highlight',        desc: '點出正確詞語' },
  timeline:  { label: '排序',      icon: 'sort-ascending',   desc: '拖曳正確順序' },
}

export const SUBJECTS = ['國文', '數學', '自然', '社會', '英文', '作文']

// ─── 通用 Activity 格式 ──────────────────────────────────────
// activity = {
//   id:        string        (localStorage key，老師端)
//   gameType:  GAME_TYPES.*
//   title:     string
//   subject:   string
//   grade:     string
//   items:     Item[]        (各遊戲的題目陣列)
//   createdAt: number
//   updatedAt: number
// }

// ─── Item 格式（各遊戲類型） ─────────────────────────────────
//
// quiz:
//   { question, options: string[4], answerIndex: number }
//
// match:
//   { left, right }   （配對的兩端）
//
// sort:
//   { text, category }  （詞語 + 所屬分類名稱）
//   categories: string[]  存在 activity.meta.categories
//
// fill:
//   { sentence, answer, hint? }
//   sentence 裡用 ___ 代表填空位置
//
// maze:
//   { question, options: string[4], answerIndex: number }  同 quiz
//
// highlight:
//   { passage, answers: string[] }  一段文字 + 要找出的詞語清單
//
// timeline:
//   { text, order: number }  事件文字 + 正確順序

// ─── 工廠函式（新增空白 item） ────────────────────────────────
export function emptyItem(gameType) {
  switch (gameType) {
    case 'quiz':
    case 'maze':
      return { question: '', options: ['', '', '', ''], answerIndex: 0 }
    case 'match':
      return { left: '', right: '' }
    case 'sort':
      return { text: '', category: '' }
    case 'fill':
      return { sentence: '', answer: '', hint: '' }
    case 'highlight':
      return { passage: '', answers: [''] }
    case 'timeline':
      return { text: '', order: 0 }
    default:
      return {}
  }
}

// ─── 空白 Activity ────────────────────────────────────────────
export function emptyActivity(gameType) {
  return {
    id: null,
    gameType,
    title: '',
    subject: '國文',
    grade: '三年級',
    items: [emptyItem(gameType)],
    meta: {},
  }
}
