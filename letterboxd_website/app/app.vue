<template>
  <div>
    <SiteNav v-if="!isImmersive" />
    <NuxtPage />
  </div>
</template>

<script setup>
const route = useRoute()
const isImmersive = computed(() =>
  route.path.startsWith('/stories/scorsese') || route.path.startsWith('/stories/nolan')
)
</script>
