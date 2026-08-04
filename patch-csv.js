// patch-csv.js — 一次幫 10 個編輯器接上 CSV 匯入匯出（ESM 版）
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const editors = path.join(__dirname, 'src', 'components', 'editors')

const patches = [
  { file: 'QuizEditor.jsx',      csv: 'quizCsv',      label: '題目（{items.length}）',           hasEmptyItem: true },
  { file: 'FillEditor.jsx',      csv: 'fillCsv',      label: '題目（{items.length}）',           hasEmptyItem: true },
  { file: 'AnagramEditor.jsx',   csv: 'anagramCsv',   label: '題目（{items.length}）',           hasEmptyItem: true },
  { file: 'SortEditor.jsx',      csv: 'sortCsv',      label: '詞語（{items.length}）',           hasEmptyItem: true },
  { file: 'HighlightEditor.jsx', csv: 'highlightCsv', label: '題組（{items.length}）',           hasEmptyItem: true },
  { file: 'MatchEditor.jsx',     csv: 'matchCsv',     label: '配對組（{items.length}）',         hasEmptyItem: true },
  { file: 'MazeEditor.jsx',      csv: 'quizCsv',      label: '題目（{items.length}）',           hasEmptyItem: false },
  { file: 'MatchupEditor.jsx',   csv: 'matchupCsv',   label: '題目（{items.length}）',           hasEmptyItem: false },
  { file: 'TimelineEditor.jsx',  csv: 'timelineCsv',  label: null, special: 'timeline',         hasEmptyItem: false },
  { file: 'WordsearchEditor.jsx',csv: 'wordsearchCsv',label: '詞語清單（{validWords.length} 個有效）', hasEmptyItem: false, special: 'wordsearch' },
]

function patch(file, cfg) {
  const fp = path.join(editors, file)
  if (!fs.existsSync(fp)) {
    console.warn(`⚠ 找不到 ${fp}，跳過`)
    return
  }
  let src = fs.readFileSync(fp, 'utf8')
  const before = src

  // 1. 加 import
  if (cfg.hasEmptyItem) {
    src = src.replace(
      /import useStore from ['"]\.\.\/\.\.\/store\/useStore\.js['"]\nimport \{ emptyItem \} from ['"]\.\.\/\.\.\/utils\/schema\.js['"]/,
      `import useStore from '../../store/useStore.js'\nimport { emptyItem } from '../../utils/schema.js'\nimport CsvTools from '../CsvTools.jsx'\nimport { ${cfg.csv} } from '../../utils/csvConfigs.js'`
    )
  } else {
    src = src.replace(
      /import useStore from ['"]\.\.\/\.\.\/store\/useStore\.js['"]/,
      `import useStore from '../../store/useStore.js'\nimport CsvTools from '../CsvTools.jsx'\nimport { ${cfg.csv} } from '../../utils/csvConfigs.js'`
    )
  }

  // 2. 加 setDraft（Wordsearch 不用）
  if (cfg.special !== 'wordsearch') {
    src = src.replace(
      /const \{ draft, updateDraftItem, addDraftItem, removeDraftItem, updateDraftMeta \} = useStore\(\)/,
      'const { draft, setDraft, updateDraftItem, addDraftItem, removeDraftItem, updateDraftMeta } = useStore()'
    )
  }

  // 3. 插入 CsvTools
  if (cfg.special === 'timeline') {
    const tip = /(<div style=\{\{ marginBottom:10, fontSize:12, color:'var\(--c-text-hint\)'[\s\S]*?<\/div>)/
    if (tip.test(src)) {
      src = src.replace(
        tip,
        `$1\n\n      <CsvTools {...${cfg.csv}} items={items} onImport={newItems => setDraft({ ...draft, items: newItems })} />`
      )
    }
  } else if (cfg.special === 'wordsearch') {
    const re = new RegExp(
      `(<div style=\\{\\{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0\\.5rem' \\}\\}>\\s*<p className="label" style=\\{\\{ margin:0 \\}\\}>詞語清單（\\{validWords\\.length\\} 個有效）</p>)`
    )
    src = src.replace(
      re,
      `<CsvTools {...wordsearchCsv}
        items={words.filter(Boolean).map((w, i) => ({ word: w, match: matches[i] || '' }))}
        onImport={rows => { updateDraftMeta('words', rows.map(r => r.word)); updateDraftMeta('matches', rows.map(r => r.match)) }} />

      $1`
    )
  } else {
    const escaped = cfg.label.replace(/[(){}]/g, '\\$&')
    const re = new RegExp(
      `(<div style=\\{\\{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0\\.5rem' \\}\\}>\\s*<p className="label" style=\\{\\{ margin:0 \\}\\}>${escaped}</p>)`
    )
    src = src.replace(
      re,
      `<CsvTools {...${cfg.csv}} items={items} onImport={newItems => setDraft({ ...draft, items: newItems })} />\n\n      $1`
    )
  }

  if (src === before) {
    console.warn(`⚠ ${file} 沒有任何變更（可能字串對不上，請手動檢查）`)
  } else {
    fs.writeFileSync(fp, src)
    console.log(`✓ ${file}`)
  }
}

console.log('開始 patch 編輯器…')
for (const cfg of patches) patch(cfg.file, cfg)
console.log('完成。記得確認新檔案 csv.js / CsvTools.jsx / csvConfigs.js 已就位，然後 build 測一下。')