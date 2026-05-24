import { createClient } from '@libsql/client'
import { createRequire } from 'node:module'
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const jpeg = require('jpeg-js')

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const YEAR_START = 1920
const YEAR_END = 2024
const SAMPLES_PER_YEAR = 250
const CONCURRENCY = 10
const TIMEOUT_MS = 8000

const db = createClient({ url: `file:${resolve(root, 'data/local.db')}` })

async function linksForYear(year) {
  const { rows } = await db.execute({
    sql: `SELECT p.link FROM movies m
          JOIN posters p ON p.id = m.id
          WHERE SUBSTR(m.date, 1, 4) = ?
          ORDER BY RANDOM() LIMIT ?`,
    args: [String(year), SAMPLES_PER_YEAR],
  })
  return rows.map(r => r.link)
}

function dominantColor(arrayBuffer) {
  let decoded
  try {
    decoded = jpeg.decode(Buffer.from(arrayBuffer), { useTArray: true, maxMemoryUsageInMB: 100 })
  } catch {
    return null
  }

  const { data, width, height } = decoded
  const bins = new Map()
  const mx = Math.floor(width * 0.08)
  const my = Math.floor(height * 0.08)

  for (let y = my; y < height - my; y += 4) {
    for (let x = mx; x < width - mx; x += 4) {
      const i = (y * width + x) * 4
      const r = data[i], g = data[i + 1], b = data[i + 2]
      if (r > 238 && g > 238 && b > 238) continue  // near-white border
      if (r < 17  && g < 17  && b < 17)  continue  // near-black letterbox
      const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)
      bins.set(key, (bins.get(key) || 0) + 1)
    }
  }

  if (!bins.size) return null
  let best = 0, bestCount = 0
  for (const [k, v] of bins) { if (v > bestCount) { bestCount = v; best = k } }

  const r = (best >> 10) << 3
  const g = ((best >> 5) & 31) << 3
  const b = (best & 31) << 3
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

async function fetchColor(url) {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: ac.signal })
    if (!res.ok) return null
    return dominantColor(await res.arrayBuffer())
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function runConcurrent(fns, n) {
  const results = new Array(fns.length).fill(null)
  let idx = 0
  const worker = async () => { while (idx < fns.length) { const i = idx++; results[i] = await fns[i]() } }
  await Promise.all(Array.from({ length: n }, worker))
  return results
}

const output = {}
for (let year = YEAR_START; year <= YEAR_END; year++) {
  const links = await linksForYear(year)
  const colors = await runConcurrent(links.map(url => () => fetchColor(url)), CONCURRENCY)
  output[year] = colors.filter(Boolean)
  process.stdout.write(`${year}: ${output[year].length}/${links.length}\n`)
}

writeFileSync(resolve(root, 'public/poster-colors.json'), JSON.stringify(output))
console.log('\nDone → public/poster-colors.json')
