import { useEffect, useState } from 'react'
import profile from '../content/profile.json'

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

export default function useGithubContributions() {
  const username = extractUsername(profile.links.github)
  const [state, setState] = useState({ status: username ? 'loading' : 'hidden' })

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

  return state
}
