<template>
  <div class="atlas-page">
    <WorldGlobe :selectedCountry="selectedCountry" :showArcs="showArcs" @country-clicked="onCountryClicked" @arc-clicked="onArcClicked" />
    <SearchBar @country-selected="onCountryClicked" @movie-selected="onMovieSelected" v-show="!showOverlay" />
    <CountryOverlay :country="selectedCountry" :isVisible="showOverlay" :preselectedMovie="preselectedMovie" @close="closeOverlay" />
    <CoproductionOverlay :arc="selectedArc" :isVisible="showCoprodOverlay" @close="showCoprodOverlay = false" />
    <div class="page-eyebrow eyebrow">No. 001 · The Atlas</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showArcs = useArcs()
const selectedCountry = ref(null)
const selectedArc = ref(null)
const showCoprodOverlay = ref(false)
const showOverlay = ref(false)
const preselectedMovie = ref(null)

const onCountryClicked = (countryObj) => {
  if (!selectedCountry.value) {
    selectedCountry.value = countryObj
    setTimeout(() => {
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
  setTimeout(() => { selectedCountry.value = null }, 300)
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
</style>
