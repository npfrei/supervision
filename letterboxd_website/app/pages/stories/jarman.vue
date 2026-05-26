<template>
  <div class="story" :class="{ 'reduced-motion': reducedMotion }">
    <JarmanCover :meta="data?.meta" @visible="onCoverVisible" />

    <JarmanReel
      v-for="era in eras"
      :key="era.id"
      :era="era"
      @visible="onReelVisible"
    />

    <section class="coda" data-coda>
      <div class="coda-inner">
        <div class="coda-links">
          <NuxtLink to="/atlas" class="coda-link">Find his films on the Atlas →</NuxtLink>
          <NuxtLink to="/constellations/derek-jarman?name=Derek+Jarman" class="coda-link">
            See the constellation →
          </NuxtLink>
        </div>
      </div>
    </section>

    <button
      v-if="hasAnyAudio && audio.currentLabel.value"
      class="audio-toggle"
      :class="{ on: audio.enabled.value }"
      @click="audio.toggle()"
      :aria-pressed="audio.enabled.value"
      :aria-label="audio.enabled.value ? 'Pause audio' : 'Play audio'"
    >
      <span class="dot" aria-hidden="true"></span>
      <span class="audio-label">
        <template v-if="audio.enabled.value && audio.currentLabel.value">
          Now playing · {{ audio.currentLabel.value }}
        </template>
        <template v-else>
          Play
        </template>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import JarmanCover from '~/components/stories/JarmanCover.vue'
import JarmanReel from '~/components/stories/JarmanReel.vue'
import { useEraAudio } from '~/composables/useEraAudio'

const { data } = await useFetch('/api/stories/jarman', { key: 'stories:jarman' })

const eras = computed(() => data.value?.eras ?? [])

const audioTracks = computed(() =>
  eras.value.map((e) => ({
    id: e.id,
    src: `/stories/jarman/audio/${e.audioTrack}`,
    label: e.audioLabel,
  }))
)

const audio = useEraAudio(audioTracks.value)
const hasAnyAudio = ref(false)

onMounted(async () => {
  if (!audioTracks.value.length) return
  const probed = await audio.probeAssets()
  hasAnyAudio.value = probed.some((p) => p.ok)
  audio.hasAssets.value = hasAnyAudio.value
})

function onReelVisible(id: string) {
  audio.setActive(id)
}

function onCoverVisible() {
  audio.setActive(null)
}

const reducedMotion = ref(false)
onMounted(() => {
  if (typeof window === 'undefined') return
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = mq.matches
  mq.addEventListener?.('change', (e) => (reducedMotion.value = e.matches))
})

useHead({ title: 'Derek Jarman · Stories' })
</script>

<style scoped>
.story {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  background: #07090a;
  color: #d8e4e8;
}

.story.reduced-motion {
  scroll-snap-type: none;
  scroll-behavior: auto;
}

@media (max-width: 720px) {
  .story { scroll-snap-type: none; }
}

.coda {
  position: relative;
  min-height: auto;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 60px 56px;
  background: linear-gradient(180deg, #07090a 0%, #0c1520 100%);
}
.coda-inner { max-width: 560px; text-align: center; }
.coda-links {
  display: flex; gap: 32px; justify-content: center; flex-wrap: wrap;
}
.coda-link {
  font-family: var(--font-sans);
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #3a82e0;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(58,130,224,0.4);
  transition: color 200ms ease, border-color 200ms ease;
}
.coda-link:hover { color: #d8e4e8; border-color: rgba(216,228,232,0.7); }

.audio-toggle {
  position: fixed;
  right: 32px;
  bottom: 28px;
  display: flex; align-items: center; gap: 10px;
  padding: 8px 16px 8px 12px;
  border: 1px solid rgba(216,228,232,0.18);
  border-radius: 999px;
  background: rgba(7,9,10,0.6);
  backdrop-filter: blur(8px);
  cursor: pointer;
  color: rgba(216,228,232,0.7);
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  z-index: 100;
  transition: color 200ms ease, border-color 200ms ease, background 200ms ease;
}
.audio-toggle:hover { color: rgba(216,228,232,0.95); border-color: rgba(216,228,232,0.35); }
.audio-toggle.on { color: #3a82e0; border-color: rgba(58,130,224,0.5); }
.audio-toggle .dot {
  width: 8px; height: 8px;
  border: 1px solid currentColor;
  border-radius: 50%;
  background: transparent;
  transition: background 200ms ease;
}
.audio-toggle.on .dot { background: #3a82e0; border-color: #3a82e0; }
.audio-label { display: inline-flex; gap: 4px; }

@media (max-width: 720px) {
  .audio-toggle { right: 16px; bottom: 16px; padding: 6px 12px 6px 10px; }
  .coda { padding: 72px 24px; }
}
</style>
