export default defineEventHandler(async (event) => {
  const q = ((getQuery(event).q as string) || '').trim()
  if (q.length < 2) return { people: [] }

  const db = useDb()

  // Build an FTS5 MATCH query: split on whitespace, prefix-match every token.
  // Strip characters FTS5 treats as operators so user input can't break it.
  const tokens = q
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}'\-]/gu, ''))
    .filter((t) => t.length > 0)
    .map((t) => `${t}*`)
  if (!tokens.length) return { people: [] }
  const match = tokens.join(' ')

  try {
    const res = await db.execute({
      sql: `
        SELECT p.name
        FROM people_fts f
        JOIN people p ON p.rowid = f.rowid
        WHERE f.name MATCH ?
        ORDER BY p.film_count DESC
        LIMIT 10
      `,
      args: [match],
    })
    return { people: res.rows.map((r: any) => ({ name: String(r.name) })) }
  } catch {
    // Fallback to the original LIKE-based search if the FTS table is missing
    // (e.g., the user hasn't run `npm run db:people` yet).
    const fallback = await db.execute({
      sql: `SELECT name FROM (
              SELECT name FROM actors WHERE name LIKE ? COLLATE NOCASE AND name GLOB '[A-Za-z]*'
              UNION
              SELECT name FROM crew WHERE name LIKE ? COLLATE NOCASE AND role = 'Director' AND name GLOB '[A-Za-z]*'
            ) GROUP BY name
            ORDER BY
              CASE WHEN name = UPPER(name) THEN 1 ELSE 0 END,
              CASE WHEN name LIKE ? COLLATE NOCASE THEN 0 ELSE 1 END,
              name
            LIMIT 10`,
      args: [`%${q}%`, `%${q}%`, `${q}%`],
    })
    return { people: fallback.rows.map((r: any) => ({ name: String(r.name) })) }
  }
})
