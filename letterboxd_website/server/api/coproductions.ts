export default defineEventHandler(async () => {
  const db = useDb()
  const res = await db.execute(`
    SELECT admin_a, admin_b, film_count
    FROM coproductions
    ORDER BY film_count DESC
    LIMIT 150
  `)
  return res.rows
})
