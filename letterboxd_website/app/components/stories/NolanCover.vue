<template>
  <section ref="root" class="cover">
    <div class="grid-bg" aria-hidden="true"></div>
    <div class="vignette" aria-hidden="true"></div>

    <NuxtLink to="/stories" class="back-btn">← Stories</NuxtLink>

    <div class="content">
      <div class="eyebrow-row">
        <div class="rule"></div>
        <div class="eyebrow">Stories</div>
      </div>

      <h1 class="title">
        The Architecture<br>
        <em>of Time</em>
      </h1>

      <p class="subtitle">The Christopher Nolan eras.</p>

      <p class="lede">
        <template v-if="meta && meta.totalFilms">
          {{ meta.totalFilms }} films across {{ meta.careerSpan[0] }} to {{ meta.careerSpan[1] }}.
          Three eras, three mechanics, one director rebuilding the clock.
        </template>
        <template v-else>
          Three eras, three mechanics, one director rebuilding the clock.
        </template>
      </p>
    </div>

    <div class="scroll-cue" aria-hidden="true">
      <svg class="chevron" viewBox="0 0 24 24" width="30" height="30">
        <polyline points="6,9 12,15 18,9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

defineProps<{
  meta?: { totalFilms: number; careerSpan: [number | null, number | null] }
}>()

const emit = defineEmits<{ (e: 'visible'): void }>()

const root = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!root.value || typeof IntersectionObserver === 'undefined') {
    emit('visible')
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
          emit('visible')
        }
      }
    },
    { threshold: [0.45, 0.6] }
  )
  observer.observe(root.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.cover {
  position: relative;
  min-height: 100vh;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: radial-gradient(ellipse at 50% 40%, #1a1a22 0%, #0a0a12 50%, #04040a 100%);
  color: #e8e9f0;
  overflow: hidden;
}

.grid-bg {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(232,233,240,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(232,233,240,0.04) 1px, transparent 1px);
  background-size: 80px 80px;
  pointer-events: none;
}

.vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%);
  pointer-events: none;
}

.back-btn {
  position: absolute;
  top: 32px;
  left: 36px;
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(232,233,240,0.55);
  padding: 8px 4px;
  z-index: 10;
  transition: color 200ms ease;
}
.back-btn:hover { color: rgba(232,233,240,0.95); }

.content {
  position: relative;
  text-align: center;
  max-width: 820px;
}

.eyebrow-row { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 32px; }
.rule { height: 1px; width: 50px; background: rgba(160,180,220,0.7); }
.eyebrow {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #a0b4dc;
  font-weight: 600;
}

.title {
  font-family: var(--font-serif);
  font-size: clamp(54px, 9vw, 116px);
  line-height: 0.95;
  font-weight: 400;
  letter-spacing: -0.02em;
  margin: 0 0 22px;
}
.title em { font-style: italic; color: #a0b4dc; }

.subtitle {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(18px, 2vw, 22px);
  color: rgba(232,233,240,0.65);
  margin: 0 0 26px;
}

.lede {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.6;
  color: rgba(232,233,240,0.55);
  max-width: 520px;
  margin: 0 auto 60px;
}

.scroll-cue {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(232,233,240,0.85);
  pointer-events: none;
}
.chevron {
  display: block;
  animation: scroll-drop 1.6s ease-in-out infinite;
}
@keyframes scroll-drop {
  0%, 100% { transform: translateY(0); opacity: 0.6; }
  50%      { transform: translateY(14px); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .chevron { animation: none; }
}

@media (max-width: 720px) {
  .cover { padding: 80px 24px 40px; min-height: 100svh; }
}
</style>
