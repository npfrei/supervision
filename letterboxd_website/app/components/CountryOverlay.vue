<template>
  <Transition name="fade">
    <div v-if="isVisible" class="overlay-backdrop" @click="close">
      <div class="overlay-modal" :class="{ 'has-stats': hasStats }" @click.stop>

        <header class="modal-header">
          <div class="title-row">
            <img v-if="flagUrl" :src="flagUrl" class="country-flag" alt="" />
            <div class="title-stack">
              <div class="eyebrow">Films from</div>
              <h1 class="editorial-title">{{ countryProps?.ADMIN || 'Unknown' }}</h1>
            </div>
          </div>
          <div class="header-right">
            <!-- Tab switcher — only shown when stats data exists -->
            <div v-if="hasStats" class="tab-switcher">
              <button class="tab-btn" :class="{ active: activePanel === 'films' }" @click="activePanel = 'films'">Films</button>
              <button class="tab-btn" :class="{ active: activePanel === 'stats' }" @click="activePanel = 'stats'">Stats</button>
            </div>
            <!-- Sort controls: only in films tab, only when no movie selected -->
            <div class="sort-controls" v-show="activePanel === 'films' && !selectedMovie">
              <span class="sort-label">Sort</span>
              <button class="sort-btn" :class="{ active: sortField === 'rating' }" @click="setSort('rating')">Rating {{ sortField === 'rating' ? (sortDir === 'desc' ? '↓' : '↑') : '↓' }}</button>
              <button class="sort-btn" :class="{ active: sortField === 'date' }"   @click="setSort('date')">Year {{ sortField === 'date' ? (sortDir === 'desc' ? '↓' : '↑') : '↓' }}</button>
            </div>
            <button class="close-button" @click="close" aria-label="Close">×</button>
          </div>
        </header>

        <div class="modal-body">

          <!-- ── FILMS PANEL ── -->
          <div v-show="activePanel === 'films'" class="panel">
            <MovieDetail v-if="selectedMovie" :movie="selectedMovie" @back="selectedMovie = null" />
            <template v-else>
              <p v-if="movies.length === 0 && !loading" class="empty">No movies found for this country yet.</p>
              <p v-if="movies.length === 0 && loading" class="empty">Loading films…</p>

              <div v-if="movies.length > 0" class="filter-bar">
                <input
                  v-model="filterQuery"
                  @input="filterHighlight = 0"
                  @keydown="onFilterKey"
                  placeholder="Filter films…"
                  class="filter-input"
                  type="text"
                />
              </div>

              <ol class="movie-list">
                <li v-for="(movie, i) in filteredMovies" :key="movie.id"
                  class="movie-row" :class="{ highlighted: i === filterHighlight }"
                  @click="selectedMovie = movie" @mouseenter="filterHighlight = i">
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
                v-if="hasMore && movies.length > 0 && !filterQuery"
                class="more-button"
                :disabled="loading"
                @click="fetchMovies"
              >{{ loading ? 'Loading…' : 'Show 25 more' }}</button>
            </template>
          </div>

          <!-- ── STATS PANEL ── -->
          <div v-show="activePanel === 'stats'" class="panel stats-panel">
            <template v-if="overall">

              <!-- KPI strip -->
              <div class="kpi-strip">
                <div class="kpi">
                  <div class="kpi-value">{{ fmt1(overall.rating) }}</div>
                  <div class="kpi-label">average rating</div>
                </div>
                <div class="kpi">
                  <div class="kpi-value">{{ fmt1(overall.minute) }}</div>
                  <div class="kpi-label">average film length</div>
                </div>
                
                <div class="kpi">
                  <div class="kpi-value">{{ pct(coproductionRate) }}</div>
                  <div class="kpi-label">co-productions</div>
                </div>
              </div>

              <!-- Two-column bar charts -->
              <div class="charts-row">
                <div class="chart-col">
                  <div class="chart-title">Genres</div>
                  <div class="bar-chart">
                    <div v-for="[name, val] in overall.genres.slice(0, 8)" :key="name" class="bar-row">
                      <div class="bar-label">{{ name }}</div>
                      <div class="bar-track"><div class="bar-fill" :style="{ width: relPct(val, overall.genres[0][1]) }"></div></div>
                      <div class="bar-pct">{{ pct(val) }}</div>
                    </div>
                  </div>
                </div>
                <div class="chart-col">
                  <div class="chart-title">Co-producing Countries</div>
                  <div class="bar-chart">
                    <div v-for="[name, val] in overall.countries.slice(0, 8)" :key="name" class="bar-row">
                      <div class="bar-label">{{ name }}</div>
                      <div class="bar-track"><div class="bar-fill" :style="{ width: relPct(val, overall.countries[0][1]) }"></div></div>
                      <div class="bar-pct">{{ pct(val) }}</div>
                    </div>
                  </div>
                </div>
                <div class="chart-col">
                  <div class="chart-title">Spoken Languages</div>
                  <div class="bar-chart">
                    <div v-for="[name, val] in overall.spoken_languages.slice(0, 8)" :key="name" class="bar-row">
                      <div class="bar-label">{{ name }}</div>
                      <div class="bar-track"><div class="bar-fill" :style="{ width: relPct(val, overall.spoken_languages[0][1]) }"></div></div>
                      <div class="bar-pct">{{ pct(val) }}</div>
                    </div>
                  </div>
                </div>
                <div class="chart-col">
                  <div class="chart-title">Main Language</div>
                  <div class="bar-chart">
                    <div v-for="[name, val] in overall.main_language" :key="name" class="bar-row">
                      <div class="bar-label">{{ name }}</div>
                      <div class="bar-track"><div class="bar-fill" :style="{ width: relPct(val, overall.main_language[0][1]) }"></div></div>
                      <div class="bar-pct">{{ pct(val) }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Top themes as tags -->
              <div class="chart-block">
                <div class="chart-title">Top Themes</div>
                <div class="themes-list">
                  <span v-for="[name] in overall.themes" :key="name" class="theme-tag">{{ name }}</span>
                </div>
              </div>

              <!-- Genre evolution over time -->
              <div class="chart-block">
                <div class="chart-block-header">
                  <div class="chart-title">Genre Evolution</div>
                  <div class="legend">
                    <span v-for="g in topGenres" :key="g" class="legend-item">
                      <span class="legend-dot" :style="{ background: genreColor(g) }"></span>{{ g }}
                    </span>
                  </div>
                </div>
                <svg class="line-svg" viewBox="0 0 800 170" preserveAspectRatio="none">
                  <!-- Y-axis guide lines + labels -->
                  <g v-for="(t, i) in genreYTicks" :key="'gy'+i">
                    <line :x1="YLABEL_W" :y1="t.y" x2="800" :y2="t.y" stroke="var(--rule)" stroke-width="0.8"/>
                    <text x="0" :y="t.y" dominant-baseline="middle" font-size="8" fill="var(--ink-faint)">{{ t.label }}</text>
                  </g>
                  <g v-for="g in topGenres" :key="g">
                    <polyline
                      :points="genreLinePoints(g)"
                      fill="none"
                      :stroke="genreColor(g)"
                      stroke-width="1.6"
                      stroke-linejoin="round"
                      stroke-linecap="round"
                      opacity="0.85"
                    />
                  </g>
                  <!-- X-axis ticks -->
                  <g v-for="(tick, i) in yearTicks" :key="'gx'+i">
                    <line :x1="yw(yearX(tick))" y1="152" :x2="yw(yearX(tick))" y2="156" stroke="var(--ink-faint)" stroke-width="1"/>
                    <text :x="yw(yearX(tick))" y="156" text-anchor="middle" font-size="8" fill="var(--ink-faint)" dy="7">{{ tick }}</text>
                  </g>
                </svg>
              </div>

              <!-- Cast & crew over time -->
              <div class="chart-block">
                <div class="chart-block-header">
                  <div class="chart-title">Cast &amp; Crew per Film</div>
                  <div class="legend">
                    <span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>Actors</span>
                    <span class="legend-item"><span class="legend-dot" style="background:var(--ink-muted)"></span>Crew</span>
                  </div>
                </div>
                <svg class="line-svg" viewBox="0 0 800 135" preserveAspectRatio="none">
                  <g v-for="(t, i) in metricYTicks" :key="'my'+i">
                    <line :x1="YLABEL_W" :y1="t.y" x2="800" :y2="t.y" stroke="var(--rule)" stroke-width="0.8"/>
                    <text x="0" :y="t.y" dominant-baseline="middle" font-size="8" fill="var(--ink-faint)">{{ t.label }}</text>
                  </g>
                  <polyline :points="metricLinePoints('n_actors')" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
                  <polyline :points="metricLinePoints('n_crew')" fill="none" stroke="var(--ink-muted)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
                  <g v-for="(tick, i) in yearTicks" :key="'mx'+i">
                    <line :x1="yw(yearX(tick))" y1="113" :x2="yw(yearX(tick))" y2="117" stroke="var(--ink-faint)" stroke-width="1"/>
                    <text :x="yw(yearX(tick))" y="117" text-anchor="middle" font-size="8" fill="var(--ink-faint)" dy="7">{{ tick }}</text>
                  </g>
                </svg>
              </div>

              <!-- Co-production rate over time -->
              <div class="chart-block">
                <div class="chart-block-header">
                  <div class="chart-title">Co-production Rate</div>
                  <div class="legend">
                    <span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>% co-productions</span>
                  </div>
                </div>
                <svg class="line-svg" viewBox="0 0 800 135" preserveAspectRatio="none">
                  <g v-for="(t, i) in coproYTicks" :key="'cy'+i">
                    <line :x1="YLABEL_W" :y1="t.y" x2="800" :y2="t.y" stroke="var(--rule)" stroke-width="0.8"/>
                    <text x="0" :y="t.y" dominant-baseline="middle" font-size="8" fill="var(--ink-faint)">{{ t.label }}</text>
                  </g>
                  <polyline :points="coproLinePoints" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
                  <g v-for="(tick, i) in yearTicks" :key="'cx'+i">
                    <line :x1="yw(yearX(tick))" y1="113" :x2="yw(yearX(tick))" y2="117" stroke="var(--ink-faint)" stroke-width="1"/>
                    <text :x="yw(yearX(tick))" y="117" text-anchor="middle" font-size="8" fill="var(--ink-faint)" dy="7">{{ tick }}</text>
                  </g>
                </svg>
              </div>

              <!-- Average rating over time -->
              <div class="chart-block">
                <div class="chart-block-header">
                  <div class="chart-title">Average Rating</div>
                  <div class="legend">
                    <span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>avg rating / 10</span>
                  </div>
                </div>
                <svg class="line-svg" viewBox="0 0 800 135" preserveAspectRatio="none">
                  <g v-for="(t, i) in ratingYTicks" :key="'ry'+i">
                    <line :x1="YLABEL_W" :y1="t.y" x2="800" :y2="t.y" stroke="var(--rule)" stroke-width="0.8"/>
                    <text x="0" :y="t.y" dominant-baseline="middle" font-size="8" fill="var(--ink-faint)">{{ t.label }}</text>
                  </g>
                  <polyline :points="simpleLinePoints('rating')" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
                  <g v-for="(tick, i) in yearTicks" :key="'rx'+i">
                    <line :x1="yw(yearX(tick))" y1="113" :x2="yw(yearX(tick))" y2="117" stroke="var(--ink-faint)" stroke-width="1"/>
                    <text :x="yw(yearX(tick))" y="117" text-anchor="middle" font-size="8" fill="var(--ink-faint)" dy="7">{{ tick }}</text>
                  </g>
                </svg>
              </div>

              <!-- Average film length over time -->
              <div class="chart-block">
                <div class="chart-block-header">
                  <div class="chart-title">Average Film Length</div>
                  <div class="legend">
                    <span class="legend-item"><span class="legend-dot" style="background:var(--accent)"></span>minutes</span>
                  </div>
                </div>
                <svg class="line-svg" viewBox="0 0 800 135" preserveAspectRatio="none">
                  <g v-for="(t, i) in minuteYTicks" :key="'vy'+i">
                    <line :x1="YLABEL_W" :y1="t.y" x2="800" :y2="t.y" stroke="var(--rule)" stroke-width="0.8"/>
                    <text x="0" :y="t.y" dominant-baseline="middle" font-size="8" fill="var(--ink-faint)">{{ t.label }}</text>
                  </g>
                  <polyline :points="simpleLinePoints('minute')" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
                  <g v-for="(tick, i) in yearTicks" :key="'vx'+i">
                    <line :x1="yw(yearX(tick))" y1="113" :x2="yw(yearX(tick))" y2="117" stroke="var(--ink-faint)" stroke-width="1"/>
                    <text :x="yw(yearX(tick))" y="117" text-anchor="middle" font-size="8" fill="var(--ink-faint)" dy="7">{{ tick }}</text>
                  </g>
                </svg>
              </div>

            </template>
            <p v-else class="empty">No statistics available for this country.</p>
          </div>

        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import statsJson from '~/data/stats.json'
import statsByYearJson from '~/data/stats_by_year.json'

const props = defineProps({
  country: { type: Object, default: null },
  isVisible: { type: Boolean, default: false },
  preselectedMovie: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const countryProps = computed(() => props.country?.properties)
const countryName  = computed(() => countryProps.value?.ADMIN)

const flagUrl = computed(() => {
  if (!countryProps.value) return null
  let isoCode = countryProps.value.ISO_A2
  if (!isoCode || isoCode === '-99') isoCode = countryProps.value.WB_A2
  if (!isoCode || isoCode === '-99') isoCode = countryProps.value.FIPS_10_
  if (!isoCode || isoCode === '-99') return null
  return `https://flagcdn.com/${isoCode.toLowerCase()}.svg`
})

// ── Panel state ──────────────────────────────────────────────────────────────
const activePanel = ref('films')

// ── Stats data ───────────────────────────────────────────────────────────────
const overall   = computed(() => statsJson[countryName.value] ?? null)
const byYear    = computed(() => statsByYearJson[countryName.value] ?? null)
const hasStats  = computed(() => overall.value !== null)

const yearSeries = computed(() => {
  if (!byYear.value) return []
  return Object.keys(byYear.value)
    .map(Number)
    .filter(y => y >= 1920 && y <= 2024)
    .sort((a, b) => a - b)
})

// ── Stats helpers ─────────────────────────────────────────────────────────────
const fmt1   = (v) => v != null ? Number(v).toFixed(1) : '—'
const pct    = (v) => v != null ? (Number(v) * 100).toFixed(1) + '%' : '—'
const relPct = (v, max) => max ? ((v / max) * 100).toFixed(1) + '%' : '0%'

const coproductionRate = computed(() => {
  if (!overall.value) return null
  const entry = overall.value.coproduction.find(([k]) => k === true)
  return entry ? entry[1] : 0
})

// Genre line chart
const GENRE_COLORS = ['var(--accent)', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#14b8a6']
const topGenres = computed(() => overall.value?.genres?.slice(0, 5).map(([g]) => g) ?? [])
const genreColor = (g) => GENRE_COLORS[topGenres.value.indexOf(g)] ?? '#888'

const W = 800, PAD = 2
const minYear = computed(() => yearSeries.value[0]  ?? 1920)
const maxYear = computed(() => yearSeries.value[yearSeries.value.length - 1] ?? 2024)
const yearX   = (y) => PAD + ((y - minYear.value) / (maxYear.value - minYear.value || 1)) * (W - PAD * 2)

const yearTicks = computed(() => {
  const ticks = []
  const start = Math.ceil(minYear.value / 10) * 10
  for (let y = start; y <= maxYear.value; y += 10) ticks.push(y)
  return ticks
})

// Y-axis: left margin so labels don't overlap the plot area
const YLABEL_W = 32  // pixels reserved on the left for y labels
const yw = (x) => YLABEL_W + (x / W) * (W - YLABEL_W - PAD)

// Genre chart (H=152, values are proportions 0–1)
const genreMaxVal = computed(() => {
  let max = 0.001
  for (const y of yearSeries.value) {
    const row = byYear.value?.[String(y)]
    for (const [, v] of (row?.genres ?? [])) if (v > max) max = v
  }
  return max
})

const genreLinePoints = (genre) => {
  const vals = yearSeries.value.map(y => {
    const row = byYear.value?.[String(y)]
    const entry = (row?.genres ?? []).find(([g]) => g === genre)
    return entry ? entry[1] : 0
  })
  const max = genreMaxVal.value
  const H = 152
  return yearSeries.value
    .map((y, i) => `${yw(yearX(y)).toFixed(1)},${(H - ((vals[i] / max) * (H - PAD * 4))).toFixed(1)}`)
    .join(' ')
}

const genreYTicks = computed(() => {
  const max = genreMaxVal.value
  return [0, 0.25, 0.5, 0.75, 1].map(f => ({
    label: pct(f * max),
    y: (152 - f * (152 - PAD * 4)).toFixed(1),
  }))
})

// Metric chart (n_actors / n_crew, H=120)
const metricMaxVal = computed(() => {
  let max = 1
  for (const y of yearSeries.value) {
    const row = byYear.value?.[String(y)]
    const a = row?.n_actors ?? 0
    const c = row?.n_crew   ?? 0
    if (a > max) max = a
    if (c > max) max = c
  }
  return max
})

const metricLinePoints = (field) => {
  const H = 120, bot = H - 8
  const max = metricMaxVal.value
  const vals = yearSeries.value.map(y => byYear.value?.[String(y)]?.[field] ?? null)
  return yearSeries.value
    .map((y, i) => {
      if (vals[i] === null) return null
      return `${yw(yearX(y)).toFixed(1)},${(bot - ((vals[i] / max) * (bot - PAD * 2))).toFixed(1)}`
    })
    .filter(Boolean)
    .join(' ')
}

const metricYTicks = computed(() => {
  const max = metricMaxVal.value
  const H = 120, bot = H - 8
  return [0, 0.5, 1].map(f => ({
    label: fmt1(f * max),
    y: (bot - f * (bot - PAD * 2)).toFixed(1),
  }))
})

// Generic single-field line (rating, minute)
const simpleLinePoints = (field) => {
  const H = 120, bot = H - 8
  const vals = yearSeries.value.map(y => byYear.value?.[String(y)]?.[field] ?? null)
  const clean = vals.filter(v => v !== null)
  const max = Math.max(...clean, 1)
  const min = Math.min(...clean, 0)
  const span = max - min || 1
  return yearSeries.value
    .map((y, i) => {
      if (vals[i] === null) return null
      return `${yw(yearX(y)).toFixed(1)},${(bot - ((vals[i] - min) / span) * (bot - PAD * 2)).toFixed(1)}`
    })
    .filter(Boolean)
    .join(' ')
}

const makeSimpleYTicks = (field) => computed(() => {
  const H = 120, bot = H - 8
  const vals = yearSeries.value.map(y => byYear.value?.[String(y)]?.[field] ?? null).filter(v => v !== null)
  if (!vals.length) return []
  const max = Math.max(...vals), min = Math.min(...vals)
  const span = max - min || 1
  return [0, 0.25, 0.5, 0.75, 1].map(f => ({
    label: fmt1(min + f * span),
    y: (bot - f * (bot - PAD * 2)).toFixed(1),
  }))
})

const ratingYTicks  = makeSimpleYTicks('rating')
const minuteYTicks  = makeSimpleYTicks('minute')

// Co-production rate chart (0–1, H=120)
const coproLinePoints = computed(() => {
  const H = 120
  return yearSeries.value
    .map(y => {
      const row   = byYear.value?.[String(y)]
      const entry = (row?.coproduction ?? []).find(([k]) => k === true)
      const v     = entry ? entry[1] : 0
      return `${yw(yearX(y)).toFixed(1)},${(H - v * H).toFixed(1)}`
    })
    .join(' ')
})

const coproYTicks = [
  { label: '0%',   y: 120 },
  { label: '25%',  y: (120 * 0.75).toFixed(1) },
  { label: '50%',  y: (120 * 0.5).toFixed(1)  },
  { label: '75%',  y: (120 * 0.25).toFixed(1) },
  { label: '100%', y: 0 },
]

// ── Movie fetching ────────────────────────────────────────────────────────────
const movies    = ref([])
const afterRank = ref(0)
const loading   = ref(false)
const hasMore   = ref(true)

const fetchMovies = async () => {
  if (!countryName.value || loading.value || !hasMore.value) return
  loading.value = true
  try {
    const res = await $fetch('/api/movies', {
      params: { country: countryName.value, afterRank: afterRank.value },
    })
    movies.value.push(...res.rows)
    hasMore.value = res.hasMore
    if (res.rows.length > 0) afterRank.value = res.rows[res.rows.length - 1].rank
  } catch (err) {
    console.error('Failed to fetch movies', err)
  } finally {
    loading.value = false
  }
}

watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    movies.value      = []
    afterRank.value   = 0
    hasMore.value     = true
    filterQuery.value = ''
    filterHighlight.value = 0
    selectedMovie.value   = props.preselectedMovie || null
    activePanel.value     = 'films'
    fetchMovies()
  }
})

const close = () => emit('close')

// ── Movie detail ──────────────────────────────────────────────────────────────
const selectedMovie = ref(null)

// ── Sort ──────────────────────────────────────────────────────────────────────
const sortField = ref('rating')
const sortDir   = ref('desc')

const setSort = (field) => {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortField.value = field
    sortDir.value   = 'desc'
  }
}

