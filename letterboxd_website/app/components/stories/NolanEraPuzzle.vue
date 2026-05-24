<template>
  <section ref="root" class="era" :class="{ visible: isVisible }">
    <div class="noise" aria-hidden="true"></div>

    <div class="hero-poster" v-if="heroPoster" aria-hidden="true">
      <img :src="heroPoster" :alt="''" loading="lazy" />
    </div>

    <div class="era-marker" aria-hidden="true">{{ era.roman }}</div>

    <div class="content">
      <!-- Title at the top (standard). The "Memento effect" runs through the
           body: insight up-front, films in reverse chronology, lede last. -->

      <div class="title-row reveal r1">
        <div class="rule"></div>
        <div class="eyebrow">Era {{ era.roman }} · {{ era.yearRange[0] }} to {{ era.yearRange[1] }}</div>
      </div>

      <h2 class="title reveal r2">
        {{ era.title }}<br><em>{{ era.titleAccent }}</em>
      </h2>

      <p class="tagline reveal r3">{{ era.tagline }}</p>

      <div class="reverse-banner reveal r4">Read end to beginning</div>

      <p class="insight reveal r5">{{ era.insight }}</p>

      <p class="quote reveal r6">
        &ldquo;{{ era.quote.text }}&rdquo;
        <span class="attribution">{{ era.quote.attribution }}</span>
      </p>

      <p class="lede reveal r7">{{ era.lede }}</p>

      <div class="grid reveal r8">
        <div>
          <div class="label">Key Films · most recent first</div>
          <div class="film-row">
            <div v-for="f in filmsReversed" :key="f.id" class="polaroid">
              <div class="polaroid-photo">
                <img v-if="f.poster" :src="f.poster" :alt="f.name" loading="lazy" />
                <div v-else class="poster-fallback"></div>
              </div>
              <div class="polaroid-caption">
                <div class="film-name">{{ f.name }}</div>
                <div class="film-year">{{ f.year }}</div>
              </div>
            </div>
          </div>
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

const root = ref<HTMLElement | null>(null)
const isVisible = ref(false)
let observer: IntersectionObserver | null = null

