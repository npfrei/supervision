<template>
  <div class="constellations-page">
    <template v-if="hasSlug">
      <button class="back-btn" @click="onBack">← Back</button>
      <div class="top-right" :class="{ 'is-hidden': sidebarOpen }">
        <span class="eyebrow">Constellation</span>
        <ActorPicker @pick="onPick" />
      </div>
      <ActorGraph :slug="slug" :personName="personName" @sidebar-state="onSidebarState" />
    </template>

    <section v-else class="landing">
      <div class="landing-eyebrow eyebrow">Constellations</div>
      <h1 class="landing-title">
        Find your favourite actor&rsquo;s<br>
        <em>most relevant collaborators.</em>
      </h1>
      <p class="landing-lede">
        Search for an actor or a director to see the constellation of names they keep
        sharing the frame with.
      </p>
      <div class="landing-picker">
        <ActorPicker @pick="onPick" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
const route = useRoute()
const router = useRouter()

const slug = computed(() => String(route.params.slug || ''))
const personName = computed(() => String(route.query.name || ''))
const hasSlug = computed(() => slug.value.length > 0)
const sidebarOpen = ref(false)

function onPick(payload: { slug: string; name: string }) {
  router.push({ path: `/constellations/${payload.slug}`, query: { name: payload.name } })
}

function onSidebarState(open: boolean) {
  sidebarOpen.value = open
}

function onBack() {
  router.push('/constellations')
}
</script>

<style scoped>
.constellations-page { position: fixed; inset: 0; }

.back-btn {
  position: absolute;
  top: 90px;
  left: 48px;
  z-index: 5;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-muted);
  transition: color 150ms ease;
}
.back-btn:hover { color: var(--ink); }

.top-right {
  position: absolute;
  top: 82px;
  right: 48px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: opacity 200ms ease, transform 200ms ease;
}
.top-right.is-hidden {
  opacity: 0;
  transform: translateX(20px);
  pointer-events: none;
}

.landing {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 32px;
}
.landing-eyebrow {
  margin-bottom: 22px;
}
.landing-title {
  font-family: var(--font-serif);
  font-size: clamp(40px, 5.4vw, 64px);
  font-weight: 400;
  line-height: 1.05;
  letter-spacing: -0.015em;
  color: var(--ink);
  margin: 0 0 18px;
  max-width: 820px;
}
.landing-title em {
  font-style: italic;
  color: var(--accent);
}
.landing-lede {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 17px;
  line-height: 1.45;
  color: var(--ink-muted);
  max-width: 520px;
  margin: 0 0 40px;
}
.landing-picker {
  display: flex;
  justify-content: center;
  width: 100%;
}
</style>
