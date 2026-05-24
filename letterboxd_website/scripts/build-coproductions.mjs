import { createClient } from '@libsql/client'
import { stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = resolve(__dirname, '..', 'data', 'local.db')

const dbExists = await stat(dbPath).catch(() => null)
if (!dbExists) {
  console.error(`No DB at ${dbPath}. Run npm run db:fetch first.`)
  process.exit(1)
}

const db = createClient({ url: `file:${dbPath}` })

console.log('Building coproductions table...')
const t = Date.now()
await db.execute(`DROP TABLE IF EXISTS coproductions`)
await db.execute(`
  CREATE TABLE coproductions AS
  SELECT c1.admin AS admin_a, c2.admin AS admin_b, COUNT(*) AS film_count
  FROM countries c1
  JOIN countries c2 ON c1.id = c2.id AND c1.admin < c2.admin
  WHERE c1.admin IS NOT NULL AND c2.admin IS NOT NULL
  GROUP BY c1.admin, c2.admin
  HAVING COUNT(*) >= 3
  ORDER BY film_count DESC
`)
const { rows } = await db.execute(`SELECT COUNT(*) AS n FROM coproductions`)
console.log(`Done: ${rows[0].n} pairs in ${Date.now() - t}ms`)
db.close()
