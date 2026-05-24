<template>
  <div class="palette-page">
    <header>
      <div class="eyebrow">No. 002 · The Palette</div>
      <h1 class="editorial-title">The Colors of Cinema</h1>
      <p class="lede">
        Dominant colors extracted from 26,000 movie posters, 1920–2024.
        Each row is one year — hues sorted left to right.
      </p>
    </header>

    <div v-if="error" class="status">Palette data not yet generated — run <code>pnpm palette:extract</code> first.</div>
    <div v-else-if="loading" class="status">Loading palette…</div>

    <div class="chart-wrap" ref="wrapEl">
      <canvas ref="canvasEl"></canvas>
      <div
        v-if="tooltip.visible"
        class="tooltip"
        :style="{ top: tooltip.y + 'px', left: tooltip.x + 'px' }"
      >
        {{ tooltip.year }} · {{ tooltip.count }} posters
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const wrapEl   = ref(null)
const canvasEl = ref(null)
const loading  = ref(true)
const error    = ref(false)
const tooltip  = ref({ visible: false, year: 0, count: 0, x: 0, y: 0 })

let colorData = {}
let years = []
const ROW_H = 9

function hslHue(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  if (d < 0.05) return Infinity  // near-gray → push to end
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0)
           : max === g ? (b - r) / d + 2
           :             (r - g) / d + 4
  return h / 6
}

function render() {
  const canvas = canvasEl.value
  const wrap   = wrapEl.value
  if (!canvas || !wrap || !years.length) return

  const dpr    = window.devicePixelRatio || 1
  const cs     = getComputedStyle(document.documentElement)
  const inkMuted = cs.getPropertyValue('--ink-muted').trim()
  const rule     = cs.getPropertyValue('--rule').trim()
  const bg       = cs.getPropertyValue('--bg').trim()

  const W      = wrap.clientWidth
  const LABEL  = 52
  const colorW = W - LABEL
  const H      = years.length * ROW_H

  canvas.width        = W * dpr
  canvas.height       = H * dpr
  canvas.style.width  = W + 'px'
  canvas.style.height = H + 'px'

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  ctx.font         = '10px Inter, system-ui, sans-serif'
  ctx.textAlign    = 'right'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < years.length; i++) {
    const year   = years[i]
    const y      = i * ROW_H
    const colors = [...(colorData[year] || [])].sort((a, b) => hslHue(a) - hslHue(b))
    const sw     = colorW / Math.max(colors.length, 1)

    for (let j = 0; j < colors.length; j++) {
      ctx.fillStyle = colors[j]
      ctx.fillRect(LABEL + j * sw, y, sw + 0.5, ROW_H)
    }

    if (year % 5 === 0) {
      ctx.fillStyle = inkMuted
      ctx.fillText(year, LABEL - 6, y + ROW_H / 2)
    }

    if (year % 10 === 0) {
      ctx.fillStyle = rule
      ctx.fillRect(0, y, W, 1)
    }
  }
}

function onMouseMove(e) {
  const rect = canvasEl.value.getBoundingClientRect()
  const i    = Math.floor((e.clientY - rect.top) / ROW_H)
  if (i >= 0 && i < years.length) {
    tooltip.value = {
      visible: true,
      year:  years[i],
      count: (colorData[years[i]] || []).length,
      x: e.offsetX + 14,
      y: i * ROW_H - 4,
    }
  }
}

function onMouseLeave() { tooltip.value.visible = false }

let ro = null

onMounted(async () => {
  try {
    colorData = await $fetch('/poster-colors.json')
    years     = Object.keys(colorData).map(Number).sort((a, b) => a - b)
  } catch {
    error.value = true
  }
  loading.value = false

  await nextTick()
  render()

  canvasEl.value?.addEventListener('mousemove', onMouseMove)
  canvasEl.value?.addEventListener('mouseleave', onMouseLeave)

  ro = new ResizeObserver(render)
  ro.observe(wrapEl.value)
})

onUnmounted(() => {
  ro?.disconnect()
  canvasEl.value?.removeEventListener('mousemove', onMouseMove)
  canvasEl.value?.removeEventListener('mouseleave', onMouseLeave)
})
</script>

<style scoped>
.palette-page {
  position: fixed;
  inset: 0;
  padding: 96px 48px 48px;
  overflow-y: auto;
}

header { margin-bottom: 28px; }

.editorial-title {
  font-size: 48px;
  margin: 6px 0 10px;
}

.lede {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 16px;
  color: var(--ink-muted);
  line-height: 1.5;
  margin: 0;
}

.chart-wrap {
  position: relative;
  width: 100%;
}

canvas { display: block; }

.tooltip {
  position: absolute;
  background: var(--bg-elevated);
  border: 1px solid var(--rule);
  padding: 4px 10px;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--ink-muted);
  pointer-events: none;
  white-space: nowrap;
  border-radius: 3px;
  z-index: 10;
}

.status {
  font-family: var(--font-serif);
  font-style: italic;
  color: var(--ink-muted);
  font-size: 15px;
  margin-bottom: 16px;
}

code {
  font-family: monospace;
  background: var(--accent-soft);
  padding: 1px 5px;
  border-radius: 3px;
  font-style: normal;
  font-size: 13px;
}
</style>
