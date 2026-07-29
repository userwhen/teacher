export const GAME_TYPES = {
  QUIZ: 'quiz', MATCH: 'match', SORT: 'sort', FILL: 'fill',
  MAZE: 'maze', HIGHLIGHT: 'highlight', TIMELINE: 'timeline', HOTSPOT: 'hotspot',
}

export const GAME_META = {
  quiz:      { label: '選擇題',     labelEn: 'Quiz',              icon: 'help-circle',    desc: '1 題 4 選項' },
  match:     { label: '連連看',     labelEn: 'Matching',          icon: 'arrows-join',    desc: '畫線配對' },
  hotspot:   { label: '圖片連連看', labelEn: 'Image Matching',    icon: 'photo-search',   desc: '圖片上點位配對', sub: true },
  wordsearch:{ label: '字格找字',   labelEn: 'Word Search',       icon: 'letter-case',   desc: '拖曳框出隱藏詞語' },
  anagram:   { label: '字母重組',   labelEn: 'Anagram',           icon: 'arrows-shuffle', desc: '點選字母拼出答案' },
  matchup:   { label: '配對填空',   labelEn: 'Fill & Match',      icon: 'text-plus',      desc: '詞語拖入句子空格' },
  sort:      { label: '分類拖曳',   labelEn: 'Sorting',           icon: 'layout-columns', desc: '拖進對應桶' },
  fill:      { label: '填空',       labelEn: 'Fill in the Blank', icon: 'pencil',         desc: '句子填入答案' },
  maze:      { label: '迷宮追逐',   labelEn: 'Maze Chase',        icon: 'maze',           desc: '答對通關' },
  highlight: { label: '字海找字',   labelEn: 'Highlight',         icon: 'highlight',      desc: '點出正確詞語' },
  timeline:  { label: '排序',       labelEn: 'Sequencing',        icon: 'sort-ascending', desc: '拖曳正確順序' },
}

export const SUBJECTS = ['國文', '數學', '自然', '社會', '英文', '作文']

export function emptyItem(gameType) {
  switch (gameType) {
    case 'quiz':
    case 'maze':      return { question: '', options: ['', '', '', ''], answerIndex: 0 }
    case 'match':     return { left: '', right: '' }
    case 'sort':      return { text: '', category: '' }
    case 'fill':      return { sentence: '', answer: '', hint: '' }
    case 'highlight': return { passage: '', answers: [''] }
    case 'timeline':  return { text: '', order: 0 }
    case 'hotspot':   return {}
    case 'wordsearch': return {}
    case 'anagram':    return { hint: '', answer: '' }
    case 'matchup':    return { sentence: '', answer: '' }
    default:          return {}
  }
}

export function emptyActivity(gameType) {
  return {
    id: null, gameType, title: '', subject: '國文', grade: '三年級',
    items: ['hotspot','wordsearch'].includes(gameType) ? [] : [emptyItem(gameType)],
    meta: {},
  }
}