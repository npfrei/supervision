type EraDef = {
  id: 'fiction-epics' | 'doc-war' | 'doc-people' | 'doc-nature'
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
    id: 'fiction-epics',
    roman: 'I',
    yearRange: [1972, 1987],
    title: 'Ironic Epics:',
    titleAccent: 'Critiques of Western Colonialism',
    tagline: '',
    quote: { text: 'To Fitzcarraldo, the Conquistador of the Useless!', attribution: 'Rubber Baron, Fitzcarraldo' },
    lede: 'Herzog shows the horrors of Colonialism through the cruelty and vanity of the people who lead it, always depicted by long-time collaborator Klaus Kinski. Conquistadors come for the rest of the planet, but end up being nothing but poison for everyone else while also destroying themselves in Aguirre. Fitzcarraldo highlights the ego, self-delusion, and the total lack of empathy towards indigenous people of a Rubber Baron. Cobra Verde shows the horrors and cruelty of the slave trade. ',
    themes: [],
    insight: '',
    audioTrack: 'era1.mp3',
    audioLabel: '',
    filmNames: ["Fitzcarraldo", "Aguirre, the Wrath of God", "Cobra Verde"],
  },
  {
    id: 'doc-war',
    roman: 'II',
    yearRange: [1976, 2009],
    title: 'Depressing Stories:',
    titleAccent: 'The Bleakness of Human Condition',
    tagline: '',
    quote: { text: 'Every Man for Himself and God Against All', attribution: 'Werner Herzog' },
    lede: 'Nosferatu is doomed to experience life for all eternity without anyone to love him. Stroszek suffers through all the pain and desillusion of modern American society. Heart of glass depicts a small Bavarian village that falls into depression beucase of a mysterious death. These movies represent Herzog deep-rooted nihilism, but also his ability to highlight some of the profoundly broken aspects of modern Western society.',
    themes: [],
    insight: '',
    audioTrack: 'era2.mp3',
    audioLabel: '',
    filmNames: ["Heart of Glass", "Nosferatu the Vampyre", "Stroszek", "Bad Lieutenant: Port of Call – New Orleans"],
  },
  {
    id: 'doc-people',
    roman: 'III',
    yearRange: [2000, 2012],
    title: 'Documentaries:',
    titleAccent: 'People',
    tagline: '',
    quote: { text: 'Making purely factual films has never interested me. Truth does not necessarily have to agree with facts. Otherwise, the Manhattan phone book would be The Book of Books. Four million entries, all factually correct, all subject to confirmation. But that doesn’t tell us anything about one of the dozens of James Millers in there. His number and address are indeed correct. But why does he cry into his pillow every night?', attribution: 'Werner Herzog' },
    lede: 'Herzog’s documentary is primarly defined by a voiceover narration, always through Herzog’s own voice, which expresses the filmmaker’s personal meditation and point of view on the film’s images. Most of them, while usually being about "remarkable" people, do not focus on their actions but reflect on their inner-workings and sufferings.\n He shows how a community of deaf and blind people live in a world they cannot perceive in Land of Silence and Darkness. In Woodcarver Steiner, he shows the frustrations of a Ski Jumper, who only wishes to feel the ecstasy of flying, with a competive environment that constantly endangers his safety. Grizzly Man depicts the delusions of man eaten by the bears he tought he had befriended. God’s Angry Man and Huie’s Sermon explore the language and communication used by religious leaders.',
    themes: [],
    insight: '',
    audioTrack: 'era3.mp3',
    audioLabel: '',
    filmNames: ["Grizzly Man", "Land of Silence and Darkness", "The Great Ecstasy of Woodcarver Steiner","God\'s Angry Man"],
  },
  {
    id: 'doc-nature',
    roman: 'IV',
    yearRange: [2013, 2022],
    title: 'Documentaries:',
    titleAccent: 'Nature',
    tagline: '',
    quote: { text: 'The universe is monstrously indifferent to the presence of man', attribution: 'Werner Herzog' },
    lede: 'Herzog also loves to investigate the connection between nature and human beings, through constantly burning oil fields after the first Gulf wars in Lessons of Darkness, the dreams and aspirations of the people living in the Antarctic in Encounters at the End of the World or the testomonies of the people who have chosen to stay near a Volcano that is about to erupt in La Soufrière',
    themes: [],
    insight: '',
    audioTrack: 'era4.mp3',
    audioLabel: '',
    filmNames: ["La Soufrière: Waiting for an Inevitable Catastrophe", "Lessons of Darkness", "Encounters at the End of the World"],
  },
]

const DIRECTOR_NAME = 'Werner Herzog'

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
    getKey: () => 'stories:herzog',
  }
)
