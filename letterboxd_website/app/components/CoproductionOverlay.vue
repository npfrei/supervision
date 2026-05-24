<template>
  <Transition name="fade">
    <div v-if="isVisible" class="overlay-backdrop" @click="emit('close')">
      <div class="overlay-modal" @click.stop>
        <header class="modal-header">
          <div class="title-stack">
            <div class="eyebrow">Co-productions</div>
            <h1 class="editorial-title">{{ arc?.admin_a }} · {{ arc?.admin_b }}</h1>
          </div>
          <div class="header-right">
            <div class="sort-controls" v-show="!selectedMovie">
              <span class="sort-label">Sort</span>
              <button class="sort-btn" :class="{ active: sortField === 'rating' }" @click="setSort('rating')">Rating {{ sortField === 'rating' ? (sortDir === 'desc' ? '↓' : '↑') : '↓' }}</button>
              <button class="sort-btn" :class="{ active: sortField === 'date' }" @click="setSort('date')">Year {{ sortField === 'date' ? (sortDir === 'desc' ? '↓' : '↑') : '↓' }}</button>
            </div>
            <button class="close-button" @click="emit('close')">×</button>
          </div>
        </header>

        <div class="modal-body">
          <MovieDetail v-if="selectedMovie" :movie="selectedMovie" @back="selectedMovie = null" />
          <template v-else>
            <p v-if="!loading && rows.length === 0" class="empty">No co-productions found.</p>
            <p v-if="loading && rows.length === 0" class="empty">Loading…</p>
            <p v-if="yearLoading" class="empty">Loading {{ selectedYear }}…</p>

            <div v-if="timeline.length > 0" class="timeline-section">
              <div class="eyebrow timeline-label">Films per year</div>
              <div class="timeline-chart">
                <div
                  v-for="item in timeline"
                  :key="item.year"
                  class="timeline-col"
                  :class="{ active: selectedYear === item.year }"
                  :title="`${item.year} · ${item.count} film${item.count !== 1 ? 's' : ''}`"
                  @click="selectYear(item.year)"
                >
                  <div class="timeline-bar" :style="{ height: (item.count / timelineMax * 60) + 'px' }"></div>
                </div>
              </div>
              <div class="timeline-range">
                <span>{{ timeline[0]?.year }}</span>
                <span v-if="selectedYear" class="timeline-active-label">
                  {{ selectedYear }} · {{ timeline.find(t => t.year === selectedYear)?.count }} film{{ timeline.find(t => t.year === selectedYear)?.count !== 1 ? 's' : '' }}
                  <button class="timeline-clear" @click="selectYear(selectedYear)">✕</button>
                </span>
                <span>{{ timeline[timeline.length - 1]?.year }}</span>
              </div>
            </div>

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

            <button
              v-if="hasMore && !filterQuery && !selectedYear"
              class="more-button"
              :disabled="loading"
              @click="fetchMovies"
            >{{ loading ? 'Loading…' : 'Show 25 more' }}</button>
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
const hasMore = ref(false)
const offset = ref(0)
const selectedMovie = ref(null)
const filterQuery = ref('')
const timeline = ref([])
const selectedYear = ref(null)
const yearRows = ref([])
const yearLoading = ref(false)
const timelineMax = computed(() => Math.max(1, ...timeline.value.map(t => t.count)))

const fetchMovies = async () => {
  if (!props.arc || loading.value) return
  loading.value = true
  try {
    const res = await $fetch('/api/coprod-movies', {
      params: { a: props.arc.admin_a, b: props.arc.admin_b, offset: offset.value }
    })
    rows.value.push(...res.rows)
    hasMore.value = res.hasMore
    offset.value += res.rows.length
  } finally {
    loading.value = false
  }
}

watch(() => props.isVisible, async (val) => {
  if (!val) return
  rows.value = []
  timeline.value = []
  selectedYear.value = null
  yearRows.value = []
  selectedMovie.value = null
  filterQuery.value = ''
  sortField.value = 'rating'
  sortDir.value = 'desc'
  hasMore.value = false
  offset.value = 0
  const [, timelineRes] = await Promise.all([
    fetchMovies(),
    $fetch('/api/coprod-timeline', { params: { a: props.arc.admin_a, b: props.arc.admin_b } }),
  ])
  timeline.value = timelineRes.years
})

const selectYear = async (year) => {
  if (selectedYear.value === year) { selectedYear.value = null; yearRows.value = []; return }
  selectedYear.value = year
  yearRows.value = []
  yearLoading.value = true
  try {
    const res = await $fetch('/api/coprod-movies', {
      params: { a: props.arc.admin_a, b: props.arc.admin_b, year }
    })
    yearRows.value = res.rows
  } finally {
    yearLoading.value = false
  }
}

const sortField = ref('rating')
const sortDir = ref('desc')

const setSort = (field) => {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortField.value = field
    sortDir.value = 'desc'
  }
}

const sortedRows = computed(() => {
  return [...rows.value].sort((a, b) => {
    const av = a[sortField.value] ?? 0
    const bv = b[sortField.value] ?? 0
    return sortDir.value === 'desc' ? bv - av : av - bv
  })
})

const filteredRows = computed(() => {
  const base = selectedYear.value ? yearRows.value : sortedRows.value
  const q = filterQuery.value.trim().toLowerCase()
  if (!q) return base
  return base.filter(m => m.name?.toLowerCase().includes(q))
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
.header-right { display: flex; align-items: center; gap: 16px; }
.sort-controls { display: flex; align-items: center; gap: 6px; }
.sort-label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-faint); margin-right: 2px; }
.sort-btn {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--rule);
  transition: color 150ms ease, background 150ms ease, border-color 150ms ease;
}
.sort-btn:hover { color: var(--ink); background: var(--accent-soft); }
.sort-btn.active { color: var(--accent); border-color: var(--accent); background: var(--accent-soft); }
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
.more-button {
  margin-top: 28px;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--accent);
  padding: 6px 2px;
  border-bottom: 1px solid var(--accent);
}
.more-button:disabled { color: var(--ink-faint); border-color: var(--ink-faint); cursor: wait; }
.timeline-section { margin-bottom: 24px; }
.timeline-label { margin-bottom: 10px; }
.timeline-chart {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 68px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--rule);
}
.timeline-col {
  flex: 1;
  display: flex;
  align-items: flex-end;
  cursor: pointer;
  min-width: 2px;
}
.timeline-bar {
  width: 100%;
  background: var(--rule);
  border-radius: 1px 1px 0 0;
  min-height: 2px;
  transition: background 120ms ease;
}
.timeline-col:hover .timeline-bar,
.timeline-col.active .timeline-bar { background: var(--accent); }
.timeline-range {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--ink-faint);
  letter-spacing: 0.08em;
  margin-top: 5px;
  margin-bottom: 20px;
}
.timeline-active-label { color: var(--accent); display: flex; align-items: center; gap: 6px; }
.timeline-clear { color: var(--ink-muted); font-size: 11px; }
.timeline-clear:hover { color: var(--ink); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
