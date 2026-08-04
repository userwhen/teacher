import { useRef } from 'react'
import { parseCSV, toCSV, downloadCSV } from '../utils/csv.js'

export default function CsvTools({ headers, itemsToRows, rowsToItems, items, onImport, filename, sampleRows }) {
  const fileRef = useRef(null)

  function handleDownloadTemplate() {
    const dataRows = items && items.length > 0 ? itemsToRows(items) : sampleRows
    const csv = toCSV([headers, ...dataRows])
    downloadCSV(filename, csv)
  }

  function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const rows = parseCSV(ev.target.result)
      const dataRows = rows.slice(1).filter(r => r.some(cell => cell.trim() !== ''))
      if (dataRows.length === 0) { alert('沒有讀到有效資料，確認 CSV 內容或編碼'); return }
      const newItems = rowsToItems(dataRows)
      onImport(newItems)
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  return (
    <div style={{ display:'flex', gap:8, marginBottom:10 }}>
      <button onClick={handleDownloadTemplate} style={{ fontSize:12, padding:'5px 10px', flex:1 }}>
        <i className="ti ti-download" aria-hidden="true" /> 下載 CSV 範本
      </button>
      <button onClick={() => fileRef.current?.click()} style={{ fontSize:12, padding:'5px 10px', flex:1 }}>
        <i className="ti ti-upload" aria-hidden="true" /> 上傳 CSV 匯入
      </button>
      <input ref={fileRef} type="file" accept=".csv" style={{ display:'none' }} onChange={handleUpload} />
    </div>
  )
}