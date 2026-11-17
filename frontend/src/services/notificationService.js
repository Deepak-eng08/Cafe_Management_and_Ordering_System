// Notification sound + formatting helpers.
// Sounds are synthesized with the Web Audio API so no asset files are
// needed. They are only played after a user interaction to satisfy
// browser autoplay policies.

let audioCtx = null
let unlockBound = false

function getAudioContext() {
  if (typeof window === "undefined") return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!audioCtx) audioCtx = new Ctx()
  if (audioCtx.state === "suspended") audioCtx.resume()
  return audioCtx
}

export function unlockAudio() {
  getAudioContext()
}

// Register a one-time interaction listener so the AudioContext is ready
// before the first notification arrives.
export function initAudioUnlock() {
  if (unlockBound || typeof window === "undefined") return
  unlockBound = true
  const unlock = () => {
    getAudioContext()
    window.removeEventListener("pointerdown", unlock)
    window.removeEventListener("keydown", unlock)
    window.removeEventListener("touchstart", unlock)
  }
  window.addEventListener("pointerdown", unlock)
  window.addEventListener("keydown", unlock)
  window.addEventListener("touchstart", unlock)
}

function tone(ctx, { freq, start = 0, duration = 0.4, type = "sine", gain = 0.15, endFreq }) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
  if (endFreq) {
    osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + start + duration)
  }
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start)
  g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + duration + 0.05)
}

// Admin: soft, warm bell.
export function playAdminBell() {
  const ctx = getAudioContext()
  if (!ctx) return
  tone(ctx, { freq: 880, duration: 0.5, gain: 0.14 })
  tone(ctx, { freq: 1320, duration: 0.55, gain: 0.08 })
  tone(ctx, { freq: 1760, start: 0.04, duration: 0.35, gain: 0.05 })
}

// Customer: pleasant cafe "ding" (light chord).
export function playCustomerDing() {
  const ctx = getAudioContext()
  if (!ctx) return
  tone(ctx, { freq: 660, duration: 0.45, gain: 0.14 })
  tone(ctx, { freq: 990, start: 0.02, duration: 0.5, gain: 0.1 })
  tone(ctx, { freq: 1320, start: 0.14, duration: 0.5, gain: 0.09 })
}

export function formatRelativeTime(iso) {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.max(0, Math.round(diff / 60000))
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.round(hrs / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}

export function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
