export default defineEventHandler(async (event) => {
  const { a, b } = getQuery(event)
  if (!a || !b) return { rows: [] }

  const db = useDb()
  const res = await db.execute({
    sql: `SELECT m.id, m.name, m.rating, m.date, m.description,
          (SELECT name FROM crew WHERE id = m.id AND role = 'Director' LIMIT 1) as director
          FROM movies m
          WHERE m.id IN (SELECT id FROM countries WHERE admin = ? COLLATE NOCASE)
            AND m.id IN (SELECT id FROM countries WHERE admin = ? COLLATE NOCASE)
          ORDER BY m.rating DESC
          LIMIT 50`,
    args: [a, b],
  })
  return { rows: res.rows }
})
