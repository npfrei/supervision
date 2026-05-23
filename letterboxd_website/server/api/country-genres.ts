export default defineEventHandler(async (event) => {
  const country = ((getQuery(event).country as string) || '').trim()
  if (!country) throw createError({ statusCode: 400 })

  const db = useDb()
  const res = await db.execute({
    sql: `SELECT g.genre, COUNT(*) as count
          FROM genres g
          JOIN countries c ON g.id = c.id
          WHERE c.admin = ? COLLATE NOCASE
          GROUP BY g.genre
          ORDER BY count DESC
          LIMIT 10`,
    args: [country],
  })

  return { genres: res.rows.map(r => ({ genre: String(r.genre), count: Number(r.count) })) }
})
