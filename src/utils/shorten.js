export async function shortenUrl(longUrl) {
  try {
    const res  = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`)
    const data = await res.json()
    return data.shorturl || longUrl
  } catch {
    return longUrl
  }
}