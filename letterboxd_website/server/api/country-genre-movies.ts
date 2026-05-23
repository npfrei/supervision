export default defineEventHandler(async (event) => {
  const { country, genre, offset, year } = getQuery(event)
  if (!country || !genre) throw createError({ statusCode: 400 })

  const PAGE = 25
  const off = Number(offset ?? 0)
  const db = useDb()

  const yearClause = year ? 'AND CAST(m.date AS INTEGER) = ?' : ''
  const args = year
    ? [country, genre, Number(year), PAGE + 1, off]
    : [country, genre, PAGE + 1, off]

  const res = await db.execute({
    sql: `SELECT m.id, m.name, m.rating, m.date, m.description,
          (SELECT name FROM crew WHERE id = m.id AND role = 'Director' LIMIT 1) as director
          FROM movies m
          JOIN genres g ON m.id = g.id
          JOIN countries c ON m.id = c.id
          WHERE c.admin = ? COLLATE NOCASE AND g.genre = ?
          ${yearClause}
          GROUP BY m.id
          ORDER BY m.rating DESC
          LIMIT ? OFFSET ?`,
    args,
  })

  const rows = res.rows.slice(0, PAGE)
  return { rows, hasMore: res.rows.length > PAGE }
})