const filmsReversed = computed(() =>
  [...props.era.films].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
)
const heroPoster = computed(() => filmsReversed.value[0]?.poster ?? null)

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
        if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
          isVisible.value = true
          emit('visible', props.era.id)
        }
      }
    },
    { threshold: [0.35, 0.5] }
  )
  observer.observe(root.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.era {
  position: relative;
  min-height: 100vh;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  padding: 96px 60px 80px;
  background: linear-gradient(180deg, #0d0d10 0%, #16161a 60%, #1a1a1f 100%);
  color: #e8e9f0;
  overflow: hidden;
}

.noise {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 2px 2px;
  opacity: 0.6;
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
  filter: blur(0.5px) saturate(0.7) contrast(1.05);
}
.hero-poster img {
  width: 100%; height: 100%; object-fit: cover;
  border-radius: 2px;
  mask-image: radial-gradient(ellipse at center, black 35%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 35%, transparent 80%);
}
.era.visible .hero-poster { opacity: 0.18; }

.era-marker {
  position: absolute;
  top: 32px;
  right: 56px;
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 13px;
  letter-spacing: 0.3em;
  opacity: 0.4;
}

.content {
  position: relative;
  max-width: 820px;
  width: 100%;
  margin: 0 auto 0 0;
}

.title-row { display: flex; align-items: center; gap: 16px; margin-bottom: 22px; }
.rule { height: 1px; width: 40px; background: #c8b288; opacity: 0.8; }
.eyebrow {
  font-family: var(--font-sans);
  font-size: 11px;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #c8b288;
  font-weight: 600;
}

.title {
  font-family: var(--font-serif);
  font-size: clamp(48px, 7vw, 80px);
  line-height: 0.95;
  font-weight: 400;
  letter-spacing: -0.02em;
  margin: 0 0 20px;
}
.title em { font-style: italic; color: #c8b288; }

.tagline {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(17px, 1.7vw, 21px);
  line-height: 1.35;
  color: rgba(232,233,240,0.7);
  margin: 0 0 18px;
  max-width: 580px;
}

.reverse-banner {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #c8b288;
  margin: 0 0 22px;
  display: inline-block;
  padding: 5px 10px;
  border: 1px solid rgba(200,178,136,0.35);
  border-radius: 2px;
}

.insight {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(18px, 1.9vw, 22px);
  line-height: 1.4;
  color: #f0e8d0;
  margin: 0 0 26px;
  max-width: 620px;
}

.quote {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(16px, 1.5vw, 20px);
  line-height: 1.35;
  color: rgba(232,233,240,0.6);
  margin: 0 0 26px;
  max-width: 520px;
}
.attribution {
  display: block;
  font-style: normal;
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.25em;
  color: rgba(232,233,240,0.4);
  text-transform: uppercase;
  margin-top: 8px;
}

.lede {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.65;
  color: rgba(232,233,240,0.72);
  max-width: 580px;
  margin: 0 0 38px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  max-width: 720px;
}

.label {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #c8b288;
  margin-bottom: 14px;
}
.themes-label { margin-top: 26px; }

.film-row { display: flex; gap: 12px; flex-wrap: wrap; }
.polaroid {
  background: #f5efe0;
  padding: 5px 5px 12px;
  box-shadow: 0 4px 14px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3);
  width: 86px;
  transform: rotate(-1deg);
  transition: transform 200ms ease;
}
.polaroid:nth-child(2n) { transform: rotate(1.5deg); }
.polaroid:nth-child(3n) { transform: rotate(-0.6deg); }
.polaroid:hover { transform: rotate(0deg) translateY(-4px); }
.polaroid-photo {
  width: 100%;
  aspect-ratio: 2/3;
  background: #1a1a1a;
  overflow: hidden;
  filter: saturate(0.85) contrast(1.05);
}
.polaroid-photo img { width: 100%; height: 100%; object-fit: cover; }
.poster-fallback { width: 100%; height: 100%; background: linear-gradient(135deg, #444 0%, #1a1a1a 100%); }
.polaroid-caption {
  font-family: 'Courier New', monospace;
  text-align: center;
  margin-top: 7px;
  color: #1a1a1a;
}
.film-name { font-size: 10px; line-height: 1.2; font-weight: 700; }
.film-year { font-size: 9px; opacity: 0.6; margin-top: 1px; }

.troupe-list {
  list-style: none;
  padding: 0;
  margin: 0;
  font-family: var(--font-serif);
  font-size: 16px;
  line-height: 1.55;
}
.troupe-link {
  color: rgba(232,233,240,0.92);
  display: inline-block;
  border-bottom: 1px solid transparent;
  transition: color 180ms ease, border-color 180ms ease;
}
.troupe-link:hover { color: #c8b288; border-bottom-color: rgba(200,178,136,0.5); }
.troupe-list li.faint .troupe-link { color: rgba(232,233,240,0.55); }

.themes { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.theme-chip {
  font-family: var(--font-sans);
  font-size: 11px;
  padding: 5px 11px;
  border: 1px solid rgba(200,178,136,0.4);
  border-radius: 999px;
  color: rgba(232,233,240,0.85);
}

.reveal {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 700ms ease, transform 700ms ease;
}
.era.visible .reveal { opacity: 1; transform: translateY(0); }
.era.visible .r1 { transition-delay: 80ms; }
.era.visible .r2 { transition-delay: 200ms; }
.era.visible .r3 { transition-delay: 340ms; }
.era.visible .r4 { transition-delay: 460ms; }
.era.visible .r5 { transition-delay: 580ms; }
.era.visible .r6 { transition-delay: 700ms; }
.era.visible .r7 { transition-delay: 820ms; }
.era.visible .r8 { transition-delay: 960ms; }

.scroll-hint {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(232,233,240,0.65);
  pointer-events: none;
}
.scroll-hint .chevron { display: block; animation: scroll-drop 1.6s ease-in-out infinite; }
@keyframes scroll-drop {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50%      { transform: translateY(14px); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
  .scroll-hint .chevron { animation: none; }
  .polaroid { transform: none !important; }
  .hero-poster { transition: none; opacity: 0.18; }
}

@media (max-width: 960px) {
  .grid { grid-template-columns: 1fr; gap: 28px; }
  .hero-poster {
    top: 0; right: 0; width: 100%; height: 100%;
    transform: none;
  }
  .hero-poster img {
    mask-image: radial-gradient(ellipse at 80% 30%, black 10%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse at 80% 30%, black 10%, transparent 70%);
  }
  .era.visible .hero-poster { opacity: 0.12; }
}

@media (max-width: 720px) {
  .era { padding: 80px 24px 60px; scroll-snap-align: none; }
  .era-marker { right: 24px; top: 20px; font-size: 11px; }
  .title { font-size: clamp(40px, 11vw, 60px); }
  .content { max-width: 100%; }
}
</style>
