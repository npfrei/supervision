<template>
  <div class="constellations-page">
    <button class="back-btn" @click="router.back()">← Back</button>
    <div class="top-right">
      <span class="eyebrow">No. 003 · Constellation</span>
      <ActorPicker @pick="onPick" />
    </div>
    <ActorGraph :slug="slug" :personName="personName" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const route = useRoute()
const router = useRouter()

const slug = computed(() => String(route.params.slug || '') || 'margot-robbie')
const personName = computed(() => String(route.query.name || ''))

function onPick(payload: { slug: string; name: string }) {
  router.push({ path: `/constellations/${payload.slug}`, query: { name: payload.name } })
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
}
</style>
