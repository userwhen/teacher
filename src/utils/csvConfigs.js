// 每個遊戲的 CSV 欄位定義：如何把題目陣列轉成 CSV 資料列，以及反過來怎麼解析回來

export const quizCsv = {
  headers: ['題目', '選項1', '選項2', '選項3', '選項4', '正確答案(填選項文字)'],
  itemsToRows: items => items.map(it => [
    it.question || '', it.options?.[0] || '', it.options?.[1] || '',
    it.options?.[2] || '', it.options?.[3] || '', it.options?.[it.answerIndex] || '',
  ]),
  rowsToItems: rows => rows.map(r => {
    const options = [r[1], r[2], r[3], r[4]].filter(v => (v || '').trim())
    let answerIndex = options.findIndex(o => o.trim() === (r[5] || '').trim())
    if (answerIndex < 0) answerIndex = 0
    return { question: r[0] || '', options: options.length ? options : ['', '', '', ''], answerIndex }
  }),
  sampleRows: [['台灣最高的山是？', '玉山', '雪山', '合歡山', '阿里山', '玉山']],
  filename: 'quiz_template.csv',
}

export const matchCsv = {
  headers: ['左側', '右側'],
  itemsToRows: items => items.map(it => [it.left || '', it.right || '']),
  rowsToItems: rows => rows.map(r => ({ left: r[0] || '', right: r[1] || '' })),
  sampleRows: [['貓', '喵喵叫的動物'], ['狗', '汪汪叫的動物']],
  filename: 'match_template.csv',
}

export const sortCsv = {
  headers: ['詞語', '分類'],
  itemsToRows: items => items.map(it => [it.text || '', it.category || '']),
  rowsToItems: rows => rows.map(r => ({ text: r[0] || '', category: r[1] || '' })),
  sampleRows: [['蘋果', '水果'], ['紅蘿蔔', '蔬菜']],
  filename: 'sort_template.csv',
}

export const fillCsv = {
  headers: ['句子(用___標記空格)', '答案', '提示'],
  itemsToRows: items => items.map(it => [it.sentence || '', it.answer || '', it.hint || '']),
  rowsToItems: rows => rows.map(r => ({ sentence: r[0] || '', answer: r[1] || '', hint: r[2] || '' })),
  sampleRows: [['太陽從東邊___。', '升起', '跟日出方向有關']],
  filename: 'fill_template.csv',
}

export const anagramCsv = {
  headers: ['答案', '提示'],
  itemsToRows: items => items.map(it => [it.answer || '', it.hint || '']),
  rowsToItems: rows => rows.map(r => ({ answer: r[0] || '', hint: r[1] || '' })),
  sampleRows: [['蘋果', '一種水果']],
  filename: 'anagram_template.csv',
}

export const timelineCsv = {
  headers: ['事件(依正確順序由上到下排列)'],
  itemsToRows: items => [...items].sort((a, b) => a.order - b.order).map(it => [it.text || '']),
  rowsToItems: rows => rows.map((r, i) => ({ text: r[0] || '', order: i + 1 })),
  sampleRows: [['起床刷牙'], ['吃早餐'], ['上學']],
  filename: 'timeline_template.csv',
}

export const matchupCsv = {
  headers: ['句子(用___標記空格)', '答案'],
  itemsToRows: items => items.map(it => [it.sentence || '', it.answer || '']),
  rowsToItems: rows => rows.map(r => ({ sentence: r[0] || '', answer: r[1] || '' })),
  sampleRows: [['他跑得很___，一下子就到終點了。', '快']],
  filename: 'matchup_template.csv',
}

export const highlightCsv = {
  headers: ['文章段落', '要找出的詞語(用;分隔)'],
  itemsToRows: items => items.map(it => [it.passage || '', (it.answers || []).filter(Boolean).join(';')]),
  rowsToItems: rows => rows.map(r => ({ passage: r[0] || '', answers: (r[1] || '').split(';').map(s => s.trim()).filter(Boolean) })),
  sampleRows: [['小明每天早上都會去公園散步，呼吸新鮮空氣。', '小明;公園;新鮮空氣']],
  filename: 'highlight_template.csv',
}

export const wordsearchCsv = {
  headers: ['詞語', '配對內容(選填,文字或圖片網址)'],
  itemsToRows: rows => rows.map(o => [o.word || '', o.match || '']),
  rowsToItems: rows => rows.map(r => ({ word: r[0] || '', match: r[1] || '' })),
  sampleRows: [['耳朵', 'https://example.com/ear.png'], ['眼睛', '']],
  filename: 'wordsearch_template.csv',
}