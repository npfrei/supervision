<template>
  <section ref="root" class="era" :class="{ visible: isVisible }">
    <!-- parallax background — moves at 0.2x scroll speed, like dream time -->
    <div class="parallax-layer" aria-hidden="true" :style="{ transform: `translateY(${parallaxY}px)` }">
      <div class="grid-major"></div>
      <div class="grid-minor"></div>
      <div class="horizon-1"></div>
      <div class="horizon-2"></div>
      <img v-if="heroPoster" class="hero-ghost" :src="heroPoster" alt="" loading="lazy" />
    </div>

    <div class="era-marker" aria-hidden="true">{{ era.roman }}</div>

    <div class="content">
      <div class="title-row reveal r1">
        <div class="rule"></div>
        <div class="eyebrow">Era {{ era.roman }} · {{ era.yearRange[0] }} to {{ era.yearRange[1] }}</div>
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
const parallaxY = ref(0)
let observer: IntersectionObserver | null = null
let rafId: number | null = null

const heroPoster = computed(() => props.era.films[0]?.poster ?? null)

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function updateParallax() {
  if (!root.value) return
  const rect = root.value.getBoundingClientRect()
  // when section's top is at viewport top, offset=0; as it scrolls up, offset grows
  const offsetFromTop = -rect.top
  parallaxY.value = offsetFromTop * 0.2
  rafId = null
}

function onScroll() {
  if (rafId == null) rafId = window.requestAnimationFrame(updateParallax)
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
          }
        }
      },
      { threshold: [0.35, 0.5] }
    )
    observer.observe(root.value)
  } else {
    isVisible.value = true
    emit('visible', props.era.id)
  }

  // listen on the scroll container — page uses fixed wrapper with internal scroll
  const scroller = root.value.closest('.story') as HTMLElement | null
  scroller?.addEventListener('scroll', onScroll, { passive: true })
  updateParallax()

  onBeforeUnmount(() => {
    observer?.disconnect()
    scroller?.removeEventListener('scroll', onScroll)
    if (rafId != null) cancelAnimationFrame(rafId)
  })
})
</script>

<style scoped>
.era {
  position: relative;
  min-height: 100vh;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  padding: 96px 60px 80px;
  background: linear-gradient(180deg, #000007 0%, #050616 60%, #07091e 100%);
  color: #d8def0;
  overflow: hidden;
}

.parallax-layer {
  position: absolute;
  inset: -20% 0;
  will-change: transform;
  pointer-events: none;
}
.grid-major {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(160,180,220,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(160,180,220,0.06) 1px, transparent 1px);
  background-size: 200px 200px;
}
.grid-minor {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(160,180,220,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(160,180,220,0.025) 1px, transparent 1px);
  background-size: 40px 40px;
}
.horizon-1 {
  position: absolute;
  top: 28%; left: -10%; right: -10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(160,180,220,0.4), transparent);
}
.horizon-2 {
  position: absolute;
  top: 64%; left: -10%; right: -10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(160,180,220,0.25), transparent);
}
.hero-ghost {
  position: absolute;
  top: 50%; right: 4%;
  width: clamp(280px, 32vw, 460px);
  height: auto;
  aspect-ratio: 2/3;
  object-fit: cover;
  opacity: 0;
  transform: translateY(-50%);
  filter: blur(1px) saturate(0.5);
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
  transition: opacity 1500ms ease 200ms;
}
.era.visible .hero-ghost { opacity: 0.22; }

.era-marker {
  position: absolute;
  top: 32px; right: 56px;
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
.rule { height: 1px; width: 40px; background: #a0b4dc; opacity: 0.8; }
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
  font-size: clamp(48px, 7vw, 84px);
  line-height: 0.95;
  font-weight: 400;
  letter-spacing: -0.02em;
  margin: 0 0 20px;
}
.title em { font-style: italic; color: #a0b4dc; }

.tagline {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(17px, 1.7vw, 21px);
  line-height: 1.35;
  color: rgba(216,222,240,0.7);
  margin: 0 0 30px;
  max-width: 580px;
}

.quote {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(16px, 1.5vw, 20px);
  line-height: 1.35;
  color: rgba(216,222,240,0.55);
  margin: 0 0 32px;
  max-width: 480px;
}
.attribution {
  display: block;
  font-style: normal;
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.25em;
  color: rgba(216,222,240,0.4);
  text-transform: uppercase;
  margin-top: 8px;
}

.lede {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.65;
  color: rgba(216,222,240,0.7);
  max-width: 580px;
  margin: 0 0 40px;
}

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 36px; }
.label {
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #a0b4dc;
  margin-bottom: 14px;
}
.themes-label { margin-top: 26px; }

.film-list { list-style: none; padding: 0; margin: 0; display: flex; gap: 12px; }
.film { width: 78px; }
.poster {
  width: 78px; height: 116px;
  border-radius: 1px;
  overflow: hidden;
  background: #0a0a1a;
  margin-bottom: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.6);
}
.poster img { width: 100%; height: 100%; object-fit: cover; }
.poster-fallback { width: 100%; height: 100%; background: linear-gradient(135deg, #1a1f3a 0%, #050616 100%); }
.film-name { font-family: var(--font-serif); font-size: 12px; line-height: 1.25; color: rgba(216,222,240,0.9); }
.film-year { font-family: var(--font-sans); font-size: 10px; color: rgba(216,222,240,0.4); margin-top: 2px; }

.troupe-list { list-style: none; padding: 0; margin: 0; font-family: var(--font-serif); font-size: 16px; line-height: 1.55; }
.troupe-link {
  color: rgba(216,222,240,0.92);
  border-bottom: 1px solid transparent;
  display: inline-block;
  transition: color 180ms ease, border-color 180ms ease;
}
.troupe-link:hover { color: #a0b4dc; border-bottom-color: rgba(160,180,220,0.5); }
.troupe-list li.faint .troupe-link { color: rgba(216,222,240,0.5); }

.themes { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.theme-chip {
  font-family: var(--font-sans);
  font-size: 11px;
  padding: 5px 11px;
  border: 1px solid rgba(160,180,220,0.35);
  border-radius: 999px;
  color: rgba(216,222,240,0.85);
}

.insight {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: clamp(18px, 1.8vw, 22px);
  line-height: 1.4;
  color: rgba(216,222,240,0.85);
  max-width: 640px;
  margin: 0;
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

.scroll-hint {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(216,222,240,0.7);
  pointer-events: none;
}
.scroll-hint .chevron { display: block; animation: scroll-drop 1.6s ease-in-out infinite; }
@keyframes scroll-drop {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50%      { transform: translateY(14px); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
  .parallax-layer { transform: none !important; }
  .scroll-hint .chevron { animation: none; }
  .hero-ghost { transition: none; opacity: 0.22; }
}

@media (max-width: 720px) {
  .era { padding: 80px 24px 60px; scroll-snap-align: none; }
  .grid { grid-template-columns: 1fr; gap: 24px; }
}
</style>
