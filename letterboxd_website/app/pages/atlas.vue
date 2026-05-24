<template>
  <div class="atlas-page">
    <WorldGlobe :selectedCountry="selectedCountry" :showArcs="showArcs" @country-clicked="onCountryClicked" @arc-clicked="onArcClicked" />
    <SearchBar @country-selected="onCountryClicked" @movie-selected="onMovieSelected" v-show="!showOverlay" />
    <button
      class="arcs-toggle"
      :class="{ on: showArcs }"
      @click="showArcs = !showArcs"
      v-show="!showOverlay"
    >
      Co-productions
    </button>
    <CountryOverlay :country="selectedCountry" :isVisible="showOverlay" :preselectedMovie="preselectedMovie" @close="closeOverlay" />
    <CoproductionOverlay :arc="selectedArc" :isVisible="showCoprodOverlay" @close="showCoprodOverlay = false" />
    <div class="page-eyebrow eyebrow">The Atlas</div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

const showArcs = useArcs()
const selectedCountry = ref(null)
const selectedArc = ref(null)
const showCoprodOverlay = ref(false)
const showOverlay = ref(false)
const preselectedMovie = ref(null)

const timers = new Set()
function later(fn, ms) {
  const id = setTimeout(() => { timers.delete(id); fn() }, ms)
  timers.add(id)
  return id
}
onUnmounted(() => { for (const id of timers) clearTimeout(id); timers.clear() })

const onCountryClicked = (countryObj) => {
  if (!selectedCountry.value) {
    selectedCountry.value = countryObj
    later(() => {
      if (selectedCountry.value && selectedCountry.value.properties.ADMIN === countryObj.properties.ADMIN) {
        showOverlay.value = true
      }
    }, 1000)
  }
}

const onMovieSelected = ({ movie, country }) => {
  if (!country) return
  preselectedMovie.value = movie
  selectedCountry.value = country
  showOverlay.value = true
}

const onArcClicked = (arc) => {
  selectedArc.value = arc
  showCoprodOverlay.value = true
}

const closeOverlay = () => {
  showOverlay.value = false
  preselectedMovie.value = null
  later(() => { selectedCountry.value = null }, 300)
}
</script>

<style scoped>
.atlas-page { position: fixed; inset: 0; }
.page-eyebrow {
  position: absolute;
  left: 48px;
  bottom: 22px;
  z-index: 5;
}
.arcs-toggle {
  position: absolute;
  top: 96px;
  right: 380px;
  z-index: 100;
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 14px;
  color: var(--ink-faint);
  letter-spacing: 0.02em;
  cursor: pointer;
  padding: 4px 0;
  transition: color 200ms ease;
}
.arcs-toggle:hover { color: var(--ink); }
.arcs-toggle.on { color: var(--accent); }
</style>
