type EraDef = {
  id: 'i' | 'ii' | 'iii' | 'iv'
  roman: 'I' | 'II' | 'III' | 'IV'
  yearRange: [number, number]
  title: string
  titleAccent: string
  quote: { text: string; attribution: string }
  lede: string
  themes: string[]
  audioTrack: string
  audioLabel: string
}

const ERAS: EraDef[] = [
  {
    id: 'i',
    roman: 'I',
    yearRange: [1967, 1976],
    title: 'Mean streets,',
    titleAccent: 'Little Italy',
    quote: {
      text: "You don’t make up for your sins in church. You do it in the streets.",
      attribution: 'Charlie, Mean Streets',
    },
    lede: 'A boy from Elizabeth Street trades the seminary for a 16mm camera. With Keitel as his first leading man and a young De Niro arriving for Mean Streets, he turns his own block into a stage for Catholic guilt, the saints of the neighborhood, and a violence that never feels stylised.',
    themes: ['Catholic guilt', 'Street violence', 'New York neighborhoods'],
    audioTrack: 'era1-sirens-steam.mp3',
    audioLabel: 'Sirens & steam',
  },
  {
    id: 'ii',
    roman: 'II',
    yearRange: [1977, 1990],
    title: 'The De Niro',
    titleAccent: 'decade',
    quote: {
      text: 'I coulda been a contender. I coulda been somebody.',
      attribution: 'Raging Bull',
    },
    lede: 'Eight features in fourteen years, six of them with De Niro. Raging Bull burns black-and-white into a self-portrait of male self-destruction; The King of Comedy turns celebrity into a hostage crisis; GoodFellas closes the decade with a confession spoken straight to camera. His parents, Catherine and Charles, keep turning up in small parts, a quiet family Greek chorus.',
    themes: ['Masculine self-destruction', 'Celebrity & spectacle', 'The American underworld'],
    audioTrack: 'era2-brass-bell.mp3',
    audioLabel: 'Brass at the bell',
  },
  {
    id: 'iii',
    roman: 'III',
    yearRange: [1991, 2001],
    title: 'A wandering',
    titleAccent: 'nineties',
    quote: {
      text: 'We had it all, just for us. And then we threw it all away.',
      attribution: 'Casino',
    },
    lede: 'He tries on every genre at once: Edwardian drawing room in The Age of Innocence, psychological thriller in Cape Fear, Vegas epic in Casino, Tibetan biopic in Kundun, Manhattan night-shift fever dream in Bringing Out the Dead. The decade looks restless because it is: a director searching for the next collaborator while De Niro fades back and DiCaprio hasn’t yet arrived.',
    themes: ['Genre restlessness', 'Faith & doubt', 'Costume as character'],
    audioTrack: 'era3-cathedral.mp3',
    audioLabel: 'Cathedral reverb',
  },
  {
    id: 'iv',
    roman: 'IV',
    yearRange: [2002, 2030],
    title: 'Hollywood,',
    titleAccent: 'the late epics',
    quote: {
      text: 'The past is whatever the records say it is.',
      attribution: 'Killers of the Flower Moon',
    },
    lede: 'DiCaprio replaces De Niro as the leading man, and the films grow bigger, slower, more historical. The Departed finally wins the Oscar. The Wolf of Wall Street turns excess into a three-hour confession. The Irishman and Killers of the Flower Moon are confessions of a different kind: a filmmaker in his eighties asking who paid for all this American success.',
    themes: ['American mythmaking', 'The cost of ambition', 'The long take, the long life'],
    audioTrack: 'era4-low-strings.mp3',
    audioLabel: 'Low strings',
  },
]

const DIRECTOR_NAME = 'Martin Scorsese'

export default defineCachedEventHandler(
  async () => {
    const db = useDb()

    const filmsSQL = `
      SELECT m.id, m.name, m.date, p.link AS poster, m.rating
      FROM movies m
      LEFT JOIN posters p ON m.id = p.id
      WHERE m.id IN (SELECT id FROM crew WHERE name = ? AND role = 'Director')
        AND m.date >= ? AND m.date <= ?
        AND p.link IS NOT NULL
        AND m.rating IS NOT NULL
      ORDER BY m.rating DESC
      LIMIT 3
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
        const [filmsRes, troupeRes] = await Promise.all([
          db.execute({ sql: filmsSQL, args: [DIRECTOR_NAME, era.yearRange[0], era.yearRange[1]] }),
          db.execute({
            sql: troupeSQL,
            args: [DIRECTOR_NAME, era.yearRange[0], era.yearRange[1], DIRECTOR_NAME],
          }),
        ])

        return {
          ...era,
          films: filmsRes.rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            year: r.date ? Math.trunc(Number(r.date)) : null,
            poster: r.poster || null,
          })),
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
    getKey: () => 'stories:scorsese',
  }
)
