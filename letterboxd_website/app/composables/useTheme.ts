import { ref, watch } from 'vue'

type Theme = 'light' | 'dark'

const theme = ref<Theme>('light')
let initialized = false

function readInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  const fromStorage = localStorage.getItem('theme')
  if (fromStorage === 'light' || fromStorage === 'dark') return fromStorage
  const fromAttr = document.documentElement.dataset.theme
  if (fromAttr === 'light' || fromAttr === 'dark') return fromAttr
  return 'light'
}

export function useTheme() {
  if (!initialized) {
    initialized = true
    if (typeof document !== 'undefined') {
      // Defer to after hydration so server & client start with same value ('light')
      // then immediately correct to the real theme
      const saved = readInitialTheme()
      if (saved !== theme.value) {
        theme.value = saved
      }
      watch(theme, (next) => {
        document.documentElement.dataset.theme = next
        try { localStorage.setItem('theme', next) } catch {}
      }, { immediate: true })
    }
  }

  function toggle() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function setTheme(next: Theme) {
    theme.value = next
  }

  return { theme, toggle, setTheme }
}