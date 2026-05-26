type EraDef = {
  id: 'early-career' | 'stardom' | 'rivalry' | 'later-works'
  roman: 'I' | 'II' | 'III' | 'IV'
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
    id: 'early-career',
    roman: 'I',
    yearRange: [1919, 1930],
    title: 'Early Career:',
    titleAccent: 'Supporting Roles',
    tagline: '',
    quote: { text: '', attribution: '' },
    lede: 'Once Karloff arrived in Hollywood, he appeared in small roles in dozens of silent films, but the work was sporadic and he often had to take up manual labour such as digging ditches or delivering construction plaster to make ends meet.',
    themes: [],
    insight: '',
    audioTrack: 'era1.mp3',
    audioLabel: '',
    filmNames: ["Five Star Final", "The Criminal Code", "The Yellow Ticket" ],
  },
  {
    id: 'stardom',
    roman: 'II',
    yearRange: [1931, 1934],
    title: 'Stardom:',
    titleAccent: 'Icon of pre-Code Horror',
    tagline: '',
    quote: { text: '', attribution: '' },
    lede: 'His portrayal of Frankenstein\'s monster in the horror film Frankenstein, his 82nd film, established him as a horror icon, and he reprised the role for the sequels Bride of Frankenstein and Son of Frankenstein. He also appeared as Imhotep in The Mummy ',
    themes: [],
    insight: '',
    audioTrack: 'frankenstein.mp3',
    audioLabel: '',
    filmNames: ["Frankenstein","Bride of Frankenstein", "The Mummy" ],
  },
  {
    id: 'rivalry',
    roman: 'III',
    yearRange: [1935, 1955],
    title: 'Rivalry with',
    titleAccent: 'Bela Lugosi',
    tagline: '',
    quote: { text: '', attribution: '' },
    lede: 'Later on, Karloff gave a string of lauded performances in Universal\'s horror films, including several with Bela Lugosi, his main rival as heir to Lon Chaney\'s status as the leading horror film star. The appeared together, mostly in the roles of rivals, in The Black Cat, Gift of Gab, The Raven, The Body Snatcher and The Invisible Ray',
    themes: [],
    insight: '',
    audioTrack: 'era3.mp3',
    audioLabel: '',
    filmNames: ["The Black Cat", "Gift of Gab", "The Raven", "The Invisible Ray"],
  },
  {
    id: 'later-works',
    roman: 'IV',
    yearRange: [1956, 1969],
    title: 'Later Works:',
    titleAccent: 'Voice Acting',
    tagline: '',
    quote: { text: '', attribution: '' },
    lede: 'Boris Karloff later expanded his work beyond only acting in Hollywood. He returned to the Broadway stage, started appearing regularly on the radio and on TV series. But, some of his most notable work came from voice acting, primarly in Dr Seuss\' How the Grinch Stole Christmas!',
    themes: [],
    insight: '',
    audioTrack: 'era4.mp3',
    audioLabel: '',
    filmNames: ["How the Grinch Stole Christmas!", "Mad Monster Party", "The Daydreamer"],
  },
]

const ACTOR_NAME = 'Boris Karloff'

export default defineCachedEventHandler(
  async () => {
    const db = useDb()

    const filmsByNameSQL = `
      SELECT m.id, m.name, m.date, p.link AS poster, m.rating
      FROM movies m
      LEFT JOIN posters p ON m.id = p.id
      WHERE m.id IN (SELECT id FROM actors WHERE name = ?)
        AND m.name = ?
      LIMIT 1
    `

    const costarSQL = `
      SELECT a.name, COUNT(*) AS films
      FROM actors a
      WHERE a.id IN (SELECT id FROM actors WHERE name = ? )
        AND a.id IN (SELECT id FROM movies WHERE date >= ? AND date <= ?)
        AND a.name != ?
      GROUP BY a.name
      ORDER BY films DESC
      LIMIT 4
    `
    

    const totalFilmsRes = await db.execute({
      sql: `SELECT COUNT(*) AS c FROM movies WHERE id IN (SELECT id FROM crew WHERE name = ? AND role = 'Actor')`,
      args: [ACTOR_NAME],
    })

    const careerSpanRes = await db.execute({
      sql: `SELECT MIN(date) AS lo, MAX(date) AS hi FROM movies WHERE id IN (SELECT id FROM crew WHERE name = ? AND role = 'Actor') AND date IS NOT NULL`,
      args: [ACTOR_NAME],
    })

    const eraResults = await Promise.all(
      ERAS.map(async (era) => {
        const filmsResults = await Promise.all(
          era.filmNames.map((name) =>
            db.execute({ sql: filmsByNameSQL, args: [ACTOR_NAME, name] })
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

        const costarRes = await db.execute({
          sql: costarSQL,
          args: [ACTOR_NAME,era.yearRange[0], era.yearRange[1] , ACTOR_NAME],
        })

        return {
          ...era,
          films,
          troupe: costarRes.rows.map((r: any) => ({
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
    getKey: () => 'stories:karloff',
  }
)
