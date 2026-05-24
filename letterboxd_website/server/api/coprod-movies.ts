export default defineEventHandler(async (event) => {
  const { a, b, offset, year } = getQuery(event)
  if (!a || !b) return { rows: [], hasMore: false }

  const db = useDb()

  if (year) {
    const res = await db.execute({
      sql: `SELECT m.id, m.name, m.rating, m.date, m.description,
            (SELECT name FROM crew WHERE id = m.id AND role = 'Director' LIMIT 1) as director
            FROM movies m
            WHERE m.id IN (SELECT id FROM countries WHERE admin = ? COLLATE NOCASE)
              AND m.id IN (SELECT id FROM countries WHERE admin = ? COLLATE NOCASE)
              AND CAST(m.date AS INTEGER) = ?
            ORDER BY m.rating DESC`,
      args: [a, b, Number(year)],
    })
    return { rows: res.rows, hasMore: false }
  }

  const PAGE = 25
  const off = Number(offset ?? 0)
  const res = await db.execute({
    sql: `SELECT m.id, m.name, m.rating, m.date, m.description,
          (SELECT name FROM crew WHERE id = m.id AND role = 'Director' LIMIT 1) as director
          FROM movies m
          WHERE m.id IN (SELECT id FROM countries WHERE admin = ? COLLATE NOCASE)
            AND m.id IN (SELECT id FROM countries WHERE admin = ? COLLATE NOCASE)
          ORDER BY m.rating DESC
          LIMIT ? OFFSET ?`,
    args: [a, b, PAGE + 1, off],
  })

  const rows = res.rows.slice(0, PAGE)
  return { rows, hasMore: res.rows.length > PAGE }
})
