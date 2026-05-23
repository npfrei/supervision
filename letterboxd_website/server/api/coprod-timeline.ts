export default defineEventHandler(async (event) => {
  const { a, b } = getQuery(event)
  if (!a || !b) throw createError({ statusCode: 400 })

  const db = useDb()
  const res = await db.execute({
    sql: `SELECT CAST(m.date AS INTEGER) as year, COUNT(*) as count
          FROM movies m
          WHERE m.id IN (SELECT id FROM countries WHERE admin = ? COLLATE NOCASE)
            AND m.id IN (SELECT id FROM countries WHERE admin = ? COLLATE NOCASE)
            AND m.date IS NOT NULL AND m.date >= 1900
          GROUP BY year
          ORDER BY year`,
    args: [a, b],
  })

  return { years: res.rows.map(r => ({ year: Number(r.year), count: Number(r.count) })) }
})
