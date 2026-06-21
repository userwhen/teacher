import pako from 'pako'

// 題目物件 → 壓縮 Base64 字串（放進網址）
export function encodeData(obj) {
  const json = JSON.stringify(obj)
  const compressed = pako.gzip(json)
  // Uint8Array → binary string → base64
  let binary = ''
  compressed.forEach(b => { binary += String.fromCharCode(b) })
  return encodeURIComponent(btoa(binary))
}

// 網址字串 → 題目物件
export function decodeData(str) {
  try {
    const base64 = decodeURIComponent(str)
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
    const json = pako.ungzip(bytes, { to: 'string' })
    return JSON.parse(json)
  } catch {
    return null
  }
}

// 產生完整學生網址
export function buildPlayUrl(data) {
  const encoded = encodeData(data)
  const base = window.location.origin + window.location.pathname
  return `${base}#/play/${encoded}`
}
