export default defineEventHandler(async (event) => {
  const country = ((getQuery(event).country as string) || '').trim()
  if (!country) throw createError({ statusCode: 400 })

  const db = useDb()
  const res = await db.execute({
    sql: `SELECT CAST(m.date AS INTEGER) as year, g.genre, COUNT(*) as count
          FROM genres g
          JOIN countries c ON g.id = c.id
          JOIN movies m ON g.id = m.id
          WHERE c.admin = ? COLLATE NOCASE
            AND m.date >= 1950 AND m.date IS NOT NULL
          GROUP BY year, g.genre
          ORDER BY year, count DESC`,
    args: [country],
  })

  return { rows: res.rows.map(r => ({ year: Number(r.year), genre: String(r.genre), count: Number(r.count) })) }
})
