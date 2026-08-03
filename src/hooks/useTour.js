import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsap'
import tourContent from '../content/tour.json'
import useReducedMotion from './useReducedMotion'

const DWELL_MS = 5000
const NAV_HEIGHT = 80
const SCROLL_EXIT_THRESHOLD = 40

const stops = tourContent.stops

export default function useTour() {
  const [state, setState] = useState('idle') // 'idle' | 'running' | 'paused'
  const [index, setIndex] = useState(0)
  const [navVersion, setNavVersion] = useState(0)
  const reduced = useReducedMotion()

  const indexRef = useRef(0)
  const stateRef = useRef(state)
  stateRef.current = state

  const tweenRef = useRef(null)
  const dwellTimeoutRef = useRef(null)
  const dwellStartedAtRef = useRef(0)
  const dwellRemainingRef = useRef(DWELL_MS)
  const isProgrammaticScrollRef = useRef(false)
  const lastKnownScrollYRef = useRef(0)

  const clearDwellTimer = () => {
    if (dwellTimeoutRef.current) {
      clearTimeout(dwellTimeoutRef.current)
      dwellTimeoutRef.current = null
    }
  }

  const goToIndex = useCallback((i) => {
    const clamped = Math.max(0, Math.min(i, stops.length - 1))
    indexRef.current = clamped
    setIndex(clamped)
    setNavVersion((v) => v + 1)
  }, [])

  const advance = useCallback(() => {
    const next = indexRef.current + 1
    if (next >= stops.length) {
      setState('idle')
      return
    }
    goToIndex(next)
  }, [goToIndex])

  const scheduleDwell = useCallback(
    (ms) => {
      clearDwellTimer()
      dwellStartedAtRef.current = Date.now()
      dwellRemainingRef.current = ms
      dwellTimeoutRef.current = setTimeout(advance, ms)
    },
    [advance],
  )

  const scrollToStop = useCallback(
    (i) => {
      const stop = stops[i]
      const target = stop && document.querySelector(stop.target)
      if (!target) return

      clearDwellTimer()
      tweenRef.current?.kill()
      isProgrammaticScrollRef.current = true

      tweenRef.current = gsap.to(window, {
        duration: reduced ? 0 : 0.8,
        ease: 'power2.inOut',
        scrollTo: { y: target, offsetY: NAV_HEIGHT + 24 },
        onComplete: () => {
          lastKnownScrollYRef.current = window.scrollY
          isProgrammaticScrollRef.current = false
          if (stateRef.current === 'running') scheduleDwell(DWELL_MS)
        },
      })
    },
    [reduced, scheduleDwell],
  )

  const start = useCallback(() => {
    indexRef.current = 0
    setIndex(0)
    setState('running')
    setNavVersion((v) => v + 1)
  }, [])

  const exit = useCallback(() => {
    clearDwellTimer()
    tweenRef.current?.kill()
    setState('idle')
  }, [])

  const pause = useCallback(() => {
    if (stateRef.current !== 'running') return
    const elapsed = Date.now() - dwellStartedAtRef.current
    dwellRemainingRef.current = Math.max(dwellRemainingRef.current - elapsed, 0)
    clearDwellTimer()
    setState('paused')
  }, [])

  const resume = useCallback(() => {
    if (stateRef.current !== 'paused') return
    setState('running')
    scheduleDwell(dwellRemainingRef.current || DWELL_MS)
  }, [scheduleDwell])

  const next = useCallback(() => goToIndex(indexRef.current + 1), [goToIndex])
  const prev = useCallback(() => goToIndex(indexRef.current - 1), [goToIndex])

  const goTo = useCallback(
    (i) => {
      setState((s) => (s === 'paused' ? 'running' : s))
      goToIndex(i)
    },
    [goToIndex],
  )

  // scroll to the active stop whenever navigation is explicitly requested
  useEffect(() => {
    if (stateRef.current === 'idle') return undefined
    scrollToStop(indexRef.current)
    return () => {
      clearDwellTimer()
      tweenRef.current?.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navVersion])

  // pause dwell timer while the tab is hidden; resume with remaining time
  useEffect(() => {
    if (state === 'idle') return undefined

    const handleVisibility = () => {
      if (document.hidden) {
        if (state === 'running') {
          const elapsed = Date.now() - dwellStartedAtRef.current
          dwellRemainingRef.current = Math.max(dwellRemainingRef.current - elapsed, 0)
          clearDwellTimer()
        }
      } else if (state === 'running' && !dwellTimeoutRef.current) {
        scheduleDwell(dwellRemainingRef.current || DWELL_MS)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [state, scheduleDwell])

  // exit on manual scroll (wheel/touch/scrollbar), ignoring our own programmatic scrollTo
  useEffect(() => {
    if (state === 'idle') return undefined

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return
      const delta = Math.abs(window.scrollY - lastKnownScrollYRef.current)
      if (delta > SCROLL_EXIT_THRESHOLD) exit()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [state, exit])

  // keyboard: Esc exits, arrows move between stops
  useEffect(() => {
    if (state === 'idle') return undefined

    const handleKey = (e) => {
      if (e.key === 'Escape') exit()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [state, exit, next, prev])

  return {
    state,
    index,
    stops,
    start,
    exit,
    pause,
    resume,
    next,
    prev,
    goTo,
  }
}
