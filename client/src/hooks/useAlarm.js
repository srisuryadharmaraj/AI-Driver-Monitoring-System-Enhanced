import { useRef, useCallback } from 'react'

/**
 * useAlarm – plays a synthesised alarm tone via Web Audio API.
 * Respects a cooldown so the alarm doesn't fire on every frame.
 *
 * Usage:
 *   const playAlarm = useAlarm()
 *   if (data.alarm) playAlarm()
 */
export default function useAlarm(cooldownMs = 2500) {
  const lastRef = useRef(0)
  const ctxRef = useRef(null)

  const playAlarm = useCallback(() => {
    const now = Date.now()
    if (now - lastRef.current < cooldownMs) return
    lastRef.current = now

    try {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const ctx = ctxRef.current

      // Three-tone alarm: beep-beep-beep
      const tones = [880, 1100, 880]
      tones.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'square'
        osc.frequency.value = freq
        gain.gain.value = 0.18
        osc.connect(gain)
        gain.connect(ctx.destination)
        const start = ctx.currentTime + i * 0.2
        osc.start(start)
        osc.stop(start + 0.15)
      })
    } catch {
      // Audio not available — ignore
    }
  }, [cooldownMs])

  return playAlarm
}
