export default defineEventHandler(async (event) => {
  const q = ((getQuery(event).q as string) || '').trim()
  if (q.length < 2) return { people: [] }

  const db = useDb()
  const res = await db.execute({
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
  return { people: res.rows.map(r => ({ name: String(r.name) })) }
})
