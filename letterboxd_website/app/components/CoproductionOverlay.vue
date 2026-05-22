<template>
  <Transition name="fade">
    <div v-if="isVisible" class="overlay-backdrop" @click="emit('close')">
      <div class="overlay-modal" @click.stop>
        <header class="modal-header">
          <div class="title-stack">
            <div class="eyebrow">Co-productions</div>
            <h1 class="editorial-title">{{ arc?.admin_a }} · {{ arc?.admin_b }}</h1>
          </div>
          <button class="close-button" @click="emit('close')">×</button>
        </header>

        <div class="modal-body">
          <MovieDetail v-if="selectedMovie" :movie="selectedMovie" @back="selectedMovie = null" />
          <template v-else>
            <p v-if="!loading && rows.length === 0" class="empty">No co-productions found.</p>
            <p v-if="loading" class="empty">Loading…</p>

            <div v-if="rows.length > 0" class="filter-bar">
              <input v-model="filterQuery" placeholder="Filter films…" class="filter-input" type="text" />
            </div>

            <ol class="movie-list">
              <li v-for="movie in filteredRows" :key="movie.id" class="movie-row" @click="selectedMovie = movie">
                <div class="movie-year">{{ movie.date || '—' }}</div>
                <div class="movie-meta">
                  <div class="movie-title">{{ movie.name }}</div>
                  <div v-if="movie.director" class="movie-director">{{ movie.director }}</div>
                  <div class="movie-desc">{{ movie.description }}</div>
                </div>
                <div class="movie-rating">{{ movie.rating ?? '—' }}</div>
              </li>
            </ol>
          </template>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  arc: { type: Object, default: null },
  isVisible: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])

const rows = ref([])
const loading = ref(false)
const selectedMovie = ref(null)
const filterQuery = ref('')

watch(() => props.isVisible, async (val) => {
  if (!val) return
  rows.value = []
  selectedMovie.value = null
  filterQuery.value = ''
  loading.value = true
  try {
    const res = await $fetch('/api/coprod-movies', { params: { a: props.arc.admin_a, b: props.arc.admin_b } })
    rows.value = res.rows
  } finally {
    loading.value = false
  }
})

const filteredRows = computed(() => {
  const q = filterQuery.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter(m => m.name?.toLowerCase().includes(q))
})
</script>

<style scoped>
.overlay-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1500;
  background: rgba(20, 17, 13, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 24px 24px;
}
.overlay-modal {
  width: min(960px, 92vw);
  max-height: calc(100vh - 120px);
  background: var(--bg-elevated);
  border: 1px solid var(--rule);
  border-radius: 14px;
  box-shadow: 0 24px 60px rgba(20, 17, 13, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 40px;
  border-bottom: 1px solid var(--rule);
}
.title-stack .eyebrow { margin-bottom: 4px; }
.title-stack .editorial-title { font-size: 32px; }
.close-button {
  font-size: 28px;
  color: var(--ink-muted);
  line-height: 1;
  padding: 4px 10px;
  border-radius: 999px;
  transition: color 150ms ease, background 150ms ease;
}
.close-button:hover { color: var(--ink); background: var(--accent-soft); }
.modal-body { padding: 24px 40px 32px; overflow-y: auto; flex: 1; }
.empty { font-family: var(--font-serif); font-style: italic; color: var(--ink-muted); text-align: center; margin: 48px 0; }
.filter-bar { margin-bottom: 16px; }
.filter-input {
  width: 100%;
  padding: 9px 16px;
  border-radius: 999px;
  border: 1px solid var(--rule);
  background: var(--bg-elevated);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: 13px;
  outline: none;
  transition: border-color 150ms ease;
}
.filter-input::placeholder { color: var(--ink-faint); }
.filter-input:focus { border-color: var(--accent); }
.movie-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; }
.movie-row {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  align-items: baseline;
  gap: 20px;
  padding: 16px 0;
  border-bottom: 1px solid var(--rule);
  cursor: pointer;
}
.movie-row:hover .movie-title { color: var(--accent); }
.movie-row:last-child { border-bottom: none; }
.movie-year { font-family: var(--font-sans); font-size: 12px; font-variant-numeric: tabular-nums; letter-spacing: 0.08em; color: var(--ink-muted); }
.movie-title { font-family: var(--font-serif); font-size: 20px; font-weight: 500; color: var(--ink); margin-bottom: 2px; }
.movie-director { font-size: 12px; color: var(--ink-muted); margin-bottom: 2px; }
.movie-desc { font-size: 13px; color: var(--ink-muted); line-height: 1.45; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
.movie-rating { font-family: var(--font-serif); font-size: 18px; font-style: italic; color: var(--accent); font-variant-numeric: tabular-nums; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
