type EraDef = {
  id: 'identity' | 'autobiographies' | 'cities'
  roman: 'I' | 'II' | 'III'
  yearRange: [number, number]
  title: string
  titleAccent: string
  tagline: string
  quote: { text: string; attribution: string }
  lede: string
  themes: string[]
  insight: string
  audioTrack: string
  audioLabel: string
  filmNames: string[]
}

const ERAS: EraDef[] = [
  {
    id: 'identity',
    roman: 'I',
    yearRange: [1968, 1978],
    title: 'Exploration of',
    titleAccent: 'Identity',
    tagline: '',
    quote: { text: '', attribution: '' },
    lede: 'Despite Akerman frequently distancing herself from the feminist label, she undoubtably helped to define what a “woman’s voice” in film might be. The exploration of female identity in her films had feminism built into their very mise en scène and structure, not the subject matter alone. Jeanne Dielman depicts the repression and oppression inherent to the domestic routine of housewives. Potrait d\'une jeune fille explores the fears, desires and frustrations of an lost teenager. Je tu il elle shows a woman suffering a subdued psychological breakdown in the wake of a devastating breakup.',
    themes: [],
    insight: '',
    audioTrack: 'era1.mp3',
    audioLabel: '',
    filmNames: [ "Portrait of a Young Girl at the End of the 60s in Brussels","Jeanne Dielman, 23, quai du Commerce, 1080 Bruxelles", "Je, Tu, Il, Elle"],
  },
  {
    id: 'autobiographies',
    roman: 'II',
    yearRange: [1979, 1995],
    title: 'Auto-',
    titleAccent: 'biographies',
    tagline: '',
    quote: { text: '', attribution: '' },
    lede: 'Ackermann also centered herself and her personal in a few of her films. News from Home and No home movie depict her abusive mother candidly. Chantal Akerman by Chantal Akerman has Ackerman talking about her cinema, intercut by clips of her movies.',
    themes: [],
    insight: '',
    audioTrack: 'era2.mp3',
    audioLabel: '',
    filmNames: ["News from Home", "No Home Movie", "Chantal Akerman by Chantal Akerman"],
  },
  {
    id: 'cities',
    roman: 'III',
    yearRange: [1996, 2015],
    title: 'Cities &',
    titleAccent: 'Places',
    tagline: '',
    quote: { text: '', attribution: '' },
    lede: 'Places have had a primordial role in Ackerman\'s cinema, from the very apartement where Jeanne Dielman was trapped, to Brussels as place for love to happen, la Chambre describing her room when she had just moved to New York or South as a mediation on a Texas town where a man was brutally murdered.',
    themes: [],
    insight: '',
    audioTrack: 'era3.mp3',
    audioLabel: '',
    filmNames: ["Toute une nuit", "La chambre", "South"],
  },
]

const DIRECTOR_NAME = 'Chantal Akerman'

export default defineCachedEventHandler(
  async () => {
    const db = useDb()

    const filmsByNameSQL = `
      SELECT m.id, m.name, m.date, p.link AS poster, m.rating
      FROM movies m
      LEFT JOIN posters p ON m.id = p.id
      WHERE m.id IN (SELECT id FROM crew WHERE name = ? AND role = 'Director')
        AND m.name = ?
      LIMIT 1
    `

    const troupeSQL = `
      SELECT a.name, COUNT(*) AS films
      FROM actors a
      WHERE a.id IN (SELECT id FROM crew WHERE name = ? AND role = 'Director')
        AND a.id IN (SELECT id FROM movies WHERE date >= ? AND date <= ?)
        AND a.name != ?
      GROUP BY a.name
      ORDER BY films DESC
      LIMIT 4
    `

    const totalFilmsRes = await db.execute({
      sql: `SELECT COUNT(*) AS c FROM movies WHERE id IN (SELECT id FROM crew WHERE name = ? AND role = 'Director')`,
      args: [DIRECTOR_NAME],
    })

    const careerSpanRes = await db.execute({
      sql: `SELECT MIN(date) AS lo, MAX(date) AS hi FROM movies WHERE id IN (SELECT id FROM crew WHERE name = ? AND role = 'Director') AND date IS NOT NULL`,
      args: [DIRECTOR_NAME],
    })

    const eraResults = await Promise.all(
      ERAS.map(async (era) => {
        const filmsResults = await Promise.all(
          era.filmNames.map((name) =>
            db.execute({ sql: filmsByNameSQL, args: [DIRECTOR_NAME, name] })
          )
        )
        const films = filmsResults
          .map((r) => r.rows[0])
          .filter(Boolean)
          .map((r: any) => ({
            id: r.id,
            name: r.name,
            year: r.date ? Math.trunc(Number(r.date)) : null,
            poster: r.poster || null,
          }))

        const troupeRes = await db.execute({
          sql: troupeSQL,
          args: [DIRECTOR_NAME, era.yearRange[0], era.yearRange[1], DIRECTOR_NAME],
        })

        return {
          ...era,
          films,
          troupe: troupeRes.rows.map((r: any) => ({
            name: r.name,
            films: Number(r.films),
          })),
        }
      })
    )

    const lo = careerSpanRes.rows[0]?.lo
    const hi = careerSpanRes.rows[0]?.hi
    return {
      meta: {
        totalFilms: Number(totalFilmsRes.rows[0]?.c ?? 0),
        careerSpan: [
          lo != null ? Math.trunc(Number(lo)) : null,
          hi != null ? Math.trunc(Number(hi)) : null,
        ],
      },
      eras: eraResults,
    }
  },
  {
    maxAge: 60 * 60,
    swr: true,
    getKey: () => 'stories:akerman',
  }
)
