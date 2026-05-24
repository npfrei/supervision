<template>
  <div class="story" :class="{ 'reduced-motion': reducedMotion }">
    <NolanCover :meta="data?.meta" @visible="onCoverVisible" />

    <NolanEraPuzzle
      v-if="eras[0]"
      :era="eras[0]"
      @visible="onEraVisible"
    />
    <NolanEraPhilosophical
      v-if="eras[1]"
      :era="eras[1]"
      @visible="onEraVisible"
    />
    <NolanEraHistorical
      v-if="eras[2]"
      :era="eras[2]"
      @visible="onEraVisible"
    />

    <section class="coda">
      <div class="coda-inner">
        <div class="coda-links">
          <NuxtLink to="/atlas" class="coda-link">Find his films on the Atlas →</NuxtLink>
          <NuxtLink to="/constellations/christopher-nolan?name=Christopher%20Nolan" class="coda-link">
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
import NolanCover from '~/components/stories/NolanCover.vue'
import NolanEraPuzzle from '~/components/stories/NolanEraPuzzle.vue'
import NolanEraPhilosophical from '~/components/stories/NolanEraPhilosophical.vue'
import NolanEraHistorical from '~/components/stories/NolanEraHistorical.vue'
import { useEraAudio } from '~/composables/useEraAudio'

const { data } = await useFetch('/api/stories/nolan', { key: 'stories:nolan' })

const eras = computed(() => data.value?.eras ?? [])

const audioTracks = computed(() =>
  eras.value.map((e) => ({
    id: e.id,
    src: `/stories/nolan/audio/${e.audioTrack}`,
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

function onEraVisible(id: string) {
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

useHead({ title: 'The Architecture of Time · Stories' })
</script>

<style scoped>
.story {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y proximity;
  scroll-behavior: smooth;
  background: #04040a;
  color: #e8e9f0;
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
  background: linear-gradient(180deg, #04040a 0%, #0a0a12 100%);
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
  color: #a0b4dc;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(160,180,220,0.4);
  transition: color 200ms ease, border-color 200ms ease;
}
.coda-link:hover { color: #f0f4ff; border-color: rgba(240,244,255,0.7); }

.audio-toggle {
  position: fixed;
  right: 32px;
  bottom: 28px;
  display: flex; align-items: center; gap: 10px;
  padding: 8px 16px 8px 12px;
  border: 1px solid rgba(232,233,240,0.2);
  border-radius: 999px;
  background: rgba(4,4,10,0.6);
  backdrop-filter: blur(8px);
  cursor: pointer;
  color: rgba(232,233,240,0.7);
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  z-index: 100;
  transition: color 200ms ease, border-color 200ms ease, background 200ms ease;
}
.audio-toggle:hover { color: rgba(232,233,240,0.95); border-color: rgba(232,233,240,0.4); }
.audio-toggle.on { color: #a0b4dc; border-color: rgba(160,180,220,0.5); }
.audio-toggle .dot {
  width: 8px; height: 8px;
  border: 1px solid currentColor;
  border-radius: 50%;
  background: transparent;
  transition: background 200ms ease;
}
.audio-toggle.on .dot { background: #a0b4dc; border-color: #a0b4dc; }

@media (max-width: 720px) {
  .audio-toggle { right: 16px; bottom: 16px; padding: 6px 12px 6px 10px; }
  .coda { padding: 72px 24px; }
}
</style>
