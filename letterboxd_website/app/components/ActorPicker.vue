<template>
  <div class="picker">
    <input
      v-model="query"
      type="text"
      class="picker-input"
      placeholder="Search an actor…"
      @focus="open = true"
      @blur="closeSoon"
      @keydown="onKeydown"
    />
    <ul v-if="open && results.length" class="picker-results">
      <li
        v-for="(person, i) in results"
        :key="person.name"
        class="picker-row"
        :class="{ active: activeIndex === i }"
        @mousedown.prevent="select(person)"
        @mouseenter="activeIndex = i"
      >
        {{ person.name }}
      </li>
    </ul>
    <p v-if="open && query.trim().length >= 2 && !results.length" class="picker-empty">
      No results found.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import index from '../data/actorGraphs.index.json'

const emit = defineEmits<{ (e: 'pick', payload: { slug: string; name: string }): void }>()
const query = ref('')
const open = ref(false)
const activeIndex = ref(-1)
const results = ref<{ name: string }[]>([])
let searchTimer: ReturnType<typeof setTimeout> | null = null

const slugify = (n: string) => n.toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

watch(query, (q) => {
  if (searchTimer) clearTimeout(searchTimer)
  activeIndex.value = -1
  const trimmed = q.trim()
  if (!trimmed) {
    results.value = []
    return
  }
  if (trimmed.length < 2) { results.value = []; return }
  searchTimer = setTimeout(async () => {
    const res = await $fetch('/api/search-people', { params: { q: trimmed } })
    results.value = res.people
    activeIndex.value = -1
  }, 200)
})

function onKeydown(e: KeyboardEvent) {
  if (!results.value.length) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, -1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const idx = activeIndex.value >= 0 ? activeIndex.value : 0
    if (results.value[idx]) select(results.value[idx])
  } else if (e.key === 'Escape') {
    open.value = false
    activeIndex.value = -1
  }
}

function select(person: { name: string }) {
  const slug = slugify(person.name)
  query.value = ''
  open.value = false
  emit('pick', { slug, name: person.name })
}

function closeSoon() {
  setTimeout(() => { open.value = false }, 120)
}
</script>

<style scoped>
.picker { position: relative; width: 260px; }
.picker-input {
  width: 100%;
  padding: 10px 16px;
  border-radius: 999px;
  border: 1px solid var(--rule);
  background: var(--bg-elevated);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 13px;
  outline: none;
  transition: border-color 150ms ease;
}
.picker-input::placeholder { color: var(--ink-faint); }
.picker-input:focus { border-color: var(--accent); }
.picker-results {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  background: var(--bg-elevated);
  border-radius: 10px;
  border: 1px solid var(--rule);
  box-shadow: 0 10px 24px rgba(20, 17, 13, 0.1);
  max-height: 280px;
  overflow-y: auto;
}
.picker-row {
  padding: 10px 16px;
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
  border-bottom: 1px solid var(--rule);
}
.picker-row:hover,
.picker-row.active {
  background: var(--accent-soft);
  color: var(--accent);
}
.picker-row:last-child { border-bottom: none; }
.picker-empty {
  margin: 8px 0 0;
  padding: 10px 16px;
  font-size: 12px;
  font-style: italic;
  color: var(--ink-muted);
  font-family: var(--font-serif);
  background: var(--bg-elevated);
  border-radius: 10px;
  border: 1px solid var(--rule);
}
</style>
