import { useEffect, useState } from 'react'
import profile from '../../content/profile.json'

const LEVEL_COLORS = ['bg-line', 'bg-moss/25', 'bg-moss/50', 'bg-moss/75', 'bg-moss']

function extractUsername(githubUrl) {
  try {
    const url = new URL(githubUrl)
    if (url.hostname !== 'github.com') return null
    const [username] = url.pathname.split('/').filter(Boolean)
    return username || null
  } catch {
    return null
  }
}

function buildWeeks(contributions) {
  const weeks = []
  let currentWeek = []

  contributions.forEach((day, index) => {
    currentWeek.push(day)
    const weekday = new Date(day.date).getDay()
    if (weekday === 6 || index === contributions.length - 1) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  })

  return weeks
}

function computeStreak(contributions) {
  let streak = 0
  for (let i = contributions.length - 1; i >= 0; i -= 1) {
    if (contributions[i].count > 0) streak += 1
    else break
  }
  return streak
}

export default function GithubHeatmap() {
  const username = extractUsername(profile.links.github)
  const [state, setState] = useState({ status: username ? 'loading' : 'unconfigured' })

  useEffect(() => {
    if (!username) return
    const controller = new AbortController()

    fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Request failed')
        return res.json()
      })
      .then((data) => {
        setState({
          status: 'ready',
          weeks: buildWeeks(data.contributions),
          total: data.total?.lastYear ?? data.contributions.reduce((sum, d) => sum + d.count, 0),
          streak: computeStreak(data.contributions),
        })
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ status: 'error' })
      })

    return () => controller.abort()
  }, [username])

  if (state.status === 'unconfigured') {
    return (
      <div className="rounded-xl border border-dashed border-line p-6 text-sm text-faint">
        NEEDS_INPUT: connect a GitHub profile URL in profile.json to enable the contribution heatmap.
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-xl border border-dashed border-line p-6 text-sm text-faint">
        Couldn't load GitHub contributions right now.
      </div>
    )
  }

  if (state.status === 'loading') {
    return <div className="h-32 animate-pulse rounded-xl bg-line/40" aria-hidden="true" />
  }

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-2" role="img" aria-label="GitHub contribution heatmap">
        {state.weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.count} contributions on ${day.date}`}
                className={`h-2.5 w-2.5 rounded-sm ${LEVEL_COLORS[day.level] ?? LEVEL_COLORS[0]}`}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="mt-3 font-mono text-sm text-faint">
        {state.total.toLocaleString()} contributions in the last year · {state.streak}-day streak
      </p>
    </div>
  )
}
