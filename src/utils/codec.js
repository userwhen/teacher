import pako from 'pako'

export function encodeData(obj) {
  const json = JSON.stringify(obj)
  const compressed = pako.gzip(json)
  let binary = ''
  compressed.forEach(b => { binary += String.fromCharCode(b) })
  return encodeURIComponent(btoa(binary))
}

export function decodeData(str) {
  try {
    const base64 = decodeURIComponent(str)
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
    const json = pako.ungzip(bytes, { to: 'string' })
    return JSON.parse(json)
  } catch { return null }
}

export function buildPlayUrl(data) {
  const encoded = encodeData(data)
  const base = window.location.origin + window.location.pathname
  return `${base}#/play/${encoded}`
}