const sortedMovies = computed(() =>
  [...movies.value].sort((a, b) => {
    const av = a[sortField.value] ?? 0
    const bv = b[sortField.value] ?? 0
    return sortDir.value === 'desc' ? bv - av : av - bv
  })
)

// ── Filter ────────────────────────────────────────────────────────────────────
const filterQuery     = ref('')
const filterHighlight = ref(0)
const searchResults = ref([])
let searchTimer = null

watch(filterQuery, (q) => {
  clearTimeout(searchTimer)
  if (!q.trim()) { searchResults.value = []; return }
  searchTimer = setTimeout(async () => {
    const res = await $fetch('/api/search', { params: { q: q.trim(), country: countryName.value } })
    searchResults.value = res.movies ?? []
  }, 200)
})

const filteredMovies = computed(() => {
  if (filterQuery.value.trim()) return searchResults.value
  return sortedMovies.value
})

const onFilterKey = (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    filterHighlight.value = Math.min(filterHighlight.value + 1, filteredMovies.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    filterHighlight.value = Math.max(filterHighlight.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const movie = filteredMovies.value[filterHighlight.value]
    if (movie) selectedMovie.value = movie
  }
}
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
  transition: width 300ms ease;
}

/* Widen the modal when stats are available */
.overlay-modal.has-stats {
  width: min(1140px, 94vw);
}

