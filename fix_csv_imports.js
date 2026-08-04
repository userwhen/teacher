// 檢查 10 個 editor 檔案：如果有用到 <CsvTools 卻沒有對應的 import，自動補上。
// 用法：把這個檔案放到專案根目錄，跑 node fix_csv_imports.js
import fs from 'fs'
import path from 'path'

const CONFIGS = {
  'QuizEditor.jsx':       'quizCsv',
  'FillEditor.jsx':       'fillCsv',
  'AnagramEditor.jsx':    'anagramCsv',
  'SortEditor.jsx':       'sortCsv',
  'HighlightEditor.jsx':  'highlightCsv',
  'TimelineEditor.jsx':   'timelineCsv',
  'MatchupEditor.jsx':    'matchupCsv',
  'WordsearchEditor.jsx': 'wordsearchCsv',
  'MatchEditor.jsx':      'matchCsv',
  'MazeEditor.jsx':       'quizCsv',
}

const dir = path.join('src', 'components', 'editors')

for (const [file, configName] of Object.entries(CONFIGS)) {
  const filePath = path.join(dir, file)
  if (!fs.existsSync(filePath)) { console.log(`[找不到檔案] ${filePath}`); continue }

  let content = fs.readFileSync(filePath, 'utf8')
  const usesCsvTools    = content.includes('<CsvTools')
  const hasToolsImport  = content.includes("from '../CsvTools.jsx'")
  const hasConfigImport = content.includes(`{ ${configName} }`) && content.includes("from '../../utils/csvConfigs.js'")

  if (!usesCsvTools) {
    console.log(`[需要人工檢查] ${file}：完全沒找到 <CsvTools，代表那段 JSX 插入沒套上，不是缺 import 的問題`)
    continue
  }
  if (hasToolsImport && hasConfigImport) {
    console.log(`[OK] ${file}`)
    continue
  }

  const lines = content.split('\n')
  let lastImportIdx = -1
  lines.forEach((line, i) => { if (line.trimStart().startsWith('import ')) lastImportIdx = i })

  if (lastImportIdx === -1) {
    console.log(`[需要人工檢查] ${file}：找不到任何 import 行`)
    continue
  }

  const toAdd = []
  if (!hasToolsImport)  toAdd.push(`import CsvTools from '../CsvTools.jsx'`)
  if (!hasConfigImport) toAdd.push(`import { ${configName} } from '../../utils/csvConfigs.js'`)

  lines.splice(lastImportIdx + 1, 0, ...toAdd)
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8')
  console.log(`[修好] ${file}：補上 ${toAdd.join('、')}`)
}