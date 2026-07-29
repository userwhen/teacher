// 產生一聲嗶聲
// freq: 頻率 Hz，dur: 持續秒數
function beep(freq = 440, dur = 0.12) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + dur)
  } catch {}
}

// 最後 10 秒倒數音效（每秒一聲，頻率漸升）
// 回傳 clearFn，呼叫後停止
export function startCountdownBeeps(secondsLeft, onEachSecond) {
  // secondsLeft: 還剩幾秒（呼叫時）
  // 每秒算一次，頻率從 440 升到 880
  const timers = []

  for (let i = 0; i < secondsLeft; i++) {
    const freq = 440 + (880 - 440) * (i / 10)  // 漸升
    const t = setTimeout(() => {
      beep(freq, 0.1)
      if (onEachSecond) onEachSecond(secondsLeft - i)
    }, i * 1000)
    timers.push(t)
  }

  return () => timers.forEach(clearTimeout)
}