/* ── Header ── */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 40px;
  border-bottom: 1px solid var(--rule);
  flex-shrink: 0;
}

.title-row { display: flex; align-items: center; gap: 24px; }

.country-flag {
  height: 44px;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(20, 17, 13, 0.12);
  object-fit: cover;
}

.title-stack .eyebrow { margin-bottom: 4px; }
.title-stack .editorial-title { font-size: 40px; }

.header-right { display: flex; align-items: center; gap: 16px; }

/* ── Tab switcher ── */
.tab-switcher {
  display: flex;
  gap: 2px;
  background: var(--bg);
  border: 1px solid var(--rule);
  border-radius: 999px;
  padding: 3px;
}

.tab-btn {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 600;
  padding: 5px 16px;
  border-radius: 999px;
  color: var(--ink-muted);
  transition: color 150ms, background 150ms;
}
.tab-btn.active {
  background: var(--bg-elevated);
  color: var(--accent);
  box-shadow: 0 1px 4px rgba(20,17,13,0.1);
}

/* ── Sort / close ── */
.close-button {
  font-size: 28px;
  color: var(--ink-muted);
  line-height: 1;
  padding: 4px 10px;
  border-radius: 999px;
  transition: color 150ms ease, background 150ms ease;
}
.close-button:hover { color: var(--ink); background: var(--accent-soft); }

