import { createClient } from '@libsql/client'
import { stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(__dirname, '..')
const defaultDbPath = resolve(packageRoot, 'data', 'local.db')

/**
 * Builds the deduplicated `people` table and the `people_fts` FTS5 virtual
 * table that powers /api/search-people.
 * @param {ReturnType<typeof createClient>} db
 */
export async function buildPeopleIndex(db) {
  console.log('Building people / people_fts...')
  const tAll = Date.now()

  await db.execute('DROP TABLE IF EXISTS people_fts')
  await db.execute('DROP TABLE IF EXISTS people')

  await db.execute(`
    CREATE TABLE people (
      rowid INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      film_count INTEGER NOT NULL
    )
  `)

  await db.execute(`
    CREATE TEMP TABLE actor_counts AS
    SELECT name, COUNT(*) AS c FROM actors WHERE name GLOB '[A-Za-z]*' GROUP BY name
  `)
  await db.execute('CREATE INDEX tmp_idx_ac ON actor_counts(name)')
  await db.execute(`
    CREATE TEMP TABLE director_counts AS
    SELECT name, COUNT(*) AS c FROM crew WHERE role = 'Director' AND name GLOB '[A-Za-z]*' GROUP BY name
  `)
  await db.execute('CREATE INDEX tmp_idx_dc ON director_counts(name)')

  // Directors first (kind='director', count = director films + their acting films).
  await db.execute(`
    INSERT INTO people (name, kind, film_count)
    SELECT d.name, 'director', d.c + COALESCE(a.c, 0)
    FROM director_counts d
    LEFT JOIN actor_counts a ON a.name = d.name
  `)

  // Then actors who did not also direct.
  await db.execute(`
    INSERT INTO people (name, kind, film_count)
    SELECT a.name, 'actor', a.c
    FROM actor_counts a
    WHERE NOT EXISTS (SELECT 1 FROM director_counts d WHERE d.name = a.name)
  `)

  await db.execute('DROP TABLE actor_counts')
  await db.execute('DROP TABLE director_counts')


  await db.execute('CREATE INDEX idx_people_film_count ON people(film_count DESC)')

  await db.execute(`
    CREATE VIRTUAL TABLE people_fts USING fts5(
      name,
      content = 'people',
      content_rowid = 'rowid',
      tokenize = 'unicode61 remove_diacritics 1'
    )
  `)
  await db.execute(`INSERT INTO people_fts(people_fts) VALUES('rebuild')`)
  await db.execute(`INSERT INTO people_fts(people_fts) VALUES('optimize')`)

  const countRes = await db.execute('SELECT COUNT(*) AS c FROM people')
  console.log(
    `  people: ${Number(countRes.rows[0].c).toLocaleString()} rows in ${(
      (Date.now() - tAll) /
      1000
    ).toFixed(1)}s`
  )
}

async function main() {
  const exists = await stat(defaultDbPath).catch(() => null)
  if (!exists) {
    console.error(`No DB at ${defaultDbPath}. Run npm run db:fetch first.`)
    process.exit(1)
  }
  const db = createClient({ url: `file:${defaultDbPath}` })
  await buildPeopleIndex(db)
  db.close()
  console.log('Done.')
}

const invokedDirectly = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`
if (invokedDirectly) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
