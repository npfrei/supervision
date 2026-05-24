<template>
  <section
    ref="root"
    class="era"
    :class="{ visible: isVisible, impacted, mono: !impacted }"
  >
    <div class="filmstrip top" aria-hidden="true">
      <div v-for="n in 18" :key="'t'+n" class="sprocket"></div>
    </div>
    <div class="filmstrip bottom" aria-hidden="true">
      <div v-for="n in 18" :key="'b'+n" class="sprocket"></div>
    </div>

    <div class="lensflare" aria-hidden="true"></div>

    <div class="corner" aria-hidden="true">
      <div class="era-marker">{{ era.roman }}</div>
      <div class="clock" v-show="isVisible && !impacted">
        <span class="clock-pulse"></span>
        <span class="clock-value">{{ formatClock(countdown) }}</span>
      </div>
      <div class="clock impacted" v-show="impacted">Impact</div>
    </div>

    <div class="content">
      <div class="title-row reveal r1">
        <div class="rule"></div>
        <div class="eyebrow">Era {{ era.roman }} · {{ era.yearRange[0] }} to {{ displayHi }}</div>
      </div>

      <h2 class="title reveal r2">
        {{ era.title }}<br><em>{{ era.titleAccent }}</em>
      </h2>

      <p class="tagline reveal r3">{{ era.tagline }}</p>

      <p class="quote reveal r4">
        &ldquo;{{ era.quote.text }}&rdquo;
        <span class="attribution">{{ era.quote.attribution }}</span>
      </p>

      <p class="lede reveal r5">{{ era.lede }}</p>

      <div class="grid reveal r6">
        <div>
          <div class="label">Key Films</div>
          <ul class="film-list">
            <li v-for="f in era.films" :key="f.id" class="film">
              <div class="poster">
                <img v-if="f.poster" :src="f.poster" :alt="f.name" loading="lazy" />
                <div v-else class="poster-fallback"></div>
              </div>
              <div class="film-name">{{ f.name }}</div>
              <div class="film-year">{{ f.year }}</div>
            </li>
          </ul>
        </div>

        <div class="side">
          <div class="label">The Troupe</div>
          <ul class="troupe-list">
            <li v-for="(p, i) in era.troupe" :key="p.name" :class="{ faint: i >= 2 }">
              <NuxtLink :to="{ path: `/constellations/${slugify(p.name)}`, query: { name: p.name } }" class="troupe-link">
                {{ p.name }}
              </NuxtLink>
            </li>
          </ul>

          <div class="label themes-label">Themes</div>
          <ul class="themes">
            <li v-for="t in era.themes" :key="t" class="theme-chip">{{ t }}</li>
          </ul>
        </div>
      </div>

      <p class="insight reveal r7">{{ era.insight }}</p>
    </div>

    <div class="impact-flash" :class="{ go: impacted }" aria-hidden="true"></div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

type Era = {
  id: string
  roman: string
  yearRange: [number, number]
  title: string
  titleAccent: string
  tagline: string
  quote: { text: string; attribution: string }
  lede: string
  themes: string[]
  insight: string
  films: Array<{ id: number; name: string; year: number | null; poster: string | null }>
  troupe: Array<{ name: string; films: number }>
}

const props = defineProps<{ era: Era }>()
const emit = defineEmits<{ (e: 'visible', id: string): void }>()

const COUNTDOWN_SECONDS = 25
const root = ref<HTMLElement | null>(null)
const isVisible = ref(false)
const countdown = ref(COUNTDOWN_SECONDS)
const impacted = ref(false)
let observer: IntersectionObserver | null = null
let tickHandle: number | null = null

const displayHi = computed(() =>
  props.era.yearRange[1] >= new Date().getFullYear() ? 'present' : String(props.era.yearRange[1])
)

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function formatClock(s: number): string {
  const m = Math.floor(Math.max(0, s) / 60)
  const sec = Math.max(0, s) % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function startCountdown() {
  if (tickHandle != null) return
  tickHandle = window.setInterval(() => {
    if (countdown.value <= 0) {
      window.clearInterval(tickHandle!)
      tickHandle = null
      impacted.value = true
      return
    }
    countdown.value -= 1
  }, 1000)
}

function stopCountdown() {
  if (tickHandle != null) {
    window.clearInterval(tickHandle)
    tickHandle = null
  }
}

onMounted(() => {
  if (!root.value) return

  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            isVisible.value = true
            emit('visible', props.era.id)
            startCountdown()
          } else if (!entry.isIntersecting) {
            stopCountdown()
          }
        }
      },
      { threshold: [0.35, 0.5] }
    )
    observer.observe(root.value)
  } else {
    isVisible.value = true
    emit('visible', props.era.id)
    startCountdown()
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  stopCountdown()
})
</script>

<style scoped>
.era {
  position: relative;
  min-height: 100vh;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  padding: 110px 60px 110px;
  background: #0a0a0a;
  color: #e8e9e0;
  overflow: hidden;
  transition: filter 1200ms ease;
}
.era.mono { filter: grayscale(0.9) contrast(1.05); }
.era.impacted { filter: grayscale(0) contrast(1); }