.sort-controls { display: flex; align-items: center; gap: 6px; }
.sort-label {
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-right: 2px;
}
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

/* ── Body ── */
.modal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.panel {
  flex: 1;
  overflow-y: auto;
  padding: 24px 40px 32px;
}

/* ── Films panel (unchanged styles) ── */
.empty {
  font-family: var(--font-serif);
  font-style: italic;
  color: var(--ink-muted);
  text-align: center;
  margin: 48px 0;
}

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
.movie-row:hover .movie-title,
.movie-row.highlighted .movie-title { color: var(--accent); }
.movie-row.highlighted { background: var(--accent-soft); margin: 0 -16px; padding: 16px; }
.movie-row:last-child { border-bottom: none; }

.movie-year {
  font-family: var(--font-sans);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.08em;
  color: var(--ink-muted);
}
.movie-title { font-family: var(--font-serif); font-size: 20px; font-weight: 500; color: var(--ink); margin-bottom: 2px; }
.movie-director { font-size: 12px; color: var(--ink-muted); margin-bottom: 2px; }
.movie-desc {
  font-size: 13px;
  color: var(--ink-muted);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
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

/* ── Stats panel ── */
.stats-panel { display: flex; flex-direction: column; gap: 28px; }

/* KPI strip */
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--rule);
  border: 1px solid var(--rule);
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}
.kpi {
  background: var(--bg);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.kpi-value {
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 500;
  color: var(--ink);
  line-height: 1;
  letter-spacing: -0.02em;
}
.kpi-label {
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink-faint);
}

