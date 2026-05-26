<template>
  <div class="story" :class="{ 'reduced-motion': reducedMotion }">
    <AkermanCover :meta="data?.meta" @visible="onCoverVisible" />

    <AkermanReel
      v-for="era in eras"
      :key="era.id"
      :era="era"
      @visible="onReelVisible"
    />

    <section class="coda" data-coda>
      <div class="coda-inner">
        <div class="coda-links">
          <NuxtLink to="/atlas" class="coda-link">Find her films on the Atlas →</NuxtLink>
          <NuxtLink to="/constellations/chantal-akerman?name=Chantal%20Akerman" class="coda-link">
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
import AkermanCover from '~/components/stories/AkermanCover.vue'
import AkermanReel from '~/components/stories/AkermanReel.vue'
import { useEraAudio } from '~/composables/useEraAudio'

const { data } = await useFetch('/api/stories/akerman', { key: 'stories:akerman' })

const eras = computed(() => data.value?.eras ?? [])

const audioTracks = computed(() =>
  eras.value.map((e) => ({
    id: e.id,
    src: `/stories/akerman/audio/${e.audioTrack}`,
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

useHead({ title: 'Chantal Akerman · Stories' })
</script>

<style scoped>
.story {
  position: fixed;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  background: #09070a;
  color: #e8d8cc;
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
  background: linear-gradient(180deg, #09070a 0%, #1a0e12 100%);
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
  color: #c88264;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(200,130,100,0.4);
  transition: color 200ms ease, border-color 200ms ease;
}
.coda-link:hover { color: #e8d8cc; border-color: rgba(232,216,204,0.7); }

.audio-toggle {
  position: fixed;
  right: 32px;
  bottom: 28px;
  display: flex; align-items: center; gap: 10px;
  padding: 8px 16px 8px 12px;
  border: 1px solid rgba(232,216,204,0.18);
  border-radius: 999px;
  background: rgba(9,7,10,0.6);
  backdrop-filter: blur(8px);
  cursor: pointer;
  color: rgba(232,216,204,0.7);
  font-family: var(--font-sans);
  font-size: 10px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  z-index: 100;
  transition: color 200ms ease, border-color 200ms ease, background 200ms ease;
}
.audio-toggle:hover { color: rgba(232,216,204,0.95); border-color: rgba(232,216,204,0.35); }
.audio-toggle.on { color: #c88264; border-color: rgba(200,130,100,0.5); }
.audio-toggle .dot {
  width: 8px; height: 8px;
  border: 1px solid currentColor;
  border-radius: 50%;
  background: transparent;
  transition: background 200ms ease;
}
.audio-toggle.on .dot { background: #c88264; border-color: #c88264; }
.audio-label { display: inline-flex; gap: 4px; }

@media (max-width: 720px) {
  .audio-toggle { right: 16px; bottom: 16px; padding: 6px 12px 6px 10px; }
  .coda { padding: 72px 24px; }
}
</style>
