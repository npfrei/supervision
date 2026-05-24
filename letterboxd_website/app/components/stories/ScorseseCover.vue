<template>
  <section ref="root" class="cover">
    <div class="grain" aria-hidden="true"></div>
    <div class="vignette" aria-hidden="true"></div>

    <NuxtLink to="/stories" class="back-btn">← Stories</NuxtLink>

    <div class="content">
      <div class="eyebrow-row">
        <div class="rule"></div>
        <div class="eyebrow">Stories</div>
      </div>

      <h1 class="title">
        America&rsquo;s Chronicler<br>
        <em>Scorsese&rsquo;s Visual Journey</em>
      </h1>

      <p class="lede">
        <template v-if="meta && meta.totalFilms">
          {{ meta.totalFilms }} films across {{ meta.careerSpan[0] }} to {{ meta.careerSpan[1] }}.
          The director, his troupe, and the eras that made them.
        </template>
        <template v-else>
          The director, his troupe, and the eras that made them.
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
  padding: 60px 60px;
  background:
    radial-gradient(ellipse at 50% 30%, #2a1a0c 0%, #14110d 45%, #08070a 100%);
  color: #e8d9b8;
  overflow: hidden;
}

.grain {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 3px 3px;
  opacity: 0.5;
  mix-blend-mode: overlay;
  pointer-events: none;
}

.vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%);
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
  color: rgba(232,217,184,0.55);
  padding: 8px 4px;
  z-index: 10;
  transition: color 200ms ease;
}
.back-btn:hover { color: rgba(232,217,184,0.95); }

.content {
  position: relative;
  text-align: center;
  max-width: 720px;
}

.eyebrow-row {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; margin-bottom: 32px;
}
.rule { height: 1px; width: 50px; background: rgba(224,122,58,0.7); }
.eyebrow {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #e07a3a;
  font-weight: 600;
}

.title {
  font-family: var(--font-serif);
  font-size: clamp(54px, 9vw, 112px);
  line-height: 0.96;
  font-weight: 400;
  letter-spacing: -0.02em;
  margin: 0 0 24px;
}
.title em {
  font-style: italic;
  color: #e07a3a;
}

.subtitle {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(18px, 2vw, 22px);
  line-height: 1.35;
  color: rgba(232,217,184,0.65);
  margin: 0 0 28px;
}

.lede {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.6;
  color: rgba(232,217,184,0.55);
  max-width: 460px;
  margin: 0 auto 64px;
}

.scroll-cue {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(232,217,184,0.85);
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
  .scroll-cue { opacity: 0.7; }
}

@media (max-width: 720px) {
  .cover { padding: 80px 24px 40px; min-height: 100svh; }
  .lede { margin-bottom: 40px; }
}
</style>