/* Bar charts two-column grid */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.chart-col { display: flex; flex-direction: column; gap: 10px; }

.chart-title {
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 600;
  margin-bottom: 4px;
}

.bar-chart { display: flex; flex-direction: column; gap: 7px; }

.bar-row {
  display: grid;
  grid-template-columns: 120px 1fr 42px;
  align-items: center;
  gap: 10px;
}
.bar-label { font-size: 11px; color: var(--ink-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bar-track { height: 5px; background: var(--rule); border-radius: 999px; overflow: hidden; }
.bar-fill { height: 100%; background: var(--accent); border-radius: 999px; transition: width 500ms cubic-bezier(0.16,1,0.3,1); }
.bar-pct { font-size: 10px; font-variant-numeric: tabular-nums; color: var(--ink-faint); text-align: right; }

/* Line charts */
.chart-block { display: flex; flex-direction: column; gap: 10px; }

.chart-block-header {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.legend { display: flex; gap: 12px; flex-wrap: wrap; margin-left: auto; }
.legend-item { display: flex; align-items: center; gap: 5px; font-size: 10px; color: var(--ink-muted); }
.legend-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

.line-svg { width: 100%; display: block; overflow: visible; }

/* ── Themes tag cloud ── */
.themes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.theme-tag {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 13px;
  color: var(--ink-muted);
  background: var(--bg);
  border: 1px solid var(--rule);
  border-radius: 999px;
  padding: 4px 14px;
  line-height: 1.4;
  transition: color 150ms, border-color 150ms;
}
.theme-tag:hover { color: var(--accent); border-color: var(--accent); }

.charts-row--time { grid-template-columns: 1fr 1fr; }

/* ── Transition ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>