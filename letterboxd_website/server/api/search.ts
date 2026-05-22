export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const q = ((query.q as string) || '').trim();
  const country = ((query.country as string) || '').trim();
  if (q.length < 2) return { movies: [] };

  const db = useDb();

  const res = await db.execute({
    sql: `SELECT t.id, t.name, t.date, t.rating, t.description, t.admin as country,
          (SELECT name FROM crew WHERE id = t.id AND role = 'Director' LIMIT 1) as director
          FROM top_movies_by_country t
          WHERE t.name LIKE ? COLLATE NOCASE
          ${country ? 'AND t.admin = ? COLLATE NOCASE' : ''}
          GROUP BY t.id
          ORDER BY t.rating DESC
          LIMIT ${country ? 50 : 6}`,
    args: country ? [`%${q}%`, country] : [`%${q}%`],
  });
  return { movies: res.rows };
});
