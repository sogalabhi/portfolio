import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '../../lib/gsap'
import useReducedMotion from '../../hooks/useReducedMotion'
import profile from '../../content/profile.json'

const LEVEL_COLORS = ['bg-line', 'bg-moss/25', 'bg-moss/50', 'bg-moss/75', 'bg-moss']
const CACHE_TTL = 24 * 60 * 60 * 1000

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

function isValidPayload(data) {
  return data && Array.isArray(data.contributions) && data.contributions.length > 0
}

function readyStateFrom(data) {
  return {
    status: 'ready',
    weeks: buildWeeks(data.contributions),
    total: data.total?.lastYear ?? data.contributions.reduce((sum, d) => sum + d.count, 0),
    streak: computeStreak(data.contributions),
  }
}

function readCache(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, cachedAt: Date.now() }))
  } catch {
    // localStorage unavailable (private mode, quota) — skip caching silently
  }
}

export default function GithubHeatmap() {
  const username = extractUsername(profile.links.github)
  const [state, setState] = useState({ status: username ? 'loading' : 'hidden' })
  const gridRef = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!username) return undefined

    const cacheKey = `gh-contrib-${username}`
    const cached = readCache(cacheKey)
    const isFresh = cached && Date.now() - cached.cachedAt < CACHE_TTL

    if (isFresh && isValidPayload(cached.data)) {
      setState(readyStateFrom(cached.data))
      return undefined
    }

    const controller = new AbortController()

    fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Request failed')
        return res.json()
      })
      .then((data) => {
        if (!isValidPayload(data)) throw new Error('Malformed payload')
        writeCache(cacheKey, data)
        setState(readyStateFrom(data))
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        if (cached && isValidPayload(cached.data)) {
          setState(readyStateFrom(cached.data))
        } else {
          setState({ status: 'hidden' })
        }
      })

    return () => controller.abort()
  }, [username])

  useGSAP(
    () => {
      if (state.status !== 'ready' || reduced) return
      const cells = gsap.utils.toArray('[data-heatmap-cell]', gridRef.current)
      if (!cells.length) return

      gsap.from(cells, {
        opacity: 0,
        duration: 0.3,
        ease: 'power1.out',
        stagger: { each: 0.002, from: 'start' },
      })
    },
    { scope: gridRef, dependencies: [state.status, reduced] },
  )

  if (state.status === 'hidden' || state.status === 'loading') {
    return state.status === 'loading' ? (
      <div className="h-32 animate-pulse rounded-xl bg-line/40" aria-hidden="true" />
    ) : null
  }

  return (
    <div ref={gridRef} className="print:hidden">
      <div
        ref={(el) => {
          if (el) el.scrollLeft = el.scrollWidth
        }}
        className="flex gap-1 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]"
        role="img"
        aria-label={`GitHub contribution heatmap: ${state.total.toLocaleString()} contributions in the last year, ${state.streak}-day current streak`}
      >
        {state.weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                data-heatmap-cell
                title={`${day.count} contributions on ${day.date}`}
                className={`h-2.5 w-2.5 shrink-0 rounded-sm ${LEVEL_COLORS[day.level] ?? LEVEL_COLORS[0]}`}
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
