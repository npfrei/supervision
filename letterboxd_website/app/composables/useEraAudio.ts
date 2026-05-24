import { ref, onBeforeUnmount } from 'vue'

type Track = { id: string; src: string; label: string }

const CROSSFADE_MS = 600
const TARGET_VOL = 0.55

export function useEraAudio(tracks: Track[]) {
  const audios = new Map<string, HTMLAudioElement>()
  const fadeTimers = new Map<string, number>()

  const enabled = ref(true)
  const activeId = ref<string | null>(null)
  const currentLabel = ref<string | null>(null)
  const hasAssets = ref(false)

  function probeAssets() {
    return Promise.all(
      tracks.map(
        (t) =>
          new Promise<{ id: string; ok: boolean }>((resolve) => {
            const a = new Audio()
            a.preload = 'metadata'
            const done = (ok: boolean) => {
              a.onloadedmetadata = null
              a.onerror = null
              resolve({ id: t.id, ok })
            }
            a.onloadedmetadata = () => done(true)
            a.onerror = () => done(false)
            a.src = t.src
          })
      )
    )
  }

  function ensureLoaded() {
    if (audios.size) return
    for (const t of tracks) {
      const a = new Audio(t.src)
      a.loop = true
      a.preload = 'auto'
      a.volume = 0
      audios.set(t.id, a)
    }
  }

  function clearFade(id: string) {
    const h = fadeTimers.get(id)
    if (h != null) {
      window.clearInterval(h)
      fadeTimers.delete(id)
    }
  }

  function fadeTo(id: string, target: number, onDone?: () => void) {
    const audio = audios.get(id)
    if (!audio) return
    clearFade(id)
    const start = audio.volume
    const startTime = performance.now()
    const handle = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - startTime) / CROSSFADE_MS)
      audio.volume = start + (target - start) * t
      if (t >= 1) {
        clearFade(id)
        onDone?.()
      }
    }, 30)
    fadeTimers.set(id, handle)
  }

  async function setActive(id: string | null) {
    activeId.value = id
    const track = id ? tracks.find((t) => t.id === id) : null
    currentLabel.value = track?.label ?? null

    if (!enabled.value) return
    ensureLoaded()

    for (const t of tracks) {
      const audio = audios.get(t.id)!
      if (t.id === id) {
        if (audio.paused) {
          try {
            await audio.play()
          } catch {
            enabled.value = false
            return
          }
        }
        fadeTo(t.id, TARGET_VOL)
      } else {
        fadeTo(t.id, 0, () => {
          if (!audio.paused) audio.pause()
        })
      }
    }
  }

  async function toggle() {
    if (enabled.value) {
      enabled.value = false
      for (const t of tracks) {
        fadeTo(t.id, 0, () => {
          const a = audios.get(t.id)
          if (a && !a.paused) a.pause()
        })
      }
      return
    }
    enabled.value = true
    ensureLoaded()
    if (activeId.value) await setActive(activeId.value)
  }

  function teardown() {
    for (const id of fadeTimers.keys()) clearFade(id)
    for (const a of audios.values()) {
      a.pause()
      a.src = ''
    }
    audios.clear()
  }

  onBeforeUnmount(teardown)

  return {
    enabled,
    activeId,
    currentLabel,
    hasAssets,
    probeAssets,
    setActive,
    toggle,
  }
}