.filmstrip {
  position: absolute;
  left: 0; right: 0;
  height: 32px;
  background: #050505;
  display: flex; align-items: center; justify-content: space-around;
  z-index: 2;
}
.filmstrip.top { top: 0; border-bottom: 1px solid #1a1a1a; }
.filmstrip.bottom { bottom: 0; border-top: 1px solid #1a1a1a; }
.sprocket {
  width: 18px; height: 14px;
  background: #18181a;
  border-radius: 2px;
}

.lensflare {
  position: absolute;
  top: 20%; right: 12%;
  width: 280px; height: 280px;
  background: radial-gradient(circle, rgba(255,220,150,0.18) 0%, transparent 60%);
  pointer-events: none;
  mix-blend-mode: screen;
}

.corner {
  position: absolute;
  top: 48px; right: 56px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.era-marker {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 13px;
  letter-spacing: 0.3em;
  opacity: 0.55;
  color: #e8e9e0;
}

.clock {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid rgba(212,168,106,0.4);
  border-radius: 2px;
  background: rgba(10,10,10,0.55);
  font-family: 'Courier New', monospace;
  color: #e8e9e0;
  backdrop-filter: blur(4px);
}
.clock.impacted {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #d4a86a;
  border-color: rgba(212,168,106,0.6);
}
.clock-value {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
}
.clock-pulse {
  width: 8px; height: 8px;
  background: #d44a2a;
  border-radius: 50%;
  animation: tick 1s steps(2, end) infinite;
}
@keyframes tick {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0.2; }
}

.content {
  position: relative;
  max-width: 820px;
  width: 100%;
  margin: 0 auto 0 0;
  z-index: 3;
}

.title-row { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.rule { height: 1px; width: 40px; background: #d4a86a; }
.eyebrow {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #d4a86a;
  font-weight: 600;
}

.title {
  font-family: var(--font-serif);
  font-size: clamp(48px, 7vw, 84px);
  line-height: 0.95;
  font-weight: 400;
  letter-spacing: -0.02em;
  margin: 0 0 20px;
}
.title em { font-style: italic; color: #d4a86a; }

.tagline {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(17px, 1.7vw, 21px);
  line-height: 1.35;
  color: rgba(232,233,224,0.7);
  margin: 0 0 30px;
  max-width: 580px;
}

.quote {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(16px, 1.5vw, 20px);
  line-height: 1.35;
  color: rgba(232,233,224,0.6);
  margin: 0 0 32px;
  max-width: 520px;
}
.attribution {
  display: block;
  font-style: normal;
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.25em;
  color: rgba(232,233,224,0.4);
  text-transform: uppercase;
  margin-top: 8px;
}

.lede {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.65;
  color: rgba(232,233,224,0.72);
  max-width: 580px;
  margin: 0 0 40px;
}

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 36px; }
.label {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #d4a86a;
  margin-bottom: 14px;
}
.themes-label { margin-top: 26px; }

.film-list { list-style: none; padding: 0; margin: 0; display: flex; gap: 12px; }
.film { width: 88px; }
.poster {
  width: 88px; height: 130px;
  overflow: hidden;
  background: #1a1a1a;
  margin-bottom: 8px;
  border: 2px solid rgba(232,233,224,0.08);
}
.poster img { width: 100%; height: 100%; object-fit: cover; }
.poster-fallback { width: 100%; height: 100%; background: linear-gradient(135deg, #3a2a18 0%, #1a0e08 100%); }
.film-name { font-family: var(--font-serif); font-size: 12px; line-height: 1.25; color: rgba(232,233,224,0.95); }
.film-year { font-family: var(--font-sans); font-size: 10px; color: rgba(232,233,224,0.45); margin-top: 2px; }

.troupe-list { list-style: none; padding: 0; margin: 0; font-family: var(--font-serif); font-size: 16px; line-height: 1.55; }
.troupe-link {
  color: rgba(232,233,224,0.95);
  display: inline-block;
  border-bottom: 1px solid transparent;
  transition: color 180ms ease, border-color 180ms ease;
}
.troupe-link:hover { color: #d4a86a; border-bottom-color: rgba(212,168,106,0.5); }
.troupe-list li.faint .troupe-link { color: rgba(232,233,224,0.55); }

.themes { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.theme-chip {
  font-family: var(--font-sans);
  font-size: 11px;
  padding: 5px 11px;
  border: 1px solid rgba(212,168,106,0.4);
  border-radius: 1px;
  color: rgba(232,233,224,0.9);
}

.insight {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(18px, 1.8vw, 22px);
  line-height: 1.4;
  color: rgba(232,233,224,0.9);
  max-width: 640px;
  margin: 0;
}

.impact-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.0) 0%, transparent 70%);
  pointer-events: none;
  z-index: 6;
}
.impact-flash.go {
  background: radial-gradient(circle at 50% 50%, rgba(255,240,210,0.5) 0%, transparent 60%);
  animation: flash 1100ms ease-out forwards;
}
@keyframes flash {
  0%   { opacity: 0; }
  10%  { opacity: 1; }
  50%  { opacity: 0.6; }
  100% { opacity: 0; }
}

.reveal {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 700ms ease, transform 700ms ease;
}
.era.visible .reveal { opacity: 1; transform: translateY(0); }
.era.visible .r1 { transition-delay: 80ms; }
.era.visible .r2 { transition-delay: 200ms; }
.era.visible .r3 { transition-delay: 360ms; }
.era.visible .r4 { transition-delay: 520ms; }
.era.visible .r5 { transition-delay: 680ms; }
.era.visible .r6 { transition-delay: 840ms; }
.era.visible .r7 { transition-delay: 1000ms; }

@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
  .clock-pulse { animation: none; }
  .impact-flash.go { animation: none; opacity: 0; }
  .era { transition: none; }
}

@media (max-width: 720px) {
  .era { padding: 60px 24px 60px; scroll-snap-align: none; }
  .grid { grid-template-columns: 1fr; gap: 24px; }
  .corner { top: 32px; right: 24px; }
  .clock-value { font-size: 14px; }
  .filmstrip { height: 20px; }
}
</style>
