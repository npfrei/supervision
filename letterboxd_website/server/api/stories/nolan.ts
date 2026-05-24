type EraDef = {
  id: 'puzzle' | 'philosophical' | 'historical'
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
    id: 'puzzle',
    roman: 'I',
    yearRange: [2000, 2008],
    title: 'The Puzzle',
    titleAccent: 'Era',
    tagline: 'Fragmented narratives, psychological thrillers, the unreliable narrator.',
    quote: {
      text: 'We all need mirrors to remind ourselves who we are.',
      attribution: 'Leonard, Memento',
    },
    lede: 'A young director arrives convinced that time is the wrong axis. He cuts Memento backwards, runs two Prestige timelines in parallel, drops Insomnia into perpetual daylight. Structural gimmickry, yes, but with a purpose: you do not just watch the broken mind, you live inside it.',
    themes: ['Unreliable narration', 'Fractured memory', 'Identity as a puzzle'],
    insight: 'Structural gimmickry put the audience directly inside the broken minds of his protagonists.',
    audioTrack: 'era1-polaroid-ticking.mp3',
    audioLabel: 'Polaroid & reversed ticks',
    filmNames: ['Memento', 'The Prestige', 'The Dark Knight'],
  },
  {
    id: 'philosophical',
    roman: 'II',
    yearRange: [2010, 2020],
    title: 'The Philosophical',
    titleAccent: 'Blockbuster',
    tagline: 'High-concept physics meets summer-tentpole budgets.',
    quote: {
      text: 'We have to go deeper.',
      attribution: 'Cobb, Inception',
    },
    lede: 'Dreams nested in dreams, gravity bending around a black hole, time running both ways at once. Nolan trades the puzzle-thriller for the practical-effects blockbuster, and proves that audiences will pay summer prices to wrestle with relativity. Tenet arrives as the extreme epilogue, a film that asks you to think backwards in real time.',
    themes: ['Time dilation', 'Practical effects', 'Cerebral spectacle'],
    insight: 'Audiences were hungry for complex, cerebral concepts wrapped in summer action aesthetics.',
    audioTrack: 'era2-brass-organ.mp3',
    audioLabel: 'Zimmer brass & organ',
    filmNames: ['Inception', 'Interstellar', 'Tenet'],
  },
  {
    id: 'historical',
    roman: 'III',
    yearRange: [2017, 2030],
    title: 'The Historical',
    titleAccent: 'Epics',
    tagline: 'Nonlinear time, applied to true history.',
    quote: {
      text: 'Now I am become Death, the destroyer of worlds.',
      attribution: 'Oppenheimer',
    },
    lede: 'Dunkirk fractures one week into three timelines colliding on a beach. Oppenheimer threads color and black-and-white through a man who built the bomb. The sci-fi is gone, but the mastery of structure remains, now applied to the weight of legacy itself.',
    themes: ['Tension as architecture', 'IMAX as instrument', 'The weight of legacy'],
    insight: 'Nolan stripped away the sci-fi to apply his mastery of nonlinear time and tension to true historical events.',
    audioTrack: 'era3-ticking-impact.mp3',
    audioLabel: 'Pocket-watch ticks',
    filmNames: ['Dunkirk', 'Oppenheimer'],
  },
]

const DIRECTOR_NAME = 'Christopher Nolan'

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
    getKey: () => 'stories:nolan',
  }
)
