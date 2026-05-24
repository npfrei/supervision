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
        <div class="eyebrow">Era {{ era.roman }} · {{ era.yearRange[0] }} to {{ displayHi }}</div>
      </div>

      <h2 class="title reveal r2">
        {{ era.title }}<br><em>{{ era.titleAccent }}</em>
      </h2>

      <p class="quote reveal r3">
        “{{ era.quote.text }}”
        <span class="attribution">{{ era.quote.attribution }}</span>
      </p>

      <p class="lede reveal r4">{{ era.lede }}</p>

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

          <div class="label themes-label">Themes of the era</div>
          <ul class="themes">
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
    .replace(/[̀-ͯ]/g, '')
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
  color: #e8d9b8;
  overflow: hidden;
}

.reel[data-era='i']   { background: linear-gradient(180deg, #0a0a0a 0%, #1a1208 60%, #2a1a0a 100%); }
.reel[data-era='ii']  { background: linear-gradient(180deg, #1a0d0d 0%, #2a1410 55%, #160a0a 100%); }
.reel[data-era='iii'] { background: linear-gradient(180deg, #0a0f14 0%, #15181c 55%, #0a0a10 100%); }
.reel[data-era='iv']  { background: linear-gradient(180deg, #0a0a0a 0%, #14110d 55%, #08070a 100%); }

.grain {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.018) 1px, transparent 1px);
  background-size: 3px 3px;
  opacity: 0.4;
  mix-blend-mode: overlay;
  pointer-events: none;
}

.hero-poster {
  position: absolute;
  top: 50%; right: 4%;
  width: clamp(280px, 32vw, 460px);
  height: clamp(420px, 48vw, 680px);
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 1200ms ease 200ms;
  pointer-events: none;
  filter: blur(0.5px) saturate(0.7);
}
.hero-poster img {
  width: 100%; height: 100%; object-fit: cover;
  border-radius: 2px;
  mask-image: radial-gradient(ellipse at center, black 35%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 35%, transparent 80%);
}
.reel.visible .hero-poster { opacity: 0.18; }

.reel-marker {
  position: absolute;
  top: 32px; right: 56px;
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 13px;
  letter-spacing: 0.3em;
  opacity: 0.35;
}

.content {
  position: relative;
  max-width: 760px;
  width: 100%;
  margin: 0 auto 0 0;
}

.eyebrow-row { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.rule { height: 1px; width: 40px; background: #c2410c; opacity: 0.8; }
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
  font-size: clamp(48px, 7vw, 80px);
  line-height: 0.96;
  font-weight: 400;
  letter-spacing: -0.02em;
  margin: 0 0 22px;
}
.title em { font-style: italic; color: #e07a3a; }

.quote {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(17px, 1.7vw, 22px);
  line-height: 1.35;
  color: rgba(232,217,184,0.7);
  margin: 0 0 30px;
  max-width: 520px;
}
.attribution {
  display: block;
  font-style: normal;
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.25em;
  color: rgba(232,217,184,0.45);
  text-transform: uppercase;
  margin-top: 8px;
}

.lede {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.65;
  color: rgba(232,217,184,0.72);
  max-width: 560px;
  margin: 0 0 44px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  max-width: 720px;
  margin-bottom: 56px;
}

.label {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #c2410c;
  margin-bottom: 16px;
}
.themes-label { margin-top: 28px; }

.film-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; gap: 12px;
}
.film { width: 78px; }
.poster {
  width: 78px; height: 116px;
  border-radius: 2px;
  overflow: hidden;
  background: #1a1208;
  margin-bottom: 10px;
}
.poster img {
  width: 100%; height: 100%; object-fit: cover;
  filter: saturate(0.85);
}
.poster-fallback {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, #3a2418 0%, #1a0e08 100%);
}
.film-name {
  font-family: var(--font-serif);
  font-size: 12px; line-height: 1.25;
  color: rgba(232,217,184,0.9);
}
.film-year {
  font-family: var(--font-sans);
  font-size: 10px;
  color: rgba(232,217,184,0.45);
  margin-top: 2px;
}

.troupe-list {
  list-style: none; padding: 0; margin: 0;
  font-family: var(--font-serif);
  font-size: 16px;
  line-height: 1.55;
}
.troupe-link {
  color: rgba(232,217,184,0.92);
  display: inline-block;
  border-bottom: 1px solid transparent;
  transition: color 180ms ease, border-color 180ms ease;
}
.troupe-link:hover {
  color: #e07a3a;
  border-bottom-color: rgba(224,122,58,0.5);
}
.troupe-list li.faint .troupe-link { color: rgba(232,217,184,0.55); }
.troupe-list li.faint .troupe-link:hover { color: #e07a3a; }

.themes {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-wrap: wrap; gap: 6px;
}
.theme-chip {
  font-family: var(--font-sans);
  font-size: 11px;
  padding: 5px 11px;
  border: 1px solid rgba(224,122,58,0.35);
  border-radius: 999px;
  color: rgba(232,217,184,0.85);
}

.scroll-hint {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(232,217,184,0.8);
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
  .hero-poster { transition: none; opacity: 0.18; }
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
