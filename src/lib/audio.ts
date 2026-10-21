// Synthesized Web Audio API sound effects for gacha fanfare & card reveal
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export function playOpeningChime(rarity: string = 'common') {
  try {
    const ctx = getAudioContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Frequencies tailored to rarity
    const freqs = rarity === 'mythic' 
      ? [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98] // C5 chord up to G6
      : rarity === 'legendary'
      ? [440.00, 554.37, 659.25, 880.00, 1108.73] // A Major
      : rarity === 'epic'
      ? [392.00, 493.88, 587.33, 783.99] // G Major
      : [329.63, 440.00, 523.25] // Standard chime

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = rarity === 'mythic' || rarity === 'legendary' ? 'triangle' : 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.1)

      gain.gain.setValueAtTime(0, now + idx * 0.1)
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.1 + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.9)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + idx * 0.1)
      osc.stop(now + idx * 0.1 + 1.0)
    })
  } catch (err) {
    // Audio context may be restricted by autoplay policy before user gesture
  }
}

export function playDuelClashSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(120, now)
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.25)
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.3)
  } catch {}
}

export function playLpDamageSound() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.setValueAtTime(220, now + 0.08)
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.2)
  } catch {}
}

export function playDuelVictoryFanfare() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + idx * 0.12)
      gain.gain.setValueAtTime(0, now + idx * 0.12)
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.12 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.8)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.12)
      osc.stop(now + idx * 0.12 + 0.85)
    })
  } catch {}
}

export function playWheelTickSound(pitchMultiplier = 1) {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(600 * pitchMultiplier, now)
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.04)
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.04)
  } catch {}
}

export function playWheelWinFanfare(isLegendary = false) {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = isLegendary
      ? [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98] // C5 to G6 fanfare
      : [440.00, 554.37, 659.25, 880.00] // A major
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = isLegendary ? 'triangle' : 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.09)
      gain.gain.setValueAtTime(0, now + idx * 0.09)
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.09 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.7)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.09)
      osc.stop(now + idx * 0.09 + 0.75)
    })
  } catch {}
}

