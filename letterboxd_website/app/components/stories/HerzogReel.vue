<template>
  <section
    ref="root"
    class="reel"
    :class="{ visible: isVisible }"
    :data-era="era.id"
  >
    <div class="grain" aria-hidden="true"></div>

    <div class="hero-poster" v-if="heroPoster" aria-hidden="true">
      <img :src="heroPoster" :alt="''" loading="lazy" />
    </div>

    <div class="reel-marker" aria-hidden="true">{{ era.roman }}</div>

    <div class="content">
      <div class="eyebrow-row reveal r1">
        <div class="rule"></div>
        <div class="eyebrow">Theme {{ era.roman }}</div>
      </div>

      <h2 class="title reveal r2">
        {{ era.title }}<br><em>{{ era.titleAccent }}</em>
      </h2>

      <p v-if="era.quote.text" class="quote reveal r3">
        "{{ era.quote.text }}"
        <span class="attribution">{{ era.quote.attribution }}</span>
      </p>

      <p v-if="era.lede" class="lede reveal r4">{{ era.lede }}</p>

      <div class="grid reveal r5">
        <div class="films">
          <div class="label">Signature films</div>
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
          <div class="label">The troupe</div>
          <ul class="troupe-list">
            <li v-for="(p, i) in era.troupe" :key="p.name" :class="{ faint: i >= 2 }">
              <NuxtLink
                :to="{ path: `/constellations/${slugify(p.name)}`, query: { name: p.name } }"
                class="troupe-link"
              >{{ p.name }}</NuxtLink>
            </li>
          </ul>

          <div v-if="era.themes.length" class="label themes-label">Themes of the era</div>
          <ul v-if="era.themes.length" class="themes">
            <li v-for="t in era.themes" :key="t" class="theme-chip">{{ t }}</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="scroll-hint" aria-hidden="true">
      <svg class="chevron" viewBox="0 0 24 24" width="28" height="28">
        <polyline points="6,9 12,15 18,9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
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
  quote: { text: string; attribution: string }
  lede: string
  themes: string[]
  films: Array<{ id: number; name: string; year: number | null; poster: string | null }>
  troupe: Array<{ name: string; films: number }>
}

const props = defineProps<{
  era: Era
}>()

const emit = defineEmits<{ (e: 'visible', id: string): void }>()

const root = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let observer: IntersectionObserver | null = null

const displayHi = computed(() =>
  props.era.yearRange[1] >= new Date().getFullYear() ? 'present' : String(props.era.yearRange[1])
)

const heroPoster = computed(() => props.era.films[0]?.poster ?? null)

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

