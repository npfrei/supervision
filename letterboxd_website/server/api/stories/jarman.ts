type EraDef = {
  id: 'hist' | 'political' | 'blue'
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
    id: 'hist',
    roman: 'I',
    yearRange: [1975, 1986],
    title: 'Biopics : ',
    titleAccent: 'Historically Inaccurate Queer Perspectives',
    tagline: '',
    quote: { text: 'The point is not historical accuracy, but a politically motivated need to insist on the contribution formulations of same-sex desire have made to Western civilisation', attribution: 'Pascale Aebischer' },
    lede: 'Sebastiane, Jarman\'s first feature film about the martyrdom of Saint Sebastian, was one of the first British films to feature positive images of gay sexuality. In Edward II, Edward and his lover are misfits and provocateurs, not mere captives of “the love that dare not speak its name.” In a totally homophobic society, these two manifest themselves instead of hiding. They disturb the peace. In Jarman\'s stylised biopic of the painter, Caravaggio’s evocative paintings appear in his reverie about a perfect lover, alongside overt depictions of homosexual love',
    themes: [],
    insight: '',
    audioTrack: 'era1.mp3',
    audioLabel: '',
    filmNames: ["Edward II", "Caravaggio", "Sebastiane"],
  },
  {
    id: 'political',
    roman: 'II',
    yearRange: [1978, 1990],
    title: 'Contemporary Political Films',
    titleAccent: '',
    tagline: '',
    quote: { text: 'On December 22, 1986, finding I was body positive, I set myself a target: I would disclose my secret and survive Margaret Thatcher. I did. Now I have set my sights on the millennium and a world where we are all equal', attribution: 'Derek Jarman' },
    lede: 'Jarman belonged to the generation that still felt the aftershocks of World War II, that was horrified by the devastation of the world it had inherited, and hungry for answers. In Jubilee, he depicts Queen Elizabeth I visits late 1970s, move through a decaying London, where she is constantly forced to contend with the pranks of a group of punky nihilists. The Last of England is a poetic and partly satirical meditation on the atmosphere of Thatcher’s England and its resurgent homophobia. In Imagining October, he draws drew parallels he perceived between Stalin\'s Russia and Thatcher\'s Britain',
    themes: [],
    insight: '',
    audioTrack: 'era2.mp3',
    audioLabel: '',
    filmNames: ["Jubilee", "The Last of England", "Imagining October"],
  },
  {
    id: 'blue',
    roman: 'III',
    yearRange: [1993, 1993],
    title: 'Blue',
    titleAccent: 'Jarman\'s telling of his own death',
    tagline: '',
    quote: { text: 'In the roaring waters I hear the voices of dead friends Love is life that lasts forever. My heart\'s memory turns to you David. Howard. Graham. Terry. Paul.', attribution: 'Derek Jarman' },
    lede: 'While Jarman was losing his sight and dying of AIDS-related complications, he describes his life and vision. He wrote straightforwardly about his body and the illnesses besieging it: the night sweats, aching glands, headaches and ‘scrambled reflexes’. The film is an unflinching account of his fear, uncertainty and courage in the face of impending death.',
    themes: [],
    insight: '',
    audioTrack: 'era3.mp3',
    audioLabel: '',
    filmNames: ["Blue"],
  },
  
]

const DIRECTOR_NAME = 'Derek Jarman'

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
    getKey: () => 'stories:jarman',
  }
)