onMounted(() => {
  if (!root.value || typeof IntersectionObserver === 'undefined') {
    isVisible.value = true
    emit('visible', props.era.id)
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
          isVisible.value = true
          emit('visible', props.era.id)
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
.reel {
  position: relative;
  min-height: 100vh;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  padding: 96px 60px 80px;
  color: #d4e8d8;
  overflow: hidden;
}

.reel[data-era='fiction-epics'] { background: linear-gradient(180deg, #07090a 0%, #0e1a10 60%, #0a1e12 100%); }
.reel[data-era='doc-war']        { background: linear-gradient(180deg, #0a0907 0%, #1a1408 55%, #120e07 100%); }
.reel[data-era='doc-people']     { background: linear-gradient(180deg, #09070a 0%, #140c18 55%, #0e0812 100%); }
.reel[data-era='doc-nature']     { background: linear-gradient(180deg, #07090a 0%, #0c1814 55%, #071410 100%); }

.grain {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.018) 1px, transparent 1px);
  background-size: 3px 3px;
  opacity: 0.5;
  mix-blend-mode: overlay;
  pointer-events: none;
}

.hero-poster {
  position: absolute;
  top: 0; right: -60px;
  width: 45%;
  height: 100%;
  pointer-events: none;
  opacity: 0;
  transition: opacity 1s ease 400ms;
}
.reel.visible .hero-poster { opacity: 0.15; }
.hero-poster img {
  width: 100%; height: 100%;
  object-fit: cover;
  object-position: center top;
  mask-image: linear-gradient(to left, black 0%, transparent 100%);
  -webkit-mask-image: linear-gradient(to left, black 0%, transparent 100%);
}

.reel-marker {
  position: absolute;
  top: 28px; right: 36px;
  font-family: var(--font-serif);
  font-size: 13px;
  letter-spacing: 0.18em;
  color: rgba(212,232,216,0.25);
  font-style: italic;
}

.content {
  position: relative;
  max-width: 620px;
}

.eyebrow-row {
  display: flex; align-items: center;
  gap: 14px; margin-bottom: 24px;
}
.rule { height: 1px; width: 40px; background: rgba(58,180,80,0.7); }
.eyebrow {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #3ab450;
  font-weight: 600;
}

.title {
  font-family: var(--font-serif);
  font-size: clamp(40px, 6vw, 80px);
  line-height: 0.96;
  font-weight: 400;
  letter-spacing: -0.02em;
  margin: 0 0 28px;
}
.title em {
  font-style: italic;
  color: #3ab450;
}

.quote {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(16px, 1.8vw, 20px);
  line-height: 1.4;
  color: rgba(212,232,216,0.75);
  margin: 0 0 20px;
  padding-left: 18px;
  border-left: 2px solid rgba(58,180,80,0.4);
}
.attribution {
  display: block;
  font-size: 12px;
  font-style: normal;
  letter-spacing: 0.12em;
  color: rgba(212,232,216,0.45);
  margin-top: 8px;
}

.lede {
  font-family: var(--font-serif);
  font-size: clamp(15px, 1.5vw, 17px);
  line-height: 1.7;
  color: rgba(212,232,216,0.7);
  margin: 0 0 36px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 48px;
  align-items: start;
}

.label {
  font-family: var(--font-sans);
  font-size: 9px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: rgba(212,232,216,0.4);
  margin-bottom: 12px;
}
.themes-label { margin-top: 28px; }

.film-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-wrap: wrap; gap: 16px;
}
.film { width: 72px; }
.poster {
  width: 72px; height: 108px;
  background: rgba(212,232,216,0.06);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}
.poster img { width: 100%; height: 100%; object-fit: cover; }
.poster-fallback { width: 100%; height: 100%; }
.film-name {
  font-family: var(--font-serif);
  font-size: 12px; line-height: 1.25;
  color: rgba(212,232,216,0.9);
}
.film-year {
  font-family: var(--font-sans);
  font-size: 10px;
  color: rgba(212,232,216,0.45);
  margin-top: 2px;
}

.troupe-list {
  list-style: none; padding: 0; margin: 0;
  font-family: var(--font-serif);
  font-size: 16px;
  line-height: 1.55;
}
.troupe-link {
  color: rgba(212,232,216,0.92);
  display: inline-block;
  border-bottom: 1px solid transparent;
  transition: color 180ms ease, border-color 180ms ease;
}
.troupe-link:hover {
  color: #3ab450;
  border-bottom-color: rgba(58,180,80,0.5);
}
.troupe-list li.faint .troupe-link { color: rgba(212,232,216,0.55); }
.troupe-list li.faint .troupe-link:hover { color: #3ab450; }

.themes {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-wrap: wrap; gap: 6px;
}
.theme-chip {
  font-family: var(--font-sans);
  font-size: 11px;
  padding: 5px 11px;
  border: 1px solid rgba(58,180,80,0.35);
  border-radius: 999px;
  color: rgba(212,232,216,0.85);
}

.scroll-hint {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(212,232,216,0.8);
  pointer-events: none;
}
.scroll-hint .chevron {
  display: block;
  animation: scroll-drop 1.6s ease-in-out infinite;
}

@keyframes scroll-drop {
  0%, 100% { transform: translateY(0); opacity: 0.55; }
  50%      { transform: translateY(14px); opacity: 1; }
}

/* Reveal animations */
.reveal {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 700ms ease, transform 700ms ease;
}
.reel.visible .reveal { opacity: 1; transform: translateY(0); }
.reel.visible .r1 { transition-delay: 80ms; }
.reel.visible .r2 { transition-delay: 180ms; }
.reel.visible .r3 { transition-delay: 320ms; }
.reel.visible .r4 { transition-delay: 460ms; }
.reel.visible .r5 { transition-delay: 600ms; }

@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
  .hero-poster { transition: none; opacity: 0.15; }
  .scroll-hint .chevron { animation: none; }
}

@media (max-width: 960px) {
  .grid { grid-template-columns: 1fr; gap: 36px; }
  .hero-poster {
    top: 0; right: 0; width: 100%; height: 100%;
    transform: none;
  }
  .hero-poster img {
    mask-image: radial-gradient(ellipse at 80% 30%, black 10%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse at 80% 30%, black 10%, transparent 70%);
  }
  .reel.visible .hero-poster { opacity: 0.12; }
}

@media (max-width: 720px) {
  .reel { padding: 80px 24px 60px; min-height: 100svh; scroll-snap-align: none; }
  .reel-marker { right: 24px; top: 20px; font-size: 11px; }
  .title { font-size: clamp(40px, 11vw, 60px); }
  .content { max-width: 100%; }
}
</style>
